import { createClient } from "@/lib/supabase-server";
import PerfilClient from "./PerfilClient";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("health_profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  return <PerfilClient profile={data} email={user!.email ?? ""} />;
}
