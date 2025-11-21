import { Extractor } from "@backend/extractor/extractor";
import type { BunFile } from "bun";

export const chatMessageHandler = ({
  message,
  files,
}: {
  message: string;
  files: BunFile[];
}) => {
  const extractor = new Extractor();
  files[0].name;

  await extractor.decrypt(message);
};
