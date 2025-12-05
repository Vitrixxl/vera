import { Extractor } from "@backend/extractor/extractor";
import { insertQuestion, getQuestionsStats } from "@backend/services/questions";
import { broadcastNewQuestion } from "./quetions";
import { Elysia, t, sse } from "elysia";

export const webAppRoutes = new Elysia({ prefix: "/chat" }).post(
  "/message",
  async function* ({ body: { message, files } }) {
    if (message.trim() == "") {
      return null;
    }
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
    const newQuestion = await insertQuestion(message);
    const newStats = await getQuestionsStats();
    broadcastNewQuestion(newQuestion, newStats);
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
