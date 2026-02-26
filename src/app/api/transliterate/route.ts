import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

const SYSTEM_PROMPT =
  "You are a Hindi transliterator. Convert Hindi text to romanized Hindi (written in English/Latin letters). Do NOT translate to English — keep the Hindi words, just write them in English letters so they sound the same when read aloud. Only output the transliterated text, nothing else.";

type Segment = { text: string; startSecond: number; endSecond: number };

export async function POST(request: Request) {
  const body = (await request.json()) as {
    text: string;
    segments?: Segment[];
  };

  if (!body.text?.trim()) {
    return Response.json({ error: "No text provided" }, { status: 400 });
  }

  // If segments exist, transliterate them as a numbered list so timestamps are preserved
  if (body.segments && body.segments.length > 0) {
    const numbered = body.segments
      .map((s, i) => `${i + 1}. ${s.text}`)
      .join("\n");

    const result = await generateText({
      model: openai("gpt-4o-mini"),
      system:
        SYSTEM_PROMPT +
        "\n\nThe input is a numbered list. Return the transliterated text as the same numbered list, preserving the exact numbering. Do not add or remove lines.",
      prompt: numbered,
    });

    const lines = result.text.split("\n").filter((l) => l.trim());
    const transliteratedSegments = body.segments.map((seg, i) => ({
      ...seg,
      text: lines[i]?.replace(/^\d+\.\s*/, "") ?? seg.text,
    }));

    const fullText = transliteratedSegments.map((s) => s.text).join(" ");

    return Response.json({ text: fullText, segments: transliteratedSegments });
  }

  // Plain text fallback
  const result = await generateText({
    model: openai("gpt-4o-mini"),
    system: SYSTEM_PROMPT,
    prompt: body.text,
  });

  return Response.json({ text: result.text, segments: [] });
}
