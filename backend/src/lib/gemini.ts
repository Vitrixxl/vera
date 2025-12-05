import { GoogleGenAI } from "@google/genai";

export const gemini = new GoogleGenAI({
  apiKey: Bun.env["GEMINI_API_KEY"],
});
