import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AutoTrackingView } from "./auto-tracking-view"

export default async function AutoTrackingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: tokens } = await supabase
    .from("device_tokens")
    .select("id, label, created_at, last_used_at")
    .is("revoked_at", null)
    .order("created_at", { ascending: false })

  const endpoint = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/parse-transaction`

  return <AutoTrackingView userId={user.id} endpoint={endpoint} initialTokens={tokens ?? []} />
}
