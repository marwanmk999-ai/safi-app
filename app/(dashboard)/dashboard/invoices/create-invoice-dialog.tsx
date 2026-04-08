"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useI18n } from "@/lib/i18n/context"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Trash2, Loader2, UserPlus } from "lucide-react"
import type { Client } from "@/lib/types/database"

interface LineItem {
  description: string
  quantity: number
  unit_price: number
}

interface CreateInvoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clients: Client[]
}

function generateInvoiceNumber() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const seq = String(Math.floor(Math.random() * 9000) + 1000)
  return `INV-${y}${m}-${seq}`
}

const inputClass =
  "w-full h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-white text-sm placeholder:text-[#475569] outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
const labelClass = "text-xs font-medium text-[#94a3b8] mb-1.5 block"

export function CreateInvoiceDialog({
  open,
  onOpenChange,
  clients,
}: CreateInvoiceDialogProps) {
  const router = useRouter()
  const { t, dir } = useI18n()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [invoiceNumber, setInvoiceNumber] = useState(generateInvoiceNumber)
  const [clientId, setClientId] = useState("")
  const [currency, setCurrency] = useState("USD")
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0])
  const [dueDate, setDueDate] = useState("")
  const [notes, setNotes] = useState("")
  const [taxRate, setTaxRate] = useState("")
  const [discount, setDiscount] = useState("")

  // New client inline fields
  const [newClientName, setNewClientName] = useState("")
  const [newClientEmail, setNewClientEmail] = useState("")
  const [newClientPhone, setNewClientPhone] = useState("")
  const [newClientCompany, setNewClientCompany] = useState("")

  const isNewClient = clientId === "__new__"

  // Line items
  const [items, setItems] = useState<LineItem[]>([
    { description: "", quantity: 1, unit_price: 0 },
  ])

  const addItem = () =>
    setItems([...items, { description: "", quantity: 1, unit_price: 0 }])

  const removeItem = (index: number) => {
    if (items.length <= 1) return
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof LineItem, value: string | number) => {
    setItems(items.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
  }

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
  const taxAmount = subtotal * (Number(taxRate) / 100 || 0)
  const discountAmount = Number(discount) || 0
  const total = subtotal + taxAmount - discountAmount

  function resetForm() {
    setInvoiceNumber(generateInvoiceNumber())
    setClientId("")
    setCurrency("USD")
    setIssueDate(new Date().toISOString().split("T")[0])
    setDueDate("")
    setNotes("")
    setTaxRate("")
    setDiscount("")
    setItems([{ description: "", quantity: 1, unit_price: 0 }])
    setNewClientName("")
    setNewClientEmail("")
    setNewClientPhone("")
    setNewClientCompany("")
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const validItems = items.filter((item) => item.description && item.unit_price > 0)
    if (validItems.length === 0) {
      setError(t.genericError + ": " + t.addItem)
      return
    }

    // Validate new client name if creating new client
    if (isNewClient && !newClientName.trim()) {
      setError(t.clientNameRequired)
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError("Auth error"); setLoading(false); return }

      let finalClientId: string | null = clientId || null

      // Create new client first if needed
      if (isNewClient) {
        const { data: newClient, error: clientError } = await supabase
          .from("clients")
          .insert({
            user_id: user.id,
            name: newClientName.trim(),
            email: newClientEmail.trim() || null,
            phone: newClientPhone.trim() || null,
            company: newClientCompany.trim() || null,
            notes: null,
          })
          .select("id")
          .single()

        if (clientError) {
          setError(t.genericError + ": " + clientError.message)
          setLoading(false)
          return
        }

        finalClientId = newClient.id
      }

      const { error: insertError } = await supabase.from("invoices").insert({
        user_id: user.id,
        invoice_number: invoiceNumber,
        client_id: finalClientId,
        description: validItems.map((i) => i.description).join(dir === "rtl" ? "، " : ", "),
        amount: total,
        currency,
        status: "draft" as const,
        issue_date: issueDate,
        due_date: dueDate || null,
        notes: JSON.stringify(validItems),
        tax_rate: Number(taxRate) || null,
        discount: discountAmount || null,
        items: validItems,
      })

      if (insertError) { setError(insertError.message); setLoading(false); return }

      resetForm()
      onOpenChange(false)
      router.refresh()
    } catch {
      setError("Unexpected error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v) }}>
      <DialogContent
        className="sm:max-w-2xl bg-[#0a0f1a] border-white/[0.06] text-[#e2e8f0] max-h-[90vh] overflow-y-auto"
        dir={dir}
      >
        <DialogHeader>
          <DialogTitle className="text-[#e2e8f0] text-lg">{t.createInvoiceBtn}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          {/* Row 1: Invoice # + Client */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{t.invoiceNumber}</label>
              <input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t.client}</label>
              <select value={clientId} onChange={(e) => setClientId(e.target.value)} className={inputClass}>
                <option value="" className="bg-[#0a0f1a]">{t.selectClient}</option>
                <option value="__new__" className="bg-[#0a0f1a]">＋ {t.addNewClient}</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#0a0f1a]">
                    {c.name}{c.company ? ` — ${c.company}` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Inline new client fields */}
          {isNewClient && (
            <div className="rounded-xl border border-[#3b82f6]/20 bg-[#3b82f6]/[0.03] p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <UserPlus className="size-4 text-[#3b82f6]" />
                <span className="text-xs font-medium text-[#3b82f6]">{t.addNewClient}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>{t.fullName} *</label>
                  <input
                    type="text"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder={t.fullName}
                    required
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>{t.email}</label>
                  <input
                    type="email"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    placeholder={t.email}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>{t.phone}</label>
                  <input
                    type="tel"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    placeholder={t.phone}
                    className={inputClass}
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className={labelClass}>{t.company}</label>
                  <input
                    type="text"
                    value={newClientCompany}
                    onChange={(e) => setNewClientCompany(e.target.value)}
                    placeholder={t.company}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Row 2: Dates + Currency */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>{t.issueDate}</label>
              <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t.dueDate}</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t.currency}</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputClass}>
                {["USD", "EUR", "SAR", "AED", "JOD", "EGP", "QAR", "KWD"].map((c) => (
                  <option key={c} value={c} className="bg-[#0a0f1a]">{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ─── Line Items ─── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-medium text-[#94a3b8]">{t.service}</label>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1.5 text-xs text-[#3b82f6] hover:text-[#60a5fa] font-medium transition-colors"
              >
                <Plus className="size-3.5" />
                {t.addItem}
              </button>
            </div>

            <div className="space-y-2">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 text-[10px] font-semibold text-[#475569] uppercase tracking-wider px-1">
                <div className="col-span-6">{t.description}</div>
                <div className="col-span-2 text-center">{t.quantity}</div>
                <div className="col-span-3 text-end">{t.unitPrice}</div>
                <div className="col-span-1" />
              </div>

              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center group">
                  <div className="col-span-6">
                    <input
                      placeholder={t.description}
                      value={item.description}
                      onChange={(e) => updateItem(i, "description", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(i, "quantity", Number(e.target.value))}
                      className={inputClass + " text-center"}
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={item.unit_price || ""}
                      onChange={(e) => updateItem(i, "unit_price", Number(e.target.value))}
                      className={inputClass + " text-end"}
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(i)}
                        className="size-8 rounded-lg flex items-center justify-center text-[#475569] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ─── Totals ─── */}
          <div className="border-t border-white/[0.06] pt-4">
            <div className="flex justify-end">
              <div className="w-64 space-y-2.5 text-sm">
                <div className="flex justify-between text-[#94a3b8]">
                  <span>{t.subtotal}</span>
                  <span className="tabular-nums">{subtotal.toFixed(2)} {currency}</span>
                </div>

                {/* Tax + Discount row */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-[#475569]">{t.tax} %</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="0"
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value)}
                      className="w-full h-8 rounded-lg border border-white/10 bg-white/5 px-2 text-white text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#475569]">{t.discount}</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      className="w-full h-8 rounded-lg border border-white/10 bg-white/5 px-2 text-white text-xs outline-none"
                    />
                  </div>
                </div>

                {(taxAmount > 0 || discountAmount > 0) && (
                  <>
                    {taxAmount > 0 && (
                      <div className="flex justify-between text-[#64748b] text-xs">
                        <span>{t.tax} ({taxRate}%)</span>
                        <span className="tabular-nums">+{taxAmount.toFixed(2)}</span>
                      </div>
                    )}
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-[#64748b] text-xs">
                        <span>{t.discount}</span>
                        <span className="tabular-nums">-{discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                  </>
                )}

                <div className="border-t border-white/[0.08] pt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#e2e8f0]">{t.total}</span>
                    <span className="text-lg font-bold text-[#3b82f6] tabular-nums">
                      {total.toFixed(2)} {currency}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={labelClass}>{t.notes}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder={t.notes}
              className="w-full rounded-xl border border-white/10 bg-white/5 text-white px-3 py-2.5 text-sm placeholder:text-[#475569] outline-none resize-none"
            />
          </div>

          {error && <p className="text-sm text-[#ef4444]">{error}</p>}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="safi-btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              {t.createInvoiceBtn}
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-[3.25rem] px-6 rounded-[14px] border border-white/[0.08] text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-white/[0.04] transition-all"
            >
              {t.cancel}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
