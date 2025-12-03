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
    model: "text-embedding-3-small",
  });
  return data[0].embedding;
};

export const getCountryFromIP = async (ip: string): Promise<string | null> => {
  if (!ip || ip === "127.0.0.1" || ip === "::1") return null;

  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode`);
    const data = await response.json();
    return data.countryCode || null;
  } catch {
    return null;
  }
};
