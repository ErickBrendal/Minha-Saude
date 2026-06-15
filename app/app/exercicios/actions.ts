"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";

export async function addActivity(
  type: string,
  duration: number,
  intensity: string,
  calories: number | null
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const { error } = await supabase.from("activities").insert({
    user_id: user.id,
    type,
    duration_min: duration,
    intensity,
    calories_kcal: calories,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/app/exercicios");
  revalidatePath("/app");
}

export async function deleteActivity(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("activities").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/app/exercicios");
}
