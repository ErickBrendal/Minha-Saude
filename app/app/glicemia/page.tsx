import { createClient } from "@/lib/supabase-server";
import GlicemiaClient from "./GlicemiaClient";

export const dynamic = "force-dynamic";

export default async function GlicemiaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [profileRes, glucoseRes, medsRes, medLogsRes] = await Promise.all([
    supabase.from("health_profiles").select("*").eq("id", user!.id).single(),
    supabase.from("measurements").select("*").eq("user_id", user!.id)
      .eq("metric_type", "glucose").order("measured_at", { ascending: false }).limit(200),
    supabase.from("medications").select("*").eq("user_id", user!.id)
      .eq("active", true).order("created_at", { ascending: true }),
    supabase.from("medication_logs").select("*").eq("user_id", user!.id)
      .gte("taken_at", startOfDay.toISOString()),
  ]);

  return (
    <GlicemiaClient
      low={profileRes.data?.glucose_target_low ?? 70}
      high={profileRes.data?.glucose_target_high ?? 180}
      glucose={glucoseRes.data ?? []}
      medications={medsRes.data ?? []}
      medLogsToday={medLogsRes.data ?? []}
    />
  );
}
