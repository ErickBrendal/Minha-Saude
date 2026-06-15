import { createClient } from "@/lib/supabase-server";
import AlimentacaoClient from "./AlimentacaoClient";

export const dynamic = "force-dynamic";

export default async function AlimentacaoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from("meals")
    .select("*")
    .eq("user_id", user!.id)
    .order("eaten_at", { ascending: false })
    .limit(40);

  return <AlimentacaoClient meals={data ?? []} />;
}
