import { openai } from "@ai-sdk/openai";
import { experimental_transcribe as transcribe } from "ai";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

const convex = new ConvexHttpClient(
  process.env.NEXT_PUBLIC_CONVEX_URL as string,
);

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

const ALLOWED_TYPES = new Set([
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/webm",
  "audio/ogg",
  "audio/flac",
  "audio/x-m4a",
  "video/mp4",
  "video/webm",
]);

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("audio") as File | null;

  if (!file) {
    return Response.json({ error: "No audio file provided" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return Response.json(
      { error: `Unsupported file type: ${file.type}` },
      { status: 400 },
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return Response.json(
      { error: "File size exceeds 25MB limit" },
      { status: 400 },
    );
  }

  const isDuplicate = await convex.query(api.transcriptions.checkDuplicate, {
    fileName: file.name,
    fileSize: file.size,
  });
  if (isDuplicate) {
    return Response.json(
      { error: "This file has already been transcribed" },
      { status: 409 },
    );
  }

  const result = await transcribe({
    model: openai.transcription("gpt-4o-transcribe"),
    audio: new Uint8Array(await file.arrayBuffer()),
    providerOptions: {
      openai: { response_format: "verbose_json" },
    },
  });

  const segments = (result.segments ?? []).map((s) => ({
    text: s.text,
    startSecond: s.startSecond,
    endSecond: s.endSecond,
  }));

  const id = await convex.mutation(api.transcriptions.save, {
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
    text: result.text,
    segments,
    language: result.language ?? undefined,
    durationInSeconds: result.durationInSeconds ?? undefined,
  });

  return Response.json({
    id,
    text: result.text,
    segments,
    language: result.language,
    durationInSeconds: result.durationInSeconds,
    fileName: file.name,
    fileSize: file.size,
  });
}
