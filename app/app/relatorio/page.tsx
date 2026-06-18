import { createClient } from "@/lib/supabase-server";
import RelatorioClient from "./RelatorioClient";

export const dynamic = "force-dynamic";

export default async function RelatorioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const since = new Date();
  since.setDate(since.getDate() - 180);
  const iso = since.toISOString();

  const [profileRes, glucoseRes, medsRes, medLogsRes, weightRes, actsRes] = await Promise.all([
    supabase.from("health_profiles").select("*").eq("id", user!.id).single(),
    supabase.from("measurements").select("*").eq("user_id", user!.id)
      .eq("metric_type", "glucose").gte("measured_at", iso).order("measured_at", { ascending: true }),
    supabase.from("medications").select("*").eq("user_id", user!.id).eq("active", true),
    supabase.from("medication_logs").select("*").eq("user_id", user!.id).gte("taken_at", iso),
    supabase.from("weight_logs").select("*").eq("user_id", user!.id)
      .gte("measured_at", iso).order("measured_at", { ascending: true }),
    supabase.from("activities").select("*").eq("user_id", user!.id).gte("performed_at", iso),
  ]);

  return (
    <RelatorioClient
      profile={profileRes.data}
      glucose={glucoseRes.data ?? []}
      medications={medsRes.data ?? []}
      medLogs={medLogsRes.data ?? []}
      weightLogs={weightRes.data ?? []}
      activities={actsRes.data ?? []}
    />
  );
}
