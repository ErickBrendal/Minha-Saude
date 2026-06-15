"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";

export async function addAppointment(form: {
  doctor_name: string;
  specialty: string;
  appointment_date: string;
  summary: string;
  diagnosis: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const { error } = await supabase.from("appointments").insert({
    user_id: user.id,
    doctor_name: form.doctor_name || null,
    specialty: form.specialty || null,
    appointment_date: form.appointment_date,
    summary: form.summary || null,
    diagnosis: form.diagnosis || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/app/consultas");
  revalidatePath("/app");
}

export async function deleteAppointment(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("appointments").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/app/consultas");
}

// Upload de anexo (recibo/exame). Recebe FormData com o arquivo.
export async function uploadAttachment(appointmentId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const file = formData.get("file") as File;
  if (!file) throw new Error("Nenhum arquivo");

  const ext = file.name.split(".").pop();
  const path = `${user.id}/${appointmentId}/${Date.now()}.${ext}`;

  const { error: upErr } = await supabase.storage.from("medical").upload(path, file);
  if (upErr) throw new Error(upErr.message);

  const { error } = await supabase.from("attachments").insert({
    user_id: user.id,
    appointment_id: appointmentId,
    file_path: path,
    file_name: file.name,
    mime_type: file.type,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/app/consultas");
}
