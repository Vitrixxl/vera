import { FileInfo } from "@backend/types";

export const sendTelegramMessage = async (chatId: number, content: string) => {
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

export const downloadTelegramFile = async (fileId: string) => {
  const res = await fetch(
    `https://api.telegram.org/bot${Bun.env["TG_BOT_TOKEN"]}/getFile?file_id=${fileId}`,
  );

  const data = (await res.json()) as FileInfo;
  if (!data.ok || !data.result.file_path)
    throw new Error("Error while retriving file info");

  const parts = data.result.file_path.split("/");
  const tempFile = Bun.file(
    `/tmp/${Bun.randomUUIDv7()}-${parts[parts.length - 1]}`,
  );
  const fileRes = await fetch(
    `https://api.telegram.org/file/bot${Bun.env["TG_BOT_TOKEN"]}/${data.result.file_path}`,
  );

  tempFile.write(fileRes);
  return tempFile;
};
