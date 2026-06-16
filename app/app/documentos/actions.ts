"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";

// Salva o registro do documento + distribui os dados extraídos para as áreas certas
export async function applyDocument(doc: {
  category: string;
  title: string;
  summary: string;
  extracted: any;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const ext = doc.extracted || {};
  const applied: string[] = [];

  // 1) Medicações
  for (const m of ext.medications || []) {
    if (!m?.name) continue;
    const { data: exists } = await supabase
      .from("medications")
      .select("id")
      .eq("user_id", user.id)
      .eq("name", m.name)
      .eq("active", true)
      .maybeSingle();
    if (!exists) {
      await supabase.from("medications").insert({
        user_id: user.id,
        name: m.name,
        kind: m.dose_unit === "U" ? "insulina" : "comprimido",
        dose_amount: m.dose_amount ?? null,
        dose_unit: m.dose_unit ?? null,
        schedule_times: m.schedule_times ?? [],
        active: true,
        notes: m.notes ?? null,
      });
      applied.push(`Medicação: ${m.name}`);
    }
  }

  // 2) Consulta
  if (ext.appointment && ext.appointment.date) {
    const { data: exists } = await supabase
      .from("appointments")
      .select("id")
      .eq("user_id", user.id)
      .eq("appointment_date", ext.appointment.date)
      .maybeSingle();
    if (!exists) {
      await supabase.from("appointments").insert({
        user_id: user.id,
        doctor_name: ext.appointment.doctor_name ?? null,
        specialty: ext.appointment.specialty ?? null,
        location: ext.appointment.location ?? null,
        appointment_date: ext.appointment.date,
        notes: ext.appointment.notes ?? null,
      });
      applied.push(`Consulta: ${ext.appointment.specialty ?? "agendada"}`);
    }
  }

  // 3) Itens de dieta -> biblioteca de receitas
  for (const d of ext.diet_items || []) {
    if (!d?.name) continue;
    await supabase.from("recipes").insert({
      user_id: user.id,
      name: d.name,
      tags: d.tags ?? [],
      ingredients: d.ingredients ?? [],
      steps: d.steps ?? [],
      glycemic_note: d.note ?? null,
      goal_kind: "diabetes",
      favorite: false,
    });
    applied.push(`Dieta: ${d.name}`);
  }

  // 4) Registra o documento na central
  await supabase.from("documents").insert({
    user_id: user.id,
    file_name: doc.title,
    category: doc.category,
    title: doc.title,
    summary: doc.summary,
    extracted: ext,
    applied: true,
  });

  revalidatePath("/app/documentos");
  revalidatePath("/app/medicacoes");
  revalidatePath("/app/glicemia");
  revalidatePath("/app/consultas");
  revalidatePath("/app/alimentacao");
  revalidatePath("/app");

  return { applied };
}

export async function deleteDocument(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/app/documentos");
}
