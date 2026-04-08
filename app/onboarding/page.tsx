import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { OnboardingWizard } from "./onboarding-wizard"

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .single()

  // If already completed onboarding, go to dashboard
  if (profile?.onboarding_completed) {
    redirect("/dashboard")
  }

  return <OnboardingWizard userId={user.id} userEmail={user.email ?? ""} />
}
