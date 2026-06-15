import { createClient } from "@/lib/supabase-server";
import ExerciciosClient from "./ExerciciosClient";

export const dynamic = "force-dynamic";

export default async function ExerciciosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("activities")
    .select("*")
    .eq("user_id", user!.id)
    .order("performed_at", { ascending: false })
    .limit(60);

  return <ExerciciosClient activities={data ?? []} />;
}
