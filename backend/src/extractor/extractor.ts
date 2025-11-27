import {
  GoogleGenAI,
  createUserContent,
  createPartFromUri,
} from "@google/genai";
import OpenAI from "openai";
import Tesseract from "tesseract.js";
import { tryCatchAsync } from "../lib/utils";

export class Extractor {
  private openaiClient: OpenAI;
  private geminiClient: GoogleGenAI;

  constructor() {
    this.openaiClient = new OpenAI({
      apiKey: Bun.env["OPENAI_API_KEY"],
    });
    this.geminiClient = new GoogleGenAI({
      apiKey: Bun.env["GEMINI_API_KEY"],
    });
  }

  private extractTextFromImage = async (
    path: string,
  ): Promise<string | null> => {
    const file = Bun.file(path);
    if (!(await file.exists())) {
      console.log("File do not exists");
      return null;
    }

    const detectResult = await tryCatchAsync<any>(Tesseract.detect(path));
    if (detectResult.error) {
      console.error("Error detecting language in image:", detectResult.error);
      return null;
    }

    const language = detectResult.data.data.language;

    const recognizeResult = await tryCatchAsync(
      Tesseract.recognize(path, language),
    );
    if (recognizeResult.error) {
      console.error("Error recognizing text in image:", recognizeResult.error);
      return null;
    }

    return recognizeResult.data.data.text;
  };

  private extractTextFromVideo = async (
    path: string,
  ): Promise<string | null> => {
    const file = Bun.file(path);
    if (!(await file.exists())) {
      console.log("[Extractor] Video file does not exist:", path);
      return null;
    }

    console.log("[Extractor] Uploading video to Gemini:", path);

    const uploadResult = await tryCatchAsync(
      this.geminiClient.files.upload({
        file: path,
        config: { mimeType: file.type },
      }),
    );

    if (uploadResult.error) {
      console.error(
        "[Extractor] Error uploading video to Gemini:",
        uploadResult.error,
      );
      return null;
    }

    const uploadedFile = uploadResult.data;
    console.log("[Extractor] Video uploaded, waiting for processing...");

    // Wait for file to be ACTIVE before using it
    let fileState = uploadedFile.state;
    let retries = 0;
    const maxRetries = 30;

    while (fileState !== "ACTIVE" && retries < maxRetries) {
      console.log(
        `[Extractor] Waiting for file to be ready... (state: ${fileState}, attempt ${retries + 1}/${maxRetries})`,
      );
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const fileInfo = await tryCatchAsync(
        this.geminiClient.files.get({ name: uploadedFile.name! }),
      );

      if (fileInfo.error) {
        console.error("[Extractor] Error checking file state:", fileInfo.error);
        break;
      }

      fileState = fileInfo.data.state;
      retries++;
    }

    if (fileState !== "ACTIVE") {
      console.error(
        "[Extractor] File failed to become ACTIVE after waiting, state:",
        fileState,
      );
      return null;
    }

    console.log("[Extractor] File is ACTIVE, generating transcription...");

    const transcriptionResult = await tryCatchAsync(
      this.geminiClient.models.generateContent({
        model: "gemini-2.5-flash",
        contents: createUserContent([
          createPartFromUri(uploadedFile.uri!, uploadedFile.mimeType!),
          "Transcribe ALL spoken words from this video. Output ONLY the transcription, nothing else. If there is text visible in the video, include it as well.",
        ]),
      }),
    );

    if (transcriptionResult.error) {
      console.error(
        "[Extractor] Error transcribing with Gemini:",
        transcriptionResult.error,
      );
      return null;
    }

    const text = transcriptionResult.data.text;
    console.log("[Extractor] Transcription completed, transcription:", text);

    return text || null;
  };

  /**
   * THis method will ask the ai client to extract the text of the provided image / video url and will return the text
   */
  private summarizeTextContent = async (
    textContent: string[],
    userPrompt: string,
  ): Promise<string> => {
    const combinedText = textContent
      .map((text, index) => `[Content ${index + 1}]\n${text}`)
      .join("\n\n---\n\n");

    const hasUserPrompt = userPrompt && userPrompt.trim().length > 0;

    const systemPrompt = hasUserPrompt
      ? `You are a helpful assistant that reformulates user questions for fact-checking. Your task is to take the user's question and the extracted content, then create a clear, specific question that can be fact-checked. Include ALL relevant details from the extracted content (names, dates, numbers, statistics, quotes, specific claims) in your reformulated question. IMPORTANT: You MUST formulate the question in the SAME LANGUAGE as the user's question. Output ONLY the reformulated question, nothing else.`
      : `You are a helpful assistant that creates fact-checking questions from content. Your task is to analyze the extracted content, identify the main claim or affirmation, and formulate it as a clear question to be fact-checked. Include ALL relevant details (names, dates, numbers, statistics, quotes, specific claims). IMPORTANT: You MUST formulate the question in the SAME LANGUAGE as the extracted content. Output ONLY the question in the format: "Est-il vrai que [claim]?" (French) or "Is it true that [claim]?" (English) or equivalent in the content's language.`;

    const userMessage = hasUserPrompt
      ? `User question: "${userPrompt}"\n\nExtracted content:\n${combinedText}\n\nReformulate the user's question incorporating the relevant facts from the extracted content.`
      : `Extracted content:\n${combinedText}\n\nIdentify the main claim and formulate a fact-checking question.`;

    const result = await tryCatchAsync(
      this.openaiClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userMessage,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    );

    if (result.error) {
      console.error("Error summarizing text content:", result.error);
      return "";
    }

    return result.data.choices[0]?.message?.content || "";
  };

  askVera = async function* (prompt: string) {
    const response = await fetch(
      "https://feat-api-partner---api-ksrn3vjgma-od.a.run.app/api/v1/chat",
      {
        method: "POST",
        headers: {
          "X-API-Key": Bun.env["VERA_API_KEY"] as string,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: "test",
          query: prompt,
        }),
      },
    );
    const decoder = new TextDecoder();

    if (!response.body) return "";
    for await (const chunk of response.body) {
      const text = decoder.decode(chunk, { stream: true });
      yield text;
    }
  };

  /**
   * Full pipeline for the decryption
   * First : - Extract text from img / vid
   * Then : - Ask the ai client to summarize the outputs
   * Finaly : - Call the vera api to fact-check user input and return the vera output
   */
  async *decrypt(
    prompt: string,
    files: Bun.BunFile[],
  ): AsyncGenerator<{ data: string; type: "step" | "token" }> {
    const filesTextContent: string[] = [];
    let text!: string | null;
    if (files.length > 0) {
      yield { type: "step", data: "files" };
      for (const f of files) {
        if (f.type.startsWith("video")) {
          text = await this.extractTextFromVideo(f.name!);
        } else {
          text = await this.extractTextFromImage(f.name!);
        }
        if (!text) continue;
        filesTextContent.push(text);
      }
    }
    yield { type: "step", data: "summarizing" };
    const summary = await this.summarizeTextContent(filesTextContent, prompt);
    for await (const token of this.askVera(summary)) {
      yield { type: "token", data: token };
    }
  }
}
