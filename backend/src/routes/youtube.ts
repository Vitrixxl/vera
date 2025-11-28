import { Extractor } from "@backend/extractor/extractor";
import Elysia from "elysia";
import { fetchTranscript } from "youtube-transcript-plus";

import z from "zod";

export const youtubeRoutes = new Elysia({ prefix: "youtube" }).get(
  "/:id",
  async ({ params: { id } }) => {
    const transcripts = await fetchTranscript(id);

    const videoTranscription = transcripts.map((t) => t.text).join("");

    const extractor = new Extractor();
    extractor.decrypt(videoTranscription, []);
  },
  {
    params: z.object({ id: z.string() }),
  },
);
