import { createUserContent, createPartFromUri } from "@google/genai";
import { tryCatchAsync } from "../lib/utils";
import { openai } from "../lib/openai";
import { gemini } from "../lib/gemini";
import { fetchTranscript } from "youtube-transcript-plus";

const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;
const INSTAGRAM_REGEX = /https?:\/\/(www\.)?instagram\.com/i;
const TIKTOK_REGEX = /https?:\/\/(www\.)?(tiktok\.com|vm\.tiktok\.com)/i;
const YOUTUBE_REGEX = /https?:\/\/(www\.)?(youtube\.com|youtu\.be)/i;
const FACEBOOK_REGEX =
  /https?:\/\/(www\.)?(facebook\.com|fb\.watch|fb\.com|m\.facebook\.com)/i;
const X_REGEX = /https?:\/\/(www\.)?(twitter\.com|x\.com)/i;

export class Extractor {
  /**
   * Extract URLs from text and categorize them
   */
  extractUrls(text: string): {
    instagramUrls: string[];
    tiktokUrls: string[];
    youtubeUrls: string[];
    facebookUrls: string[];
    xUrls: string[];
    otherUrls: string[];
  } {
    const allUrls = text.match(URL_REGEX) || [];
    const instagramUrls: string[] = [];
    const tiktokUrls: string[] = [];
    const youtubeUrls: string[] = [];
    const facebookUrls: string[] = [];
    const xUrls: string[] = [];
    const otherUrls: string[] = [];

    for (const url of allUrls) {
      if (INSTAGRAM_REGEX.test(url)) {
        instagramUrls.push(url);
      } else if (TIKTOK_REGEX.test(url)) {
        tiktokUrls.push(url);
      } else if (YOUTUBE_REGEX.test(url)) {
        youtubeUrls.push(url);
      } else if (FACEBOOK_REGEX.test(url)) {
        facebookUrls.push(url);
      } else if (X_REGEX.test(url)) {
        xUrls.push(url);
      } else {
        otherUrls.push(url);
      }
    }

    return {
      instagramUrls,
      tiktokUrls,
      youtubeUrls,
      facebookUrls,
      xUrls,
      otherUrls,
    };
  }

  /**
   * Extract video ID from YouTube URL
   */
  private extractYoutubeVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
      /youtube\.com\/shorts\/([^&\s?]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  /**
   * Use Gemini with Google Search to analyze URLs and extract relevant information
   */
  private summarizeUrlsWithGemini = async (
    urls: string[],
    userPrompt: string,
  ): Promise<string | null> => {
    if (urls.length === 0) return null;

    const urlList = urls.map((url, i) => `${i + 1}. ${url}`).join("\n");

    const prompt = userPrompt
      ? `L'utilisateur pose la question suivante: "${userPrompt}"

Voici des liens fournis par l'utilisateur:
${urlList}

Utilise la recherche Google pour accéder au contenu de ces liens et extraire les informations pertinentes. Résume les informations trouvées en rapport avec la question de l'utilisateur. Si tu ne peux pas accéder à un lien, indique-le.`
      : `Voici des liens fournis par l'utilisateur:
${urlList}

Utilise la recherche Google pour accéder au contenu de ces liens et extraire les informations principales. Résume les affirmations ou claims présents dans ces contenus.`;

    const result = await tryCatchAsync(
      gemini.models.generateContent({
        model: "gemini-2.5-flash",
        contents: createUserContent([prompt]),
        config: {
          tools: [{ googleSearch: {} }],
        },
      }),
    );

    if (result.error) {
      console.error(
        "[Extractor] Error summarizing URLs with Gemini:",
        result.error,
      );
      return null;
    }

    return result.data.text || null;
  };

  private extractTextFromImage = async (
    path: string,
  ): Promise<string | null> => {
    const file = Bun.file(path);
    if (!(await file.exists())) {
      console.log("[Extractor] Image file does not exist:", path);
      return null;
    }

    console.log("[Extractor] Uploading image to Gemini:", path);

    const uploadResult = await tryCatchAsync(
      gemini.files.upload({
        file: path,
        config: { mimeType: file.type },
      }),
    );

    if (uploadResult.error) {
      console.error(
        "[Extractor] Error uploading image to Gemini:",
        uploadResult.error,
      );
      return null;
    }

    const uploadedFile = uploadResult.data;
    console.log("[Extractor] Image uploaded, extracting text...");

    const extractionResult = await tryCatchAsync(
      gemini.models.generateContent({
        model: "gemini-2.5-flash",
        contents: createUserContent([
          createPartFromUri(uploadedFile.uri!, uploadedFile.mimeType!),
          "Extract ALL text visible in this image. Output ONLY the extracted text, nothing else. Preserve the original language of the text.",
        ]),
      }),
    );

    if (extractionResult.error) {
      console.error(
        "[Extractor] Error extracting text with Gemini:",
        extractionResult.error,
      );
      return null;
    }

    const text = extractionResult.data.text;
    console.log("[Extractor] Text extraction completed:", text);

    return text || null;
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
      gemini.files.upload({
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
        gemini.files.get({ name: uploadedFile.name! }),
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
      gemini.models.generateContent({
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
      openai.chat.completions.create({
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
   * First : - Check for social media URLs and return early if found
   * Then : - Extract text from img / vid
   * Then : - Extract and analyze URLs (excluding Instagram/TikTok)
   * Then : - Ask the ai client to summarize the outputs
   * Finally : - Call the vera api to fact-check user input and return the vera output
   */
  async *decrypt(
    prompt: string,
    files: Bun.BunFile[],
  ): AsyncGenerator<{
    data: string;
    type: "step" | "token";
  }> {
    const filesTextContent: string[] = [];
    let text!: string | null;

    // Extract URLs from prompt
    const {
      instagramUrls,
      tiktokUrls,
      youtubeUrls,
      facebookUrls,
      xUrls,
      otherUrls,
    } = this.extractUrls(prompt);

    // If social media URLs are found, return early with a message
    if (
      instagramUrls.length > 0 ||
      tiktokUrls.length > 0 ||
      facebookUrls.length > 0 ||
      xUrls.length > 0
    ) {
      const platforms: string[] = [];
      if (instagramUrls.length > 0) platforms.push("Instagram");
      if (tiktokUrls.length > 0) platforms.push("TikTok");
      if (facebookUrls.length > 0) platforms.push("Facebook");
      if (xUrls.length > 0) platforms.push("X (Twitter)");

      const message = `Je ne peux malheureusement pas accéder au contenu des liens ${platforms.join(" et ")}. Pour que je puisse vous aider, vous pouvez :\n\n- **M'envoyer directement la vidéo ou l'image** en pièce jointe\n- **Me décrire le contenu** que vous souhaitez vérifier (texte, affirmations, etc.)\n\nJe serai alors en mesure d'analyser l'information et de vous fournir une vérification.`;

      yield { type: "token", data: message };
      return;
    }

    // Process YouTube URLs
    if (youtubeUrls.length > 0) {
      yield { type: "step", data: "Analyse du contenu YouTube" };
      for (const url of youtubeUrls) {
        const videoId = this.extractYoutubeVideoId(url);
        if (!videoId) continue;

        const transcriptResult = await tryCatchAsync(fetchTranscript(videoId));
        if (
          transcriptResult.error ||
          !transcriptResult.data ||
          transcriptResult.data.length === 0
        ) {
          yield {
            type: "token",
            data: "Impossible d'extraire le contenu de cette vidéo.",
          };
          return;
        }

        const transcription = transcriptResult.data
          .map((t) => t.text)
          .join(" ");
        filesTextContent.push(`[Contenu YouTube]\n${transcription}`);
      }
    }

    // Process files
    if (files.length > 0) {
      yield { type: "step", data: "Analyse des fichiers" };
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

    // Process other URLs with Gemini + Google Search
    if (otherUrls.length > 0) {
      yield { type: "step", data: "Analyse des liens" };
      const urlContent = await this.summarizeUrlsWithGemini(otherUrls, prompt);
      if (urlContent) {
        filesTextContent.push(`[Contenu des liens]\n${urlContent}`);
      }
    }

    yield { type: "step", data: "Résumé des données extraites" };
    const summary = await this.summarizeTextContent(filesTextContent, prompt);
    for await (const token of this.askVera(summary)) {
      yield { type: "token", data: token };
    }
  }
}
