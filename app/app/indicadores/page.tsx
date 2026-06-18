import { createClient } from "@/lib/supabase-server";
import IndicadoresClient from "./IndicadoresClient";

export const dynamic = "force-dynamic";

export default async function IndicadoresPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const now = new Date();
  const week = new Date(now.getTime() - 7 * 864e5);
  const twoWeeks = new Date(now.getTime() - 14 * 864e5);
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [profileRes, measuresRes, medsRes, medLogsRes] = await Promise.all([
    supabase.from("health_profiles").select("*").eq("id", user!.id).single(),
    // Todas as medições das últimas 2 semanas (glicemia, pressão, colesterol, humor)
    supabase.from("measurements").select("*").eq("user_id", user!.id)
      .gte("measured_at", twoWeeks.toISOString()).order("measured_at", { ascending: false }),
    supabase.from("medications").select("*").eq("user_id", user!.id).eq("active", true),
    supabase.from("medication_logs").select("*").eq("user_id", user!.id)
      .gte("taken_at", week.toISOString()),
  ]);

  // Colesterol pode ser antigo (exame); pega o mais recente de qualquer data
  const { data: cholLatest } = await supabase
    .from("measurements").select("*").eq("user_id", user!.id)
    .eq("metric_type", "cholesterol").order("measured_at", { ascending: false }).limit(6);

  return (
    <IndicadoresClient
      profile={profileRes.data}
      measures={measuresRes.data ?? []}
      cholesterol={cholLatest ?? []}
      medications={medsRes.data ?? []}
      medLogsWeek={medLogsRes.data ?? []}
      weekISO={week.toISOString()}
      twoWeeksISO={twoWeeks.toISOString()}
    />
  );
}
