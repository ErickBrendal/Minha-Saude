import { createClient } from "@/lib/supabase-server";
import AssistenteClient from "./AssistenteClient";

export const dynamic = "force-dynamic";

export default async function AssistentePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("health_profiles").select("full_name, primary_goal").eq("id", user!.id).single();
  const { data: meds } = await supabase
    .from("medications").select("name").eq("user_id", user!.id).eq("active", true).limit(5);

  return (
    <AssistenteClient
      firstName={(profile?.full_name || "").split(" ")[0] || ""}
      medNames={(meds ?? []).map((m) => m.name)}
    />
  );
}
