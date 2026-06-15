import { createClient } from "@/lib/supabase-server";
import Dashboard from "./Dashboard";

export const dynamic = "force-dynamic";

export default async function AppHome() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const iso = startOfDay.toISOString();

  const [profileRes, glucoseRes, medLogsRes, mealsRes, actsRes, apptRes] =
    await Promise.all([
      supabase.from("health_profiles").select("*").eq("id", user!.id).single(),
      supabase
        .from("measurements")
        .select("*")
        .eq("user_id", user!.id)
        .eq("metric_type", "glucose")
        .order("measured_at", { ascending: false })
        .limit(60),
      supabase
        .from("medication_logs")
        .select("*")
        .eq("user_id", user!.id)
        .gte("taken_at", iso),
      supabase.from("meals").select("*").eq("user_id", user!.id).gte("eaten_at", iso),
      supabase
        .from("activities")
        .select("*")
        .eq("user_id", user!.id)
        .gte("performed_at", iso),
      supabase
        .from("appointments")
        .select("*")
        .eq("user_id", user!.id)
        .gte("appointment_date", new Date().toISOString())
        .order("appointment_date", { ascending: true })
        .limit(1),
    ]);

  return (
    <Dashboard
      profile={profileRes.data}
      glucose={glucoseRes.data ?? []}
      medLogsToday={medLogsRes.data ?? []}
      mealsToday={mealsRes.data ?? []}
      activitiesToday={actsRes.data ?? []}
      nextAppt={apptRes.data?.[0] ?? null}
      email={user!.email ?? ""}
    />
  );
}
