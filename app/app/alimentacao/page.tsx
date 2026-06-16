import { createClient } from "@/lib/supabase-server";
import AlimentacaoClient from "./AlimentacaoClient";

export const dynamic = "force-dynamic";

export default async function AlimentacaoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [mealsRes, recipesRes, profileRes, weightRes] = await Promise.all([
    supabase.from("meals").select("*").eq("user_id", user!.id)
      .order("eaten_at", { ascending: false }).limit(40),
    supabase.from("recipes").select("*").eq("user_id", user!.id)
      .order("created_at", { ascending: false }).limit(60),
    supabase.from("health_profiles").select("*").eq("id", user!.id).single(),
    supabase.from("weight_logs").select("*").eq("user_id", user!.id)
      .order("measured_at", { ascending: false }).limit(60),
  ]);

  return (
    <AlimentacaoClient
      meals={mealsRes.data ?? []}
      recipes={recipesRes.data ?? []}
      profile={profileRes.data}
      weightLogs={weightRes.data ?? []}
    />
  );
}
