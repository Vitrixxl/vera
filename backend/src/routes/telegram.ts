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
    await Bun.write(`body${count}.json`, JSON.stringify(body, null, 2));
    const message = (body as any).message as TelegramMessage;
    let files: Bun.BunFile[] = [];
    if (message.photo) {
      const file = await downloadTelegramFile(
        message.photo[message.photo.length - 1].file_id,
      );
      files.push(file);
    }
    if (message.video) {
      const file = await downloadTelegramFile(message.video.file_id);
      files.push(file);
    }
    let prompt = "";
    if (message.caption) {
      prompt = message.caption;
    }
    if (message.text) {
      prompt = message.text;
    }
    const extractor = new Extractor();
    let veraResponse = "";
    for await (const data of extractor.decrypt(prompt, files)) {
      if (data.type != "token") continue;
      veraResponse += data.data;
    }
    await sendTelegramMessage(message.chat.id, veraResponse);
  },
);
