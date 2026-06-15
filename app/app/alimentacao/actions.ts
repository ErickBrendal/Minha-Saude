"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";

export async function saveMeal(meal: {
  meal_type: string | null;
  description: string;
  calories_kcal: number | null;
  carbs_g: number | null;
  protein_g: number | null;
  fat_g: number | null;
  ai_analysis: any;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const { error } = await supabase.from("meals").insert({
    user_id: user.id,
    meal_type: meal.meal_type,
    description: meal.description,
    calories_kcal: meal.calories_kcal,
    carbs_g: meal.carbs_g,
    protein_g: meal.protein_g,
    fat_g: meal.fat_g,
    ai_analysis: meal.ai_analysis,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/app/alimentacao");
  revalidatePath("/app");
}

export async function deleteMeal(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("meals").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/app/alimentacao");
}
