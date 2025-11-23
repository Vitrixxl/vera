import { Elysia } from "elysia";
import { auth } from "./lib/auth";
import cors from "@elysiajs/cors";
import { webAppRoutes } from "./routes/chat";
import { surveyRoutes } from "./routes/survey";

const app = new Elysia()
  .use(
    cors({
      credentials: true,
    }),
  )

  .mount(auth.handler)
  .use(webAppRoutes)
  .use(surveyRoutes)
  .listen(3000);

export type Api = typeof app;

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
