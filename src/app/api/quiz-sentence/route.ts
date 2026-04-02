import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { word, definition } = await req.json();
    if (!word) return NextResponse.json({ error: "No word" }, { status: 400 });

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `Write one natural English sentence using the word "${word}" (meaning: ${definition}).
The sentence must contain the exact word "${word}".
Return ONLY the sentence, nothing else.`,
        },
      ],
    });

    const sentence = completion.choices[0]?.message?.content?.trim() ?? "";
    return NextResponse.json({ sentence });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
