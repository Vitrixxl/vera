import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

const isInDocker = Bun.env["DOCKER"];
export const db = drizzle(
  isInDocker
    ? (Bun.env["DATABASE_URL"] as string)
    : (Bun.env["DATABASE_URL_LOCAL"] as string),
  {
    schema,
  },
);
