import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";

const bot = new Telegraf(Bun.env["TG_BOT_TOKEN"] as string);

bot.on(message("media_group_id"), async (ctx) => {
  ctx.message.media_group_id;
});

export const sendTelegramMessage = async (chatId: string, content: string) => {
  const url = `https://api.telegram.org/bot${Bun.env["BOT_TOKEN"]}/sendMessage`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: content,
    }),
  });

  const data = await res.json();

  if (!data.ok) {
    throw new Error("Erreur API Telegram : " + JSON.stringify(data));
  }
};
