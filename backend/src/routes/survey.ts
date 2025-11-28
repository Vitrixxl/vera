import { tryCatchAsync } from "@backend/lib/utils";
import { authMacro } from "@backend/macros/auth";
import {
  exportToCSV,
  getSimilarSurveys,
  getSurveyCount,
  getSurveys,
  getSurveyStats,
  insertSurvey,
} from "@backend/services/survey";
import { google } from "googleapis";
import Elysia from "elysia";
import z from "zod";

type WS = Parameters<NonNullable<Parameters<Elysia["ws"]>[1]["open"]>>[0];

// Zod schemas for validation
const q1ChannelSchema = z.enum(["whatsapp", "instagram", "phone", "website"]);
const q2QuestionsCountSchema = z.enum(["1", "2-3", "4-5", "5+"]);
const q3ClaritySchema = z.enum([
  "clear",
  "technical",
  "difficult",
  "no_response",
]);
const q4ReliabilitySchema = z.enum([
  "yes_totally",
  "yes_rather",
  "not_really",
  "no",
  "need_verify",
]);
const q5ExperienceRatingSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);
const q6LikedSchema = z.enum([
  "speed",
  "sources",
  "free",
  "simple",
  "accessible",
  "neutral",
]);
const q7ImprovementSchema = z.enum([
  "faster",
  "design",
  "clarity",
  "explanations",
  "followup",
  "notifications",
  "nothing",
]);
const q8ReuseSchema = z.enum([
  "yes_always",
  "yes_sometimes",
  "maybe",
  "probably_not",
  "certainly_not",
]);
const q9RecommendSchema = z.enum([
  "yes_certainly",
  "yes_probably",
  "maybe",
  "probably_not",
  "certainly_not",
]);
const q10BehaviorChangeSchema = z.enum([
  "yes_systematic",
  "more_careful",
  "not_really",
  "too_early",
]);
const q11BadgeFeatureSchema = z.enum(["love_it", "cool", "meh", "useless"]);
const q12DiscoverySchema = z.enum([
  "questionnaire",
  "landing",
  "instagram",
  "friend",
]);

const surveyBodySchema = z.object({
  q1Channels: z.array(q1ChannelSchema).min(1),
  q2QuestionsCount: q2QuestionsCountSchema,
  q3Clarity: q3ClaritySchema,
  q4Reliability: q4ReliabilitySchema,
  q5ExperienceRating: q5ExperienceRatingSchema,
  q6Liked: z.array(q6LikedSchema).min(1),
  q7Improvements: z.array(q7ImprovementSchema).min(1),
  q8Reuse: q8ReuseSchema,
  q9Recommend: q9RecommendSchema,
  q10BehaviorChange: q10BehaviorChangeSchema,
  q11BadgeFeature: q11BadgeFeatureSchema,
  q12Discovery: q12DiscoverySchema,
  q13Comment: z.string().nullable().optional(),
});

export const wsSet = new Set<WS>();

const FORMS_SCOPE = [
  "https://www.googleapis.com/auth/forms.responses.readonly",
];

export async function getFormsClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: "./vera-accout-key.json",
    scopes: FORMS_SCOPE,
  });

  const { forms } = google.forms({ version: "v1", auth });

  return forms;
}

const forms = await getFormsClient();
const sendWsData = (ws: WS, key: string, data: any) => {
  ws.send({
    key,
    payload: data,
  });
};

export const surveyRoutes = new Elysia({ prefix: "/survey" })
  .use(authMacro)
  .get("/google-surveys", async () => {
    const res = await forms.responses.list({
      formId: "1wQYE3OrsIdWMApe-BcmvhYOjsEFbjqfgcR2Vs6P9G34",
      pageSize: 50,
    });

    return res.data.responses;
  })
  .get(
    "/surveys",
    async ({ query: { limit, cursor } }) => {
      const surveys = await getSurveys(limit + 1, cursor);
      return {
        surveys: surveys.slice(0, limit),
        nextCursor: surveys.length > limit ? cursor + limit : null,
      };
    },
    {
      // auth: true,
      query: z.object({
        limit: z.coerce.number().default(10),
        cursor: z.coerce.number().default(0),
      }),
    },
  )
  .get(
    "/stats",
    async () => {
      return await getSurveyStats();
    },
    // { auth: true },
  )
  .get(
    "/total",
    async () => {
      return await getSurveyCount();
    },
    // { auth: true },
  )
  .post(
    "/",
    async ({ body }) => {
      const { data, error } = await tryCatchAsync(insertSurvey(body));
      if (error) {
        console.error(error);
        throw new Error(error.message);
      }
      const id = data[0].id;
      const newStats = await getSurveyStats();
      const newCount = await getSurveyCount();
      const newSurvey = { id, ...body };
      wsSet.forEach((ws) => {
        if (ws.readyState != 1) return;
        sendWsData(ws, "new-survey", { newStats, newCount, newSurvey });
      });
      return { success: true, id: data[0].id };
    },
    {
      body: surveyBodySchema,
    },
  )
  .get(
    "/searchEmbedding",
    async ({ query: { q } }) => {
      return await getSimilarSurveys(q);
    },
    {
      query: z.object({
        q: z.string(),
      }),
    },
  )
  .get("/csv", async () => {
    const filePath = await exportToCSV();
    return new Response(Bun.file(filePath).stream(), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="surveys_export.csv"`,
      },
    });
  })
  .ws("/ws", {
    open: (ws) => {
      wsSet.add(ws);
    },
    close: (ws) => {
      wsSet.delete(ws);
    },
    // auth: true,
  });
