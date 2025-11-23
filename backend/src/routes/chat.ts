import { chatMessageHandler } from "@backend/extractor/adapters/chat";
import { Elysia, t, sse } from "elysia";

export const webAppRoutes = new Elysia({ prefix: "/chat" }).post(
  "/message",
  async function* ({ body: { message, files } }) {
    const bunFiles: Bun.BunFile[] = [];
    for (const f of files) {
      const file = Bun.file(`/tmp/${Bun.randomUUIDv7()}-${f.name}`);
      file.write(await f.arrayBuffer());
      bunFiles.push(file);
    }
    for await (const event of chatMessageHandler({
      message,
      files: bunFiles,
    })) {
      yield sse(event);
    }
    await Promise.all(bunFiles.map((f) => f.delete()));
  },
  {
    body: t.Object({
      message: t.String(),
      files: t.Files({
        type: [
          "video/mp4",
          "image/png",
          "image/jpeg",
          "image/webp",
          "video/webm",
        ],
      }),
    }),
  },
);
