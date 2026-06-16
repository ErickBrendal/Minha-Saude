import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const maxDuration = 90;

// Recebe um documento (imagem ou PDF em base64), classifica e extrai dados estruturados.
// hint (opcional): categoria sugerida pelo usuário ('receita'|'dieta'|'consulta'|'exame'|'atestado').
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

  const { imageBase64, hint } = await req.json();
  if (!imageBase64) return NextResponse.json({ error: "Documento ausente" }, { status: 400 });

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const schema =
    '{"category": "receita"|"dieta"|"consulta"|"exame"|"atestado"|"outro", ' +
    '"title": string (título curto e legível, ex: "Receita de insulina - Dra. Fabiana"), ' +
    '"summary": string (2-3 frases resumindo o documento), ' +
    '"medications": [{"name": string, "dose_amount": number|null, "dose_unit": string|null, "schedule_times": [string "HH:MM"], "notes": string}], ' +
    '"appointment": {"specialty": string|null, "doctor_name": string|null, "date": string|null (ISO 8601 se houver data e hora), "location": string|null, "notes": string|null}|null, ' +
    '"diet_items": [{"name": string (ex: "Almoço"), "tags": [string], "ingredients": [string], "steps": [string], "note": string}], ' +
    '"exam_results": [{"name": string, "value": string, "reference": string|null}], ' +
    '"raw_notes": string (qualquer orientação ou dica relevante)}';

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "Você é um assistente que lê documentos médicos brasileiros (receitas, orientações de alta, " +
            "pedidos de consulta, atestados, exames) e extrai os dados de forma estruturada para um app de saúde. " +
            "Leia com atenção doses, horários, especialidades e datas. Converta horários para formato HH:MM (24h). " +
            "Para insulina/medicação, identifique se é de manhã/almoço/jantar/noite e gere schedule_times coerentes " +
            "(ex.: 'após café, almoço e jantar' => ['07:30','12:00','19:00']; 'cedo'/'manhã' => ['07:00']; 'noite' => ['21:00']). " +
            (hint ? `O usuário indicou que este documento é da categoria "${hint}" — priorize essa classificação se fizer sentido. ` : "") +
            "Responda SOMENTE com JSON válido, sem markdown, no formato exato: " +
            schema +
            ". Liste arrays vazios para seções sem dados. NUNCA invente doses — extraia apenas o que está escrito.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Analise este documento de saúde e extraia os dados." },
            { type: "image_url", image_url: { url: imageBase64 } },
          ],
        },
      ],
      max_tokens: 1500,
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
    return NextResponse.json(parsed);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Falha ao analisar o documento." }, { status: 500 });
  }
}
