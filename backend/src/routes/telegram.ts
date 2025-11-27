/**
  * Example de pseudo code pour ce qu'il y a faire 
 * POST /telegram-webhook
    body = JSON du Update Telegram
    chat_id = body.message.chat.id
    text    = body.message.text

    # 1. traiter le message
    reply_text = ma_fonction_de_traitement(text)

    # 2. renvoyer une réponse au user :
    POST https://api.telegram.org/bot<TON_TOKEN>/sendMessage
         { "chat_id": chat_id, "text": reply_text }
 */

import { Extractor } from "@backend/extractor/extractor";
import {
  downloadTelegramFile,
  sendTelegramMessage,
} from "@backend/services/telegram";
import { TelegramMessage } from "@backend/types/telegram";
import Elysia from "elysia";

let count = 0;
export const telegramRoutes = new Elysia({ prefix: "/webhook/telegram" }).post(
  "/",
  async ({ body }) => {
    console.log("[Telegram] Webhook received");
    await Bun.write(`body${count}.json`, JSON.stringify(body, null, 2));
    const message = (body as any).message as TelegramMessage;

    if (!message) {
      console.log("[Telegram] No message in body, skipping");
      return;
    }

    console.log(`[Telegram] Message from chat ${message.chat.id}`);

    let files: Bun.BunFile[] = [];
    if (message.photo) {
      console.log(`[Telegram] Downloading photo (${message.photo.length} sizes available)`);
      const file = await downloadTelegramFile(
        message.photo[message.photo.length - 1].file_id,
      );
      files.push(file);
      console.log(`[Telegram] Photo downloaded: ${file.name}`);
    }
    if (message.video) {
      console.log(`[Telegram] Downloading video`);
      const file = await downloadTelegramFile(message.video.file_id);
      files.push(file);
      console.log(`[Telegram] Video downloaded: ${file.name}`);
    }

    let prompt = "";
    if (message.caption) {
      prompt = message.caption;
    }
    if (message.text) {
      prompt = message.text;
    }
    console.log(`[Telegram] Prompt: "${prompt || "(empty)"}"`);
    console.log(`[Telegram] Files count: ${files.length}`);

    const extractor = new Extractor();
    console.log("[Telegram] Starting extraction pipeline...");

    let veraResponse = "";
    for await (const data of extractor.decrypt(prompt, files)) {
      if (data.type === "step") {
        console.log(`[Telegram] Pipeline step: ${data.data}`);
      }
      if (data.type === "token") {
        veraResponse += data.data;
      }
    }

    console.log(`[Telegram] Vera response length: ${veraResponse.length} chars`);
    console.log("[Telegram] Sending response to user...");

    await sendTelegramMessage(message.chat.id, veraResponse);
    console.log("[Telegram] Response sent successfully");
  },
);
