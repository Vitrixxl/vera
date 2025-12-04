import { authMacro } from "@backend/macros/auth";
import {
  getHotQuestions,
  getSimilarQuestions,
  updateHotQuestion,
} from "@backend/services/questions";
import Elysia from "elysia";
import z from "zod";

export const questionsRoutes = new Elysia({ prefix: "/questions" })
  .use(authMacro)
  .get(
    "/search-embegging",
    async ({ query: { q } }) => {
      return await getSimilarQuestions(q);
    },
    {
      query: z.object({
        q: z.string(),
      }),
      auth: true,
    },
  )
  .get("/hot", async () => {
    return getHotQuestions();
  })
  .post(
    "/hot/generate",
    async () => {
      await updateHotQuestion();
      return { success: true };
    },
    { auth: true },
  );
