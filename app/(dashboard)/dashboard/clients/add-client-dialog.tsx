"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"
import { createClient } from "@/lib/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddClientDialog({ open, onOpenChange }: Props) {
  const { t, dir } = useI18n()
  const router = useRouter()
  const supabase = createClient()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [company, setCompany] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const reset = () => {
    setName(""); setEmail(""); setPhone(""); setCompany(""); setNotes(""); setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError("Auth error"); setLoading(false); return }

    const { error } = await supabase.from("clients").insert({
      user_id: user.id,
      name,
      email: email || null,
      phone: phone || null,
      company: company || null,
      notes: notes || null,
    })

    if (error) {
      setError(t.genericError + ": " + error.message)
      setLoading(false)
      return
    }

    reset()
    setLoading(false)
    onOpenChange(false)
    router.refresh()
  }

  const inputClass = "w-full h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-white placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm"

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v) }}>
      <DialogContent className="bg-[#0a0f1a] border-white/[0.08] rounded-[20px] max-w-md" dir={dir}>
        <DialogHeader>
          <DialogTitle className="text-[#e2e8f0]">{t.addClient ?? "Add Client"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <input type="text" placeholder={t.fullName} value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
          <input type="email" placeholder={t.email} value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          <input type="tel" placeholder={t.phone ?? "Phone"} value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} dir="ltr" />
          <input type="text" placeholder={t.company ?? "Company"} value={company} onChange={(e) => setCompany(e.target.value)} className={inputClass} />
          <textarea placeholder={t.notes} value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inputClass + " h-auto py-3 resize-none"} />

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="flex-1 h-12 rounded-xl font-medium bg-[#3b82f6] text-white hover:bg-[#2563eb] transition-all disabled:opacity-60">
              {loading ? "..." : t.save}
            </button>
            <button type="button" onClick={() => onOpenChange(false)} className="flex-1 h-12 rounded-xl border border-white/10 text-[#94a3b8] hover:bg-white/[0.04] transition-all">
              {t.cancel}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
