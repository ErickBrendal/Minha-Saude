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
