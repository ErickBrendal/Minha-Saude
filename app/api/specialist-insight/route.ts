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

  // Carrega contexto real do usuário para personalizar
  const { data: profile } = await supabase
    .from("health_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const goal = goalConfig(profile?.primary_goal);

  // Resumo de dados recentes (sem expor nada sensível além do necessário)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [glucoseRes, mealsRes, actsRes, weightRes] = await Promise.all([
    supabase.from("measurements").select("value, context, measured_at").eq("user_id", user.id)
      .eq("metric_type", "glucose").gte("measured_at", weekAgo.toISOString()),
    supabase.from("meals").select("calories_kcal, carbs_g").eq("user_id", user.id)
      .gte("eaten_at", weekAgo.toISOString()),
    supabase.from("activities").select("duration_min").eq("user_id", user.id)
      .gte("performed_at", weekAgo.toISOString()),
    supabase.from("weight_logs").select("weight_kg, measured_at").eq("user_id", user.id)
      .order("measured_at", { ascending: false }).limit(10),
  ]);

  const gvals = (glucoseRes.data ?? []).map((g) => g.value);
  const avgGlucose = gvals.length ? Math.round(gvals.reduce((s, v) => s + v, 0) / gvals.length) : null;
  const low = profile?.glucose_target_low ?? 70;
  const high = profile?.glucose_target_high ?? 180;
  const tir = gvals.length
    ? Math.round((gvals.filter((v) => v >= low && v <= high).length / gvals.length) * 100)
    : null;
  const totalActivity = (actsRes.data ?? []).reduce((s, a) => s + (a.duration_min || 0), 0);
  const weights = weightRes.data ?? [];
  const weightChange = weights.length >= 2
    ? +(weights[0].weight_kg - weights[weights.length - 1].weight_kg).toFixed(1)
    : null;

  const context = {
    objetivo: goal.label,
    foco: goal.specialistFocus,
    diretrizes: goal.guidelines,
    glicemia_media_semana: avgGlucose,
    tempo_no_alvo_pct: tir,
    minutos_atividade_semana: totalActivity,
    variacao_peso_kg: weightChange,
    peso_atual: weights[0]?.weight_kg ?? profile?.weight_kg ?? null,
    peso_alvo: profile?.target_weight_kg ?? null,
    meta_calorias: profile?.daily_calorie_target ?? null,
  };

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "Você é um educador em saúde que traduz, em linguagem acessível e acolhedora, as recomendações " +
            "de entidades de referência como ADA (American Diabetes Association), SBD (Sociedade Brasileira de Diabetes), " +
            "OMS e SBC. Você dá dicas práticas de convivência e autocuidado, SEMPRE ancoradas nessas diretrizes. " +
            "NUNCA prescreva doses de medicação, nunca ajuste insulina, nunca dê conduta clínica individual. " +
            "Quando apropriado, reforce procurar o médico. Responda em português brasileiro. " +
            "Responda SOMENTE com JSON válido, sem markdown. Formato: " +
            '{"saudacao": string curta e motivadora, ' +
            '"insights": [{"titulo": string, "texto": string (2-3 frases práticas), "diretriz": "ADA"|"SBD"|"OMS"|"SBC", "categoria": "glicemia"|"dieta"|"atividade"|"convivencia"|"medicacao"}], ' +
            '"foco_da_semana": string (1 frase com a prioridade sugerida)}. ' +
            "Gere de 3 a 4 insights personalizados pelos dados fornecidos. Seja específico aos números quando existirem.",
        },
        {
          role: "user",
          content: `Meu contexto de saúde (resumo da última semana):\n${JSON.stringify(context, null, 2)}\n\nGere dicas personalizadas para meu objetivo.`,
        },
      ],
      max_tokens: 1100,
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content ?? "{}");

    // Salva o primeiro insight como "último" para o dashboard
    if (parsed.insights?.[0]) {
      await supabase.from("ai_insights").insert({
        user_id: user.id,
        goal_kind: goal.kind,
        category: parsed.insights[0].categoria ?? null,
        content: parsed.insights[0].texto ?? "",
        source_guideline: parsed.insights[0].diretriz ?? null,
      });
    }

    return NextResponse.json(parsed);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Falha ao gerar insights." }, { status: 500 });
  }
}
