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
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [
    profileRes, gamRes, glucoseRes, glucoseTodayRes, medLogsRes,
    mealsRes, actsRes, weightRes, apptRes, insightRes,
  ] = await Promise.all([
    supabase.from("health_profiles").select("*").eq("id", user!.id).single(),
    supabase.from("gamification").select("*").eq("user_id", user!.id).single(),
    supabase.from("measurements").select("*").eq("user_id", user!.id)
      .eq("metric_type", "glucose").order("measured_at", { ascending: false }).limit(60),
    supabase.from("measurements").select("*").eq("user_id", user!.id)
      .eq("metric_type", "glucose").gte("measured_at", iso),
    supabase.from("medication_logs").select("*").eq("user_id", user!.id).gte("taken_at", iso),
    supabase.from("meals").select("*").eq("user_id", user!.id).gte("eaten_at", iso),
    supabase.from("activities").select("*").eq("user_id", user!.id).gte("performed_at", iso),
    supabase.from("weight_logs").select("*").eq("user_id", user!.id)
      .order("measured_at", { ascending: false }).limit(30),
    supabase.from("appointments").select("*").eq("user_id", user!.id)
      .gte("appointment_date", new Date().toISOString())
      .order("appointment_date", { ascending: true }).limit(1),
    supabase.from("ai_insights").select("*").eq("user_id", user!.id)
      .order("created_at", { ascending: false }).limit(1),
  ]);

  const weightToday = (weightRes.data ?? []).filter(
    (w) => new Date(w.measured_at) >= startOfDay
  ).length;

  return (
    <Dashboard
      profile={profileRes.data}
      gamification={gamRes.data}
      glucose={glucoseRes.data ?? []}
      glucoseToday={glucoseTodayRes.data ?? []}
      medLogsToday={medLogsRes.data ?? []}
      mealsToday={mealsRes.data ?? []}
      activitiesToday={actsRes.data ?? []}
      weightLogs={weightRes.data ?? []}
      weightTodayCount={weightToday}
      nextAppt={apptRes.data?.[0] ?? null}
      latestInsight={insightRes.data?.[0] ?? null}
    />
  );
}
