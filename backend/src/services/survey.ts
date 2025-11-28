import { db } from "@backend/lib/db";
import { InsertSurvey, Survey, survey } from "@backend/lib/db/schema";
import { generateEmbedding } from "@backend/lib/utils";
import {
  cosineDistance,
  count,
  desc,
  getTableColumns,
  sql,
  gt,
} from "drizzle-orm";

export const insertSurvey = async (
  surveyData: Omit<InsertSurvey, "commentEmbedding" | "id">,
) => {
  let embedding: number[] | null = null;
  if (surveyData.q13Comment) {
    embedding = await generateEmbedding(surveyData.q13Comment);
  }
  return await db
    .insert(survey)
    .values({ ...surveyData, commentEmbedding: embedding })
    .returning({ id: survey.id });
};

export const getSimilarSurveys = async (query: string): Promise<Survey[]> => {
  const embedding = await generateEmbedding(query);
  const similarity = sql<number>`1 - (${cosineDistance(survey.commentEmbedding, embedding)})`;

  const { commentEmbedding: _, ...rest } = survey;
  const surveys = db

    .select({ ...getTableColumns(rest), similarity })
    .from(survey)
    .where(gt(similarity, 0.8))
    .orderBy((t) => t.similarity)
    .limit(10);
  return surveys;
};

export const getSurveys = async (limit: number, cursor: number) => {
  return await db.query.survey.findMany({
    columns: {
      commentEmbedding: false,
    },
    limit,
    offset: cursor,
    orderBy: desc(survey.createdAt),
  });
};

export const getSurveyCount = async () => {
  const result = await db.select({ count: count(survey.id) }).from(survey);
  if (!result || result.length == 0) return 0;
  return result[0].count;
};

export const getSurveyStats = async () => {
  const surveys = await db.select().from(survey);
  const total = surveys.length;

  if (total === 0) {
    return {
      total: 0,
      avgExperienceRating: 0,
      recommendRate: 0,
      reuseRate: 0,
      distributions: {
        q1Channels: {},
        q2QuestionsCount: {},
        q3Clarity: {},
        q4Reliability: {},
        q5ExperienceRating: {},
        q6Liked: {},
        q7Improvements: {},
        q8Reuse: {},
        q9Recommend: {},
        q10BehaviorChange: {},
        q11BadgeFeature: {},
        q12Discovery: {},
      },
    };
  }

  // Calculate average experience rating (Q5)
  const avgRating =
    surveys.reduce((sum, s) => sum + s.q5ExperienceRating, 0) / total;

  // Calculate recommend rate (Q9: yes_certainly + yes_probably)
  const recommendCount = surveys.filter(
    (s) =>
      s.q9Recommend === "yes_certainly" || s.q9Recommend === "yes_probably",
  ).length;
  const recommendRate = (recommendCount / total) * 100;

  // Calculate reuse rate (Q8: yes_always + yes_sometimes)
  const reuseCount = surveys.filter(
    (s) => s.q8Reuse === "yes_always" || s.q8Reuse === "yes_sometimes",
  ).length;
  const reuseRate = (reuseCount / total) * 100;

  // Calculate distributions for each question
  const distributions = {
    q1Channels: countArrayValues(surveys.map((s) => s.q1Channels).flat()),
    q2QuestionsCount: countValues(surveys.map((s) => s.q2QuestionsCount)),
    q3Clarity: countValues(surveys.map((s) => s.q3Clarity)),
    q4Reliability: countValues(surveys.map((s) => s.q4Reliability)),
    q5ExperienceRating: countValues(
      surveys.map((s) => s.q5ExperienceRating.toString()),
    ),
    q6Liked: countArrayValues(surveys.map((s) => s.q6Liked).flat()),
    q7Improvements: countArrayValues(
      surveys.map((s) => s.q7Improvements).flat(),
    ),
    q8Reuse: countValues(surveys.map((s) => s.q8Reuse)),
    q9Recommend: countValues(surveys.map((s) => s.q9Recommend)),
    q10BehaviorChange: countValues(surveys.map((s) => s.q10BehaviorChange)),
    q11BadgeFeature: countValues(surveys.map((s) => s.q11BadgeFeature)),
    q12Discovery: countValues(surveys.map((s) => s.q12Discovery)),
  };

  return {
    total,
    avgExperienceRating: Math.round(avgRating * 10) / 10,
    recommendRate: Math.round(recommendRate),
    reuseRate: Math.round(reuseRate),
    distributions,
  };
};

// Helper to count occurrences of values
function countValues(arr: string[]): Record<string, number> {
  return arr.reduce(
    (acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
}

// Helper to count occurrences in flattened arrays
function countArrayValues(arr: string[]): Record<string, number> {
  return arr.reduce(
    (acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
}
