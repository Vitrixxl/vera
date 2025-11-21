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
