import { createClient } from "@/lib/supabase-server";
import EspecialistaClient from "./EspecialistaClient";

export const dynamic = "force-dynamic";

export default async function EspecialistaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("health_profiles").select("primary_goal").eq("id", user!.id).single();
  const { data: insights } = await supabase
    .from("ai_insights").select("*").eq("user_id", user!.id)
    .order("created_at", { ascending: false }).limit(10);

  return <EspecialistaClient goalKind={profile?.primary_goal ?? null} history={insights ?? []} />;
}
