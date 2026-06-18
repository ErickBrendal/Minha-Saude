"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";

export async function addGlucose(value: number, timing: string | null, note: string | null) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const { error } = await supabase.from("measurements").insert({
    user_id: user.id,
    metric_type: "glucose",
    value,
    unit: "mg/dL",
    context: timing ? { timing } : {},
    note,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/app/glicemia");
  revalidatePath("/app");
}

export async function deleteMeasurement(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("measurements").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/app/glicemia");
  revalidatePath("/app");
}

export async function logMedication(
  medicationId: string | null,
  name: string,
  dose: number | null,
  unit: string | null,
  site: string | null
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const { error } = await supabase.from("medication_logs").insert({
    user_id: user.id,
    medication_id: medicationId,
    medication_name: name,
    dose_amount: dose,
    dose_unit: unit,
    injection_site: site,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/app/medicacoes");
  revalidatePath("/app/glicemia");
  revalidatePath("/app");
}

export async function addMedication(
  name: string,
  kind: string,
  dose: number | null,
  unit: string | null,
  times: string[]
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const { error } = await supabase.from("medications").insert({
    user_id: user.id,
    name,
    kind,
    dose_amount: dose,
    dose_unit: unit,
    schedule_times: times,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/app/medicacoes");
}

export async function updateMedication(
  id: string,
  name: string,
  kind: string,
  dose: number | null,
  unit: string | null,
  times: string[]
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const { error } = await supabase
    .from("medications")
    .update({ name, kind, dose_amount: dose, dose_unit: unit, schedule_times: times })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/app/medicacoes");
  revalidatePath("/app/glicemia");
  revalidatePath("/app");
}

export async function deleteMedication(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  // Desativa em vez de apagar, preservando o histórico de doses já registradas
  const { error } = await supabase
    .from("medications")
    .update({ active: false })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/app/medicacoes");
  revalidatePath("/app/glicemia");
  revalidatePath("/app");
}

export async function updateTargets(low: number, high: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const { error } = await supabase
    .from("health_profiles")
    .update({ glucose_target_low: low, glucose_target_high: high, updated_at: new Date().toISOString() })
    .eq("id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/app/perfil");
  revalidatePath("/app");
}

// ============================================================
// Objetivos, peso e gamificação
// ============================================================

export async function setPrimaryGoal(goalKind: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const { error } = await supabase
    .from("health_profiles")
    .update({ primary_goal: goalKind, updated_at: new Date().toISOString() })
    .eq("id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/app");
  revalidatePath("/app/objetivos");
}

export async function addWeight(weightKg: number, source = "manual") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const { error } = await supabase.from("weight_logs").insert({
    user_id: user.id,
    weight_kg: weightKg,
    source,
  });
  if (error) throw new Error(error.message);

  // Atualiza peso atual no perfil
  await supabase
    .from("health_profiles")
    .update({ weight_kg: weightKg, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  revalidatePath("/app");
  revalidatePath("/app/perfil");
}

export async function setTargets(opts: {
  target_weight_kg?: number | null;
  daily_calorie_target?: number | null;
  daily_carb_target?: number | null;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const { error } = await supabase
    .from("health_profiles")
    .update({ ...opts, updated_at: new Date().toISOString() })
    .eq("id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/app");
}

// Atualiza streak/pontos ao registrar atividade. Idempotente por dia.
export async function touchStreak(pointsToAdd: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: g } = await supabase
    .from("gamification")
    .select("*")
    .eq("user_id", user.id)
    .single();
  if (!g) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10);
  const last = g.last_active_date;

  let streak = g.current_streak ?? 0;
  if (last !== todayStr) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().slice(0, 10);
    streak = last === yStr ? streak + 1 : 1;
  }

  await supabase
    .from("gamification")
    .update({
      current_streak: streak,
      longest_streak: Math.max(streak, g.longest_streak ?? 0),
      total_points: (g.total_points ?? 0) + pointsToAdd,
      last_active_date: todayStr,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  revalidatePath("/app");
}
