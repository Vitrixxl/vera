import Elysia from "elysia";
import { auth } from "../lib/auth";

export const authMacro = new Elysia().macro({
  auth: {
    async resolve({ status, request: { headers } }) {
      const session = await auth.api.getSession({
        headers,
      });
      if (!session) {
        return status(401, {
          message: "Unauthorized",
        });
      }
      return {
        user: session.user,
        session: session.session,
      };
    },
  },
});
