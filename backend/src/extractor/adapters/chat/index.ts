import { Extractor } from "@backend/extractor/extractor";
import type { BunFile } from "bun";

export const chatMessageHandler = async ({
  message,
  files,
}: {
  message: string;
  files: BunFile[];
}) => {
  const extractor = new Extractor();
  files[0].name;

  /**
   * Rien pour l'instant
   */
  const output = await extractor.decrypt(message, files);
  return output;
};
