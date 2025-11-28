import { Elysia } from "elysia";
import { auth } from "./lib/auth";
import cors from "@elysiajs/cors";
import { webAppRoutes } from "./routes/chat";
import { surveyRoutes } from "./routes/survey";
import { telegramRoutes } from "./routes/telegram";
import { questionsRoutes } from "./routes/quetions";

const app = new Elysia({ prefix: "/api" })
  .use(
    cors({
      credentials: true,
    }),
  )

  .mount(auth.handler)
  .use(webAppRoutes)
  .use(surveyRoutes)
  .use(telegramRoutes)
  .use(questionsRoutes)
  .listen(3000);

export type Api = typeof app;

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
