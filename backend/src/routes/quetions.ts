import { authMacro } from "@backend/macros/auth";
import {
  getHotQuestions,
  getSimilarQuestions,
  updateHotQuestion,
  getLatestQuestions,
  getQuestionsStats,
} from "@backend/services/questions";
import Elysia from "elysia";
import z from "zod";

type WS = {
  send: (data: any) => void;
  readyState: number;
};

export const questionsWsSet = new Set<WS>();

const sendWsData = (ws: WS, key: string, data: any) => {
  ws.send({
    key,
    payload: data,
  });
};

export const broadcastNewQuestion = (question: any, stats: any) => {
  questionsWsSet.forEach((ws) => {
    if (ws.readyState !== 1) return;
    sendWsData(ws, "new-question", { newQuestion: question, newStats: stats });
  });
};

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
  .get(
    "/latest",
    async ({ query: { limit, cursor } }) => {
      return await getLatestQuestions(limit, cursor);
    },
    {
      query: z.object({
        limit: z.coerce.number().default(10),
        cursor: z.coerce.number().default(0),
      }),
    },
  )
  .get("/stats", async () => {
    return await getQuestionsStats();
  })
  .post(
    "/hot/generate",
    async () => {
      await updateHotQuestion();
      return { success: true };
    },
    { auth: true },
  )
  .ws("/ws", {
    open: (ws) => {
      questionsWsSet.add(ws);
    },
    close: (ws) => {
      questionsWsSet.delete(ws);
    },
  });
