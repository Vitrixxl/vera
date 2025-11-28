import { db } from "@backend/lib/db";
import {
  HotQuestion,
  hotQuestion,
  Question,
  question,
} from "@backend/lib/db/schema";
import { openai } from "@backend/lib/openai";
import { generateEmbedding } from "@backend/lib/utils";
import {
  cosineDistance,
  getTableColumns,
  sql,
  gt,
  and,
  ne,
  count,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

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

export const getHotQuestions = async () => {
  return await db.query.hotQuestion.findMany();
};

export const updateHotQuestion = async () => {
  const aliasA = alias(question, "a");
  const aliasB = alias(question, "b");
  const distanceCondition = sql<boolean>`${aliasA.embedding} <=> ${aliasB.embedding} < ${0.2}`;

  const questions = await db
    .select({
      ...getTableColumns(question),
      count: count(),
    })
    .from(aliasA)
    .leftJoin(aliasB, and(ne(aliasA.id, aliasB.id), distanceCondition))
    .groupBy(aliasA.id)
    .orderBy((t) => t.count);
  const labelizedQuestions = await labelizeHotQuestions(questions);

  await db.insert(hotQuestion).values(labelizedQuestions);
};

export const labelizeHotQuestions = async (
  questions: (Question & { count: number })[],
): Promise<Omit<HotQuestion, "id">[]> => {
  return await Promise.all(
    questions.map(async (q) => {
      const result = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Tu es un expert en reformulation de questions. Ta tâche est de transformer une question spécifique en un label court et générique qui capture le thème principal.

Règles :
- Retourne UNIQUEMENT le label, sans guillemets ni ponctuation finale
- Le label doit être concis (3-8 mots maximum)
- Généralise légèrement la question pour qu'elle englobe des questions similaires
- Utilise un ton neutre et professionnel
- Ne commence pas par "Question sur..." ou "À propos de..."

Exemples :
- "Comment faire une réclamation pour un colis perdu ?" → "Réclamation colis perdu ou endommagé"
- "Quel est le délai de livraison en France ?" → "Délais de livraison"
- "Je n'arrive pas à me connecter à mon compte" → "Problèmes de connexion au compte"`,
          },
          {
            role: "user",
            content: q.question,
          },
        ],
      });
      const label = result.choices[0]?.message.content || "";
      return {
        label: label,
        relatedQuestions: q.count,
      } satisfies Omit<HotQuestion, "id">;
    }),
  );
};
