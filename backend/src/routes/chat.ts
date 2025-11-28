import { Extractor } from "@backend/extractor/extractor";
import { db } from "@backend/lib/db";
import { question } from "@backend/lib/db/schema";
import { generateEmbedding } from "@backend/lib/utils";
import { updateHotQuestion } from "@backend/services/questions";
import { Elysia, t, sse } from "elysia";

export const webAppRoutes = new Elysia({ prefix: "/chat" }).post(
  "/message",
  async function* ({ body: { message, files } }) {
    const bunFiles: Bun.BunFile[] = [];
    const extractor = new Extractor();
    if (files) {
      for (const f of files) {
        const file = Bun.file(`/tmp/${Bun.randomUUIDv7()}-${f.name}`);
        file.write(await f.arrayBuffer());
        bunFiles.push(file);
      }
    }
    for await (const event of extractor.decrypt(message, bunFiles)) {
      yield sse(JSON.stringify(event));
    }
    await Promise.all(bunFiles.map((f) => f.delete()));
    let embedding: number[] | null = null;
    if (message.trim() != "") {
      embedding = await generateEmbedding(message);
    }
    await db.insert(question).values({
      question: message,
      embedding,
    });
    updateHotQuestion();
  },
  {
    body: t.Object({
      message: t.String(),
      files: t.Optional(
        t.Files({
          type: [
            "video/mp4",
            "image/png",
            "image/jpeg",
            "image/webp",
            "video/webm",
          ],
        }),
      ),
    }),
  },
);
