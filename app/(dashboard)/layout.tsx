import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardShell } from "./dashboard-shell";
import { checkBudgetNotifications } from "@/lib/notifications/check-budgets";
import { cookies } from "next/headers";
import type { Locale } from "@/lib/i18n/translations";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed, full_name, currency")
    .eq("id", user.id)
    .single();

  if (!profile?.onboarding_completed) {
    redirect("/onboarding");
  }

  const userCurrency = profile?.currency ?? "USD";
  const cookieStore = await cookies();
  const locale = (cookieStore.get("safi-lang")?.value === "en" ? "en" : "ar") as Locale;

  // Check budgets and generate notifications
  await checkBudgetNotifications(supabase, user.id, userCurrency, locale);

  // Fetch recent notifications
  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const displayName = profile?.full_name ?? user.user_metadata?.full_name ?? user.email ?? "";

  return (
    <DashboardShell
      user={{ email: user.email ?? "", name: displayName }}
      notifications={notifications ?? []}
    >
      {children}
    </DashboardShell>
  );
}
