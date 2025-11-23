import { db } from "@backend/lib/db";
import { survey } from "@backend/lib/db/schema";
import { and, avg, count, desc, gt, lt } from "drizzle-orm";

export const getSurveys = async (
  limit: number,
  cursor: number,
  // { from, to }: { from: Date | null; to: Date | null },
) => {
  return await db.query.survey.findMany({
    // where: and(
    //   from ? gt(survey.createdAt, from) : undefined,
    //   to ? lt(survey.createdAt, to) : undefined,
    // ),
    limit,
    offset: cursor,
    orderBy: desc(survey.createdAt),
  });
};

export const getSurveysAvgNote = async () => {
  const result = await db.select({ avg: avg(survey.note) }).from(survey);
  if (!result || result.length == 0) return null;
  return Number(result[0].avg);
};

export const getSurveyCount = async () => {
  const result = await db.select({ count: count(survey) }).from(survey);
  if (!result || result.length == 0) return null;
  return result[0].count;
};
