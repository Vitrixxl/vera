import { openai } from "./openai";

type Success<T> = {
  data: T;
  error: null;
};
type Failure<E> = {
  data: null;
  error: E;
};

type Result<T, E = Error> = Success<T> | Failure<E>;
export async function tryCatchAsync<T, E = Error>(
  promise: Promise<T>,
): Promise<Result<T, E>> {
  try {
    const data = await promise;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as E };
  }
}

export function tryCatch<T extends () => unknown, E = Error>(
  fn: T,
): Result<ReturnType<T>, E> {
  try {
    const data = fn() as ReturnType<T>;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as E };
  }
}

export const generateEmbedding = async (value: string) => {
  const { data } = await openai.embeddings.create({
    input: value,
    model: "text-embedding-ada-002",
    dimensions: 1536,
  });
  return data[0].embedding;
};
