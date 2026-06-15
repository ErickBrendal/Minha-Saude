import { createClient } from "@/lib/supabase-server";
import MedicacoesClient from "./MedicacoesClient";

export const dynamic = "force-dynamic";

export default async function MedicacoesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [medsRes, logsRes] = await Promise.all([
    supabase
      .from("medications")
      .select("*")
      .eq("user_id", user!.id)
      .eq("active", true)
      .order("created_at", { ascending: true }),
    supabase
      .from("medication_logs")
      .select("*")
      .eq("user_id", user!.id)
      .order("taken_at", { ascending: false })
      .limit(50),
  ]);

  return <MedicacoesClient medications={medsRes.data ?? []} logs={logsRes.data ?? []} />;
}
