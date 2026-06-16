import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const maxDuration = 60;

// Lê o número exibido numa foto de balança digital
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

  const { imageBase64 } = await req.json();
  if (!imageBase64) return NextResponse.json({ error: "Imagem ausente" }, { status: 400 });

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "Você lê o valor de peso exibido no visor de uma balança (digital ou analógica) a partir de uma foto. " +
            "Responda SOMENTE com JSON válido, sem markdown. Formato: " +
            '{"weight_kg": number|null, "confidence": "alta"|"media"|"baixa", "note": string}. ' +
            "Se não conseguir identificar um número de peso claramente, retorne weight_kg null e explique em note.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Qual o peso mostrado nesta balança? Em kg." },
            { type: "image_url", image_url: { url: imageBase64 } },
          ],
        },
      ],
      max_tokens: 200,
      response_format: { type: "json_object" },
    });

    return NextResponse.json(JSON.parse(completion.choices[0]?.message?.content ?? "{}"));
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Falha ao ler a balança." }, { status: 500 });
  }
}
