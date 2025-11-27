import { db } from "@backend/lib/db";
import { survey } from "@backend/lib/db/schema";
import { authMacro } from "@backend/macros/auth";
import {
  getSurveyCount,
  getSurveys,
  getSurveyStats,
} from "@backend/services/survey";
import Elysia from "elysia";
import z from "zod";

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

export const surveyRoutes = new Elysia({ prefix: "/survey" })
  .use(authMacro)
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
      const result = await db
        .insert(survey)
        .values(body)
        .returning({ id: survey.id });
      console.log("Survey created:", result);
      return { success: true, id: result[0].id };
    },
    {
      body: surveyBodySchema,
    },
  );
