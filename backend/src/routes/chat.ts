import { chatMessageHandler } from "@backend/extractor/adapters/chat";
import { Elysia } from "elysia";
import z from "zod";

export const webAppRoutes = new Elysia({ prefix: "" }).post(
  "/message",
  async ({ body: { message, files } }) => {
    const bunFiles = files.map((f) => {
      const file = Bun.file(`/tmp/${Bun.randomUUIDv7()}-${f.name}`);
      return file;
    });
    const a = chatMessageHandler({ message, files: bunFiles });
    return;
  },
  {
    body: z.object({
      message: z.string(),
      files: z.array(
        z
          .file()
          .mime([
            "video/mp4",
            "image/png",
            "image/jpeg",
            "image/webp",
            "video/webm",
          ]),
      ),
    }),
  },
);
