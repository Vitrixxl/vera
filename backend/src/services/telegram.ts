import { db } from "@backend/lib/db";
import { telegramMessage } from "@backend/lib/db/schema";
import { FileInfo } from "@backend/types";
import { insertQuestion } from "./questions";

const BOT_TOKEN = Bun.env["TG_BOT_TOKEN"];

export const sendTelegramMessage = async (chatId: number, content: string) => {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

  console.log(
    `[Telegram] Sending message to chat ${chatId}, content length: ${content.length}`,
  );

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
    console.error("[Telegram] Send message error:", JSON.stringify(data));
    throw new Error("Erreur API Telegram : " + JSON.stringify(data));
  }

  console.log("[Telegram] Message sent successfully");
};

export const downloadTelegramFile = async (fileId: string) => {
  console.log(`[Telegram] Downloading file: ${fileId}`);

  const res = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`,
  );

  const data = (await res.json()) as FileInfo;
  if (!data.ok || !data.result.file_path) {
    console.error("[Telegram] Get file error:", JSON.stringify(data));
    throw new Error("Error while retriving file info");
  }

  const parts = data.result.file_path.split("/");
  const tempFile = Bun.file(
    `/tmp/${Bun.randomUUIDv7()}-${parts[parts.length - 1]}`,
  );
  const fileRes = await fetch(
    `https://api.telegram.org/file/bot${BOT_TOKEN}/${data.result.file_path}`,
  );

  const arrayBuffer = await fileRes.arrayBuffer();
  await tempFile.write(arrayBuffer);
  return tempFile;
};

export const insertTelegramMessage = async (id: number, message: string) => {
  await db.insert(telegramMessage).values({ id });
  await insertQuestion(message);
};

export const isAlreadyTreated = async (id: number) => {
  Boolean(
    await db.query.telegramMessage.findFirst({
      where: (t, w) => w.eq(t.id, id),
    }),
  );
};
