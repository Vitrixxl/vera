import { Extractor } from "@backend/extractor/extractor";
import type { BunFile } from "bun";

export async function* chatMessageHandler({
  message,
  files,
}: {
  message: string;
  files: BunFile[];
}) {
  const extractor = new Extractor();

  /**
   * Rien pour l'instant
   */
  for await (const token of extractor.decrypt(message, files)) {
    yield token;
  }
}
