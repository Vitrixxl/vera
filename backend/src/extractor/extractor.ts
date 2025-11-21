import OpenAI from "openai";
import Tesseract from "tesseract.js";
import { tryCatchAsync } from "../lib/utils";

export class Extractor {
  openaiClient: OpenAI;

  private videosTextContent: string[] = [];
  private imagesTextContent: string[] = [];

  constructor(
    private readonly videosPaths: string[] = [],
    private readonly imagesPaths: string[] = [],
  ) {
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

  private summarizeTextContent = async (): Promise<string> => {
    const allTextContent = [
      ...this.videosTextContent,
      ...this.imagesTextContent,
    ];

    if (allTextContent.length === 0) {
      return "";
    }

    const combinedText = allTextContent
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
            content: `Please summarize the following extracted text content:\n\n${combinedText}`,
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

  /**
   * Full pipeline for the decryption
   * First : - Extract text from img / vid
   * Then : - Ask the ai client to summarize the outputs
   * Finaly : - Call the vera api to fact-check user input and return the vera output
   */
  decrypt = async () => {
    for (const p of this.videosPaths) {
      const text = await this.extractTextFromVideo(p);
      if (!text) continue;
      this.videosTextContent.push(text);
    }
    for (const p of this.imagesPaths) {
      const text = await this.extractTextFromImage(p);
      if (!text) continue;
      this.videosTextContent.push(text);
    }

    const summary = this.summarizeTextContent();
    summary;
    // TODO Make the call to the VERA API
  };
}
