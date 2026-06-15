import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  // Garante usuário autenticado
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "A chave da OpenAI não está configurada. Adicione OPENAI_API_KEY nas variáveis de ambiente da Vercel." },
      { status: 500 }
    );
  }

  const { imageBase64 } = await req.json();
  if (!imageBase64) {
    return NextResponse.json({ error: "Imagem ausente" }, { status: 400 });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "Você é um nutricionista que analisa fotos de refeições brasileiras. " +
            "Responda SOMENTE com um objeto JSON válido, sem markdown, sem texto extra. " +
            "Formato: {\"description\": string em português, \"items\": [{\"name\": string, \"portion\": string}], " +
            "\"calories_kcal\": number, \"carbs_g\": number, \"protein_g\": number, \"fat_g\": number, " +
            "\"confidence\": \"alta\"|\"media\"|\"baixa\"}. " +
            "As estimativas são aproximadas. Seja realista com porções brasileiras.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Analise esta refeição e estime os valores nutricionais." },
            { type: "image_url", image_url: { url: imageBase64 } },
          ],
        },
      ],
      max_tokens: 600,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw);
    return NextResponse.json(parsed);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Falha ao analisar a imagem." },
      { status: 500 }
    );
  }
}
