import { db } from "@backend/lib/db";
import { Question, question } from "@backend/lib/db/schema";
import { generateEmbedding } from "@backend/lib/utils";
import { cosineDistance, getTableColumns, sql, gt } from "drizzle-orm";

export const getSimilarQuestions = async (
  query: string,
): Promise<Question[]> => {
  const embedding = await generateEmbedding(query);
  const similarity = sql<number>`1 - (${cosineDistance(question.embedding, embedding)})`;

  const questions = db
    .select({ ...getTableColumns(question), similarity })
    .from(question)
    .where(gt(similarity, 0.5))
    .orderBy((t) => t.similarity)
    .limit(10);
  return questions;
};
