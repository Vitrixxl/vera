import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: Bun.env["OPENAI_API_KEY"],
});
