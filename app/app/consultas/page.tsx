import { createClient } from "@/lib/supabase-server";
import ConsultasClient from "./ConsultasClient";

export const dynamic = "force-dynamic";

export default async function ConsultasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("appointments")
    .select("*, attachments(*)")
    .eq("user_id", user!.id)
    .order("appointment_date", { ascending: false });

  return <ConsultasClient appointments={data ?? []} />;
}
