import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import TabBar from "@/components/TabBar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", position: "relative" }}>
      <div style={{ paddingBottom: 90 }}>{children}</div>
      <TabBar />
    </div>
  );
}
