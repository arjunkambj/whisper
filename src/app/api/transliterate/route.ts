import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

const SYSTEM_PROMPT = `You are a Hindi-to-Roman-Hindi normalizer.
The input may contain:
- Hindi in Devanagari
- Roman Hindi
- Mixed Hindi + English
- Noisy ASR text with spelling mistakes

Your job is to rewrite it as clean, natural Hindi written in English letters (Roman Hindi / Hinglish), while preserving original meaning.

IMPORTANT RULES:
- Output must be only in Latin/English letters. Never output Devanagari.
- Keep English words and crypto terms in English (example: crypto, exchange, market order, limit order, wallet, USDT, Solana, Binance, KYC).
- Fix obvious ASR/spelling mistakes using context.
- Keep sentence meaning, sequence, and tone the same. Do not add new facts.
- Numbers, currency values, and symbols should stay as-is.
- Return only the final rewritten text, nothing else.`;

type Segment = { text: string; startSecond: number; endSecond: number };

export async function POST(request: Request) {
  const body = (await request.json()) as {
    text: string;
    segments?: Segment[];
  };

  if (!body.text?.trim()) {
    return Response.json({ error: "No text provided" }, { status: 400 });
  }

  // If segments exist, normalize them as a numbered list so timestamps are preserved
  if (body.segments && body.segments.length > 0) {
    const numbered = body.segments
      .map((s, i) => `${i + 1}. ${s.text}`)
      .join("\n");

    const result = await generateText({
      model: openai("gpt-4o-mini"),
      system:
        SYSTEM_PROMPT +
        "\n\nThe input is a numbered list. Return the rewritten text as the same numbered list, preserving the exact numbering. Do not add or remove lines.",
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
    model: openai("gpt-5.2-chat-latest"),
    system: SYSTEM_PROMPT,
    prompt: body.text,
  });

  return Response.json({ text: result.text, segments: [] });
}
