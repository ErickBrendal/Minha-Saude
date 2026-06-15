import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "A chave da OpenAI não está configurada na Vercel." },
      { status: 500 }
    );
  }

  const { ingredients } = await req.json();
  if (!ingredients || !ingredients.length) {
    return NextResponse.json({ error: "Liste ao menos um ingrediente." }, { status: 400 });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Você é um chef e nutricionista. O usuário tem diabetes tipo 1, então priorize receitas " +
            "com baixo índice glicêmico e indique os carboidratos. Responda SOMENTE com JSON válido, sem markdown. " +
            "Formato: {\"recipes\": [{\"name\": string, \"ingredients_used\": [string], \"missing\": [string], " +
            "\"steps\": [string], \"carbs_g\": number, \"calories_kcal\": number, \"glycemic_note\": string}]}. " +
            "Gere até 3 receitas em português usando preferencialmente os ingredientes informados.",
        },
        {
          role: "user",
          content: `Tenho em casa: ${ingredients.join(", ")}. O que posso cozinhar?`,
        },
      ],
      max_tokens: 1200,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    return NextResponse.json(JSON.parse(raw));
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Falha ao gerar receitas." },
      { status: 500 }
    );
  }
}
