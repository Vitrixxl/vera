import { db } from "@backend/lib/db";
import { survey } from "@backend/lib/db/schema";
import { authMacro } from "@backend/macros/auth";
import {
  getSurveyCount,
  getSurveys,
  getSurveysAvgNote,
} from "@backend/services/survey";
import Elysia from "elysia";
import z from "zod";

export const surveyRoutes = new Elysia({ prefix: "/survey" })
  .use(authMacro)
  .get(
    "/surveys",
    async ({ query: { limit, cursor } }) => {
      console.log("surveys");
      const surveys = await getSurveys(limit + 1, cursor);
      return {
        surveys: surveys.slice(0, limit),
        nextCursor: surveys.length > limit ? cursor + limit : null,
      };
    },
    {
      query: z.object({
        limit: z.coerce.number().default(10),
        cursor: z.coerce.number().default(0),
      }),
    },
  )
  .get("/avg", async () => {
    return await getSurveysAvgNote();
  })
  .get("/total", async () => {
    return await getSurveyCount();
  })
  .post(
    "/",
    async ({ body: { note, commentary } }) => {
      console.log({ note, commentary });
      const a = await db
        .insert(survey)
        .values({ note, commentary })
        .returning({ id: survey.id });
      console.log(a);
    },
    {
      body: z.object({
        note: z.number(),
        commentary: z.string().nullable(),
      }),
    },
  );
