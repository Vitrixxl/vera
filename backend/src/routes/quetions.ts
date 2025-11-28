import { getSimilarQuestions } from "@backend/services/questions";
import Elysia from "elysia";
import z from "zod";

export const questionsRoutes = new Elysia({ prefix: "questions" }).get(
  "/search-embegging",
  async ({ query: { q } }) => {
    return await getSimilarQuestions(q);
  },
  {
    query: z.object({
      q: z.string(),
    }),
  },
);
