import Elysia from "elysia";

export const tiktokRoutes = new Elysia({ prefix: "/webhook/tiktok" }).post(
  "/",
  ({ body }) => {
    console.log({ body });
  },
);
