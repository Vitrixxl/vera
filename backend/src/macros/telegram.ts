import Elysia from "elysia";

export const telegramAuthMacro = new Elysia().macro({
  telegramAuth: {
    async resolve({ status, request: { headers } }) {
      const apiSecret = headers.get("X-Telegram-Bot-Api-Secret-Token");
      if (!apiSecret || apiSecret != Bun.env["TG_SECRET_TOKEN"]) {
        return status(401, {
          message: "Unauthorized",
        });
      }
    },
  },
});
