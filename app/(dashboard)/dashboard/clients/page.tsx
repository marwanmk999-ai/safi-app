import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ClientsList } from "./clients-list"

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { redirect("/login") }
  const userId = user.id

  const { data: clients, error: clientsError } = await supabase
    .from("clients_decrypted")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (clientsError) console.error("[clients] clients query error:", clientsError.message);

  // Get income count per client
  const { data: incomeData, error: incomeError } = await supabase
    .from("income_decrypted")
    .select("client_name")
    .eq("user_id", userId)

  if (incomeError) console.error("[clients] income query error:", incomeError.message);

  const transactionCounts: Record<string, number> = {}
  for (const row of incomeData ?? []) {
    if (row.client_name) {
      transactionCounts[row.client_name] = (transactionCounts[row.client_name] ?? 0) + 1
    }
  }

  return (
    <ClientsList
      clients={clients ?? []}
      transactionCounts={transactionCounts}
    />
  )
}
