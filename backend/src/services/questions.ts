import { db } from "@backend/lib/db";
import { question } from "@backend/lib/db/schema";
import { generateEmbedding } from "@backend/lib/utils";
import {
  cosineDistance,
  desc,
  sql,
  and,
  ne,
  count,
  inArray,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

export const getSimilarQuestions = async (query: string) => {
  const embedding = await generateEmbedding(query);
  const similarity = sql<number>`1 - (${cosineDistance(question.embedding, embedding)})`;

  const results = await db
    .select({ id: question.id, question: question.question, similarity })
    .from(question)
    .orderBy(desc(similarity))
    .limit(20);

  if (results.length === 0) return [];

  const bestScore = results[0].similarity;

  const MIN_THRESHOLD = 0.7;

  if (bestScore < MIN_THRESHOLD) return [];

  const relativeThreshold = bestScore * 0.85;
  const threshold = Math.max(relativeThreshold, MIN_THRESHOLD);

  return results.filter((r) => r.similarity >= threshold).slice(0, 10);
};

export const getHotQuestions = async () => {
  return await db.query.question.findMany({
    where: (q, w) => w.eq(q.hot, true),
  });
};

export const updateHotQuestion = async () => {
  // Reset all hot flags
  await db.update(question).set({ hot: false });

  // Threshold for similarity (cosine distance < 0.25 means similar)
  const DISTANCE_THRESHOLD = 0.25;
  const MIN_CLUSTER_SIZE = 2;

  const aliasA = alias(question, "a");
  const aliasB = alias(question, "b");
  const distanceCondition = sql<boolean>`${aliasA.embedding} <=> ${aliasB.embedding} < ${DISTANCE_THRESHOLD}`;

  // Get questions with their neighbor count, ordered by most neighbors
  const questionsWithCount = await db
    .select({
      id: aliasA.id,
      question: aliasA.question,
      embedding: aliasA.embedding,
      neighborCount: count(aliasB.id),
    })
    .from(aliasA)
    .leftJoin(aliasB, and(ne(aliasA.id, aliasB.id), distanceCondition))
    .groupBy(aliasA.id, aliasA.question, aliasA.embedding)
    .orderBy(desc(count(aliasB.id)));

  // Only keep questions that have enough neighbors to form a cluster
  const clusteredQuestions = questionsWithCount.filter(
    (q) => q.neighborCount >= MIN_CLUSTER_SIZE - 1,
  );

  console.log(
    "Questions with neighbors:",
    clusteredQuestions.map((q) => ({
      question: q.question,
      neighborCount: q.neighborCount,
    })),
  );

  if (clusteredQuestions.length === 0) return;

  // Greedy clustering: pick the question with most neighbors, mark as hot,
  // then exclude all its neighbors from future picks
  const hotIds: string[] = [];
  const usedIds = new Set<string>();

  for (const q of clusteredQuestions) {
    if (usedIds.has(q.id)) continue;

    // This question becomes a cluster representative
    hotIds.push(q.id);
    usedIds.add(q.id);

    // Find and exclude all neighbors of this question
    if (q.embedding) {
      const embeddingStr = `[${q.embedding.join(",")}]`;
      const neighbors = await db
        .select({ id: question.id })
        .from(question)
        .where(
          sql`${question.embedding} <=> ${embeddingStr}::vector < ${DISTANCE_THRESHOLD} AND ${question.id} != ${q.id}`,
        );

      for (const neighbor of neighbors) {
        usedIds.add(neighbor.id);
      }
    }
  }

  console.log("Hot IDs selected:", hotIds.length);
  console.log("Used IDs (excluded):", usedIds.size);

  // Mark cluster representatives as hot
  if (hotIds.length > 0) {
    await db
      .update(question)
      .set({ hot: true })
      .where(inArray(question.id, hotIds));
  }
};

// export const labelizeHotQuestions = async (
//   questions: (Question & { count: number })[],
// ): Promise<Omit<HotQuestion, "id">[]> => {
//   return await Promise.all(
//     questions.map(async (q) => {
//       const result = await openai.chat.completions.create({
//         model: "gpt-4o-mini",
//         messages: [
//           {
//             role: "system",
//             content: `Tu es un expert en reformulation de questions. Ta tâche est de transformer une question spécifique en un label court et générique qui capture le thème principal.
//
// Règles :
// - Retourne UNIQUEMENT le label, sans guillemets ni ponctuation finale
// - Le label doit être concis (3-8 mots maximum)
// - Généralise légèrement la question pour qu'elle englobe des questions similaires
// - Utilise un ton neutre et professionnel
// - Ne commence pas par "Question sur..." ou "À propos de..."
//
// Exemples :
// - "Comment faire une réclamation pour un colis perdu ?" → "Réclamation colis perdu ou endommagé"
// - "Quel est le délai de livraison en France ?" → "Délais de livraison"
// - "Je n'arrive pas à me connecter à mon compte" → "Problèmes de connexion au compte"`,
//           },
//           {
//             role: "user",
//             content: q.question,
//           },
//         ],
//       });
//       const label = result.choices[0]?.message.content || "";
//       return {
//         label: label,
//         relatedQuestions: q.count,
//       } satisfies Omit<HotQuestion, "id">;
//     }),
//   );
// };
