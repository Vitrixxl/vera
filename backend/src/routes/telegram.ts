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
import { TelegramMessage, TelegramUpdate } from "@backend/types/telegram";
import Elysia from "elysia";
import { Telegraf } from "telegraf";
import z from "zod";

export const telegramRoutes = new Elysia({ prefix: "/webhook/telegram" }).post(
  "/",
  async ({ body }) => {
    await Bun.write("body.json", JSON.stringify(body, null, 2));
    const message = body.message as TelegramMessage;
    if (!message) {
      return;
    }
    await Bun.write("message.json", JSON.stringify(message, null, 2));
    const extractor = new Extractor();
    let output = "";
    for await (const data of extractor.decrypt(message.text ?? "", [])) {
      if (data.type == "token") {
        output += data.data;
      }
    }

    return output;
  },
  {
    body: z.object<TelegramUpdate>(),
  },
);

const bot = new Telegraf("");
bot.on("message", (ctx) => {});
