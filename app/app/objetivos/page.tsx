import { createClient } from "@/lib/supabase-server";
import ObjetivosClient from "./ObjetivosClient";

export const dynamic = "force-dynamic";

export default async function ObjetivosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("health_profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  return <ObjetivosClient currentGoal={profile?.primary_goal ?? null} profile={profile} />;
}
