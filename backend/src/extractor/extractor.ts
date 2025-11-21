import OpenAI from "openai";
import Tesseract from "tesseract.js";
import { tryCatchAsync } from "../lib/utils";

export class Extractor {
  private openaiClient: OpenAI;

  constructor() {
    this.openaiClient = new OpenAI({
      apiKey: Bun.env.OPENAI_API_KEY,
    });
  }

  private extractTextFromImage = async (
    path: string,
  ): Promise<string | null> => {
    const file = Bun.file(path);
    if (!(await file.exists())) {
      return null;
    }

    // Detect language in the image
    const detectResult = await tryCatchAsync<any>(Tesseract.detect(path));
    if (detectResult.error) {
      console.error("Error detecting language in image:", detectResult.error);
      return null;
    }

    const language = detectResult.data.data.language;

    // Extract text from image
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
      return null;
    }

    // Create a temporary audio file path
    const audioPath = `${path}.audio.mp3`;

    // Extract audio from video using ffmpeg
    const ffmpegResult = await tryCatchAsync(
      Bun.$`ffmpeg -i ${path} -vn -acodec libmp3lame -q:a 2 ${audioPath} -y`,
    );

    if (ffmpegResult.error) {
      console.error("Error extracting audio from video:", ffmpegResult.error);
      await tryCatchAsync(Bun.$`rm -f ${audioPath}`);
      return null;
    }

    // Check if audio file was created
    const audioFile = Bun.file(audioPath);
    if (!(await audioFile.exists())) {
      console.error("Failed to extract audio from video");
      await tryCatchAsync(Bun.$`rm -f ${audioPath}`);
      return null;
    }

    // Transcribe audio using OpenAI Whisper
    const transcriptionResult = await tryCatchAsync(
      this.openaiClient.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-1",
        language: "fr", // Adjust language as needed
        response_format: "text",
      }),
    );

    // Clean up temporary audio file
    await tryCatchAsync(Bun.$`rm ${audioPath}`);

    if (transcriptionResult.error) {
      console.error(
        "Error transcribing audio with Whisper:",
        transcriptionResult.error,
      );
      return null;
    }

    return transcriptionResult.data;
  };

  /**
   * THis method will ask the ai client to extract the text of the provided image / video url and will return the text
   */

  private summarizeTextContent = async (
    textContent: string[],
    userPrompt: string,
  ): Promise<string> => {
    if (!textContent.length) {
      return "";
    }

    const combinedText = textContent
      .map((text, index) => `[Content ${index + 1}]\n${text}`)
      .join("\n\n---\n\n");

    const result = await tryCatchAsync(
      this.openaiClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that summarizes extracted text content from images and videos. CRITICAL: Do NOT omit any details, facts, claims, or information as the output will be fact-checked. Include ALL names, dates, numbers, statistics, quotes, and specific claims. Provide a comprehensive summary that preserves every piece of verifiable information.",
          },
          {
            role: "user",
            content: `User request: "${userPrompt}"\n\nPlease analyze and summarize the following extracted text content in the context of the user's request above:\n\n${combinedText}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    );

    if (result.error) {
      console.error("Error summarizing text content:", result.error);
      return "";
    }

    return result.data.choices[0]?.message?.content || "";
  };

  askVera = async function* (prompt: string) {
    const response = await fetch("", {
      method: "POST",
      headers: {
        "X-API-Key": "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: "",
        query: prompt,
      }),
    });
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
