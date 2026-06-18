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

  const { messages } = await req.json();
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Mensagem ausente" }, { status: 400 });
  }

  // Carrega o contexto real do usuário para fundamentar as respostas
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [profileRes, medsRes, recipesRes, apptsRes, glucoseRes, docsRes] = await Promise.all([
    supabase.from("health_profiles").select("*").eq("id", user.id).single(),
    supabase.from("medications").select("name, kind, dose_amount, dose_unit, schedule_times, notes")
      .eq("user_id", user.id).eq("active", true),
    supabase.from("recipes").select("name, tags, ingredients, steps, glycemic_note")
      .eq("user_id", user.id).limit(20),
    supabase.from("appointments").select("specialty, doctor_name, appointment_date, location, notes, diagnosis, summary")
      .eq("user_id", user.id).order("appointment_date", { ascending: false }).limit(10),
    supabase.from("measurements").select("value, measured_at, context, metric_type")
      .eq("user_id", user.id)
      .gte("measured_at", weekAgo.toISOString()).order("measured_at", { ascending: false }).limit(120),
    supabase.from("documents").select("title, category, summary, extracted")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(15),
  ]);

  const profile = profileRes.data;
  const goal = goalConfig(profile?.primary_goal);
  const allMeasures = glucoseRes.data ?? [];
  const byType = (t: string) => allMeasures.filter((m: any) => m.metric_type === t);
  const gvals = byType("glucose").map((g: any) => g.value);
  const low = profile?.glucose_target_low ?? 70;
  const high = profile?.glucose_target_high ?? 180;
  const avgGlucose = gvals.length ? Math.round(gvals.reduce((s: number, v: number) => s + v, 0) / gvals.length) : null;

  const pressRows = byType("pressure");
  const avgSys = pressRows.length ? Math.round(pressRows.reduce((s: number, m: any) => s + m.value, 0) / pressRows.length) : null;
  const avgDia = pressRows.length ? Math.round(pressRows.reduce((s: number, m: any) => s + (m.context?.diastolic || 0), 0) / pressRows.length) : null;
  const cholRows = byType("cholesterol");
  const lastChol = cholRows[0] ?? null;
  const moodRows = byType("mood");
  const avgMood = moodRows.length ? +(moodRows.reduce((s: number, m: any) => s + m.value, 0) / moodRows.length).toFixed(1) : null;

  // Monta um contexto enxuto e legível para o modelo
  const ctx = {
    nome: profile?.full_name ?? null,
    objetivo: goal.label,
    alvo_glicemico: `${low}-${high} mg/dL`,
    glicemia_media_7d: avgGlucose,
    pressao_media_7d: avgSys ? `${avgSys}/${avgDia} mmHg` : null,
    meta_pressao: profile?.bp_systolic_target ? `${profile.bp_systolic_target}/${profile.bp_diastolic_target} mmHg` : null,
    colesterol_ultimo: lastChol ? { total: lastChol.value, ldl: lastChol.context?.ldl, hdl: lastChol.context?.hdl, triglicerides: lastChol.context?.triglicerides } : null,
    meta_ldl: profile?.ldl_target ?? null,
    humor_medio_7d: avgMood,
    medicacoes: (medsRes.data ?? []).map((m: any) => ({
      nome: m.name,
      dose: m.dose_amount ? `${m.dose_amount}${m.dose_unit ?? ""}` : null,
      horarios: m.schedule_times,
      obs: m.notes,
    })),
    consultas: (apptsRes.data ?? []).map((a: any) => ({
      especialidade: a.specialty,
      data: a.appointment_date,
      local: a.location,
      diagnostico: a.diagnosis,
      resumo: a.summary,
      obs: a.notes,
    })),
    receitas_dieta: (recipesRes.data ?? []).map((r: any) => ({
      nome: r.name,
      tags: r.tags,
      itens: r.ingredients,
      preparo: r.steps,
      nota: r.glycemic_note,
    })),
    documentos: (docsRes.data ?? []).map((d: any) => ({
      titulo: d.title,
      tipo: d.category,
      resumo: d.summary,
    })),
  };

  const system =
    "Você é o assistente de saúde do app Minha Saúde, conversando em português brasileiro com o próprio paciente. " +
    "Responda dúvidas com base nos DADOS DO USUÁRIO fornecidos abaixo (medicações, dieta, consultas, glicemia, documentos). " +
    "Você PODE: explicar como uma medicação prescrita a ele costuma ser usada e a técnica geral de aplicação de insulina " +
    "(rodízio de locais, ângulo, higiene, conservação da caneta), explicar as orientações de dieta que o médico/nutricionista dele já registrou, " +
    "lembrar horários e doses JÁ PRESCRITAS que constam nos dados dele, e tirar dúvidas gerais de convivência com diabetes/hipertensão. " +
    "Você NÃO PODE, em hipótese alguma: calcular ou sugerir uma NOVA dose de insulina, mandar aumentar/diminuir medicação, " +
    "fazer contagem de carboidratos para dosar insulina, ou dar diagnóstico. Nesses casos, oriente a falar com o médico (a consulta de endocrinologia dele está nos dados). " +
    "Se citar uma dose, deixe claro que está apenas repetindo o que JÁ foi prescrito no documento dele, não recomendando. " +
    "Seja acolhedor, direto e prático. Use frases curtas. Quando a pergunta sair do escopo dos dados, responda de forma geral e educativa e sugira confirmar com o profissional. " +
    "Se houver sinais de emergência (hipoglicemia grave, sintomas graves), oriente procurar atendimento imediato. " +
    "DADOS DO USUÁRIO (JSON):\n" + JSON.stringify(ctx, null, 2);

  // Mantém só as últimas mensagens para não estourar o contexto
  const history = messages.slice(-10).map((m: any) => ({
    role: (m.role === "assistant" ? "assistant" : "user") as "assistant" | "user",
    content: String(m.content || "").slice(0, 2000),
  }));

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "system" as const, content: system }, ...history],
      max_tokens: 700,
      temperature: 0.4,
    });
    const reply = completion.choices[0]?.message?.content ?? "Desculpe, não consegui responder agora.";
    return NextResponse.json({ reply });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Falha ao responder." }, { status: 500 });
  }
}
