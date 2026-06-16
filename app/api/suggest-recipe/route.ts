import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase-server";
import { goalConfig } from "@/lib/goals";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "A chave da OpenAI não está configurada na Vercel." },
      { status: 500 }
    );
  }

  const { ingredients, keyword } = await req.json();

  const { data: profile } = await supabase
    .from("health_profiles").select("primary_goal, daily_carb_target").eq("id", user.id).single();
  const goal = goalConfig(profile?.primary_goal);

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // Monta o pedido: por ingredientes (despensa) ou por palavra-chave (biblioteca)
  const userPrompt = keyword
    ? `Quero receitas para: "${keyword}". Meu objetivo é ${goal.label}.`
    : `Tenho em casa: ${(ingredients || []).join(", ")}. Meu objetivo é ${goal.label}. O que posso cozinhar?`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            `Você é um chef e nutricionista. O objetivo do usuário é "${goal.label}" ` +
            `(foco: ${goal.specialistFocus}). Priorize receitas alinhadas a esse objetivo e às diretrizes ${goal.guidelines.join(", ")}. ` +
            "Sempre informe carboidratos (importante para diabetes). Responda SOMENTE com JSON válido, sem markdown. " +
            'Formato: {"recipes": [{"name": string, "tags": [string], "ingredients_used": [string], "missing": [string], ' +
            '"steps": [string], "carbs_g": number, "calories_kcal": number, "protein_g": number, "fat_g": number, "glycemic_note": string}]}. ' +
            "Gere até 3 receitas em português. As tags devem incluir o tipo de refeição e características (ex.: 'low-carb','almoço','rápido').",
        },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 1400,
      response_format: { type: "json_object" },
    });

    return NextResponse.json(JSON.parse(completion.choices[0]?.message?.content ?? "{}"));
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Falha ao gerar receitas." }, { status: 500 });
  }
}
