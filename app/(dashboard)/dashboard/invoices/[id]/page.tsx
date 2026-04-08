import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { InvoicePreview } from "./invoice-preview"
import type { Invoice, Client, Profile } from "@/lib/types/database"

interface Props {
  params: Promise<{ id: string }>
}

export default async function InvoiceDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: invoice } = await supabase
    .from("invoices_decrypted")
    .select("*, client:clients_decrypted(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (!invoice) {
    notFound()
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  const typedInvoice = invoice as Invoice & { client: Client | null }
  const typedProfile = (profile ?? {
    id: user.id,
    email: user.email ?? null,
    full_name: null,
    avatar_url: null,
    specialty: null,
    currency: "USD",
    created_at: "",
    updated_at: "",
  }) as Profile

  return (
    <InvoicePreview
      invoice={typedInvoice}
      profile={typedProfile}
    />
  )
}
