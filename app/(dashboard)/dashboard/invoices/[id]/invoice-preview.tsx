"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import { createClient } from "@/lib/supabase/client"
import { formatAmount } from "@/lib/format"
import { ArrowRight, ArrowLeft, Download, Printer, CheckCircle2, Mail, Phone } from "lucide-react"
import type { Invoice, Client, Profile } from "@/lib/types/database"

interface LineItem {
  description: string
  quantity: number
  unit_price: number
}

const statusColors: Record<Invoice["status"], string> = {
  draft: "#94a3b8",
  pending: "#f59e0b",
  paid: "#10b981",
  overdue: "#ef4444",
  cancelled: "#6b7280",
}

function fmtDate(dateStr: string | null, locale: string) {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString(
    locale === "ar" ? "ar-EG" : "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  )
}

interface Props {
  invoice: Invoice & { client: Client | null }
  profile: Profile
}

export function InvoicePreview({ invoice, profile }: Props) {
  const { t, dir, locale } = useI18n()
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const statusLabel = t[invoice.status as keyof typeof t] ?? invoice.status
  const currency = invoice.currency ?? profile.currency ?? "USD"

  const items: LineItem[] = (() => {
    if (!invoice.notes) return []
    try {
      const parsed = JSON.parse(invoice.notes)
      if (Array.isArray(parsed)) return parsed as LineItem[]
    } catch { /* notes is plain text */ }
    return []
  })()

  const hasLineItems = items.length > 0
  const subtotal = hasLineItems
    ? items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
    : Number(invoice.amount)
  const taxRate = Number(invoice.tax_rate ?? 0)
  const discountAmt = Number(invoice.discount ?? 0)
  const taxAmount = subtotal * (taxRate / 100)
  const totalAmount = subtotal + taxAmount - discountAmt

  const canMarkPaid = invoice.status === "pending" || invoice.status === "overdue"

  const handleMarkAsPaid = async () => {
    setLoading(true)
    await supabase
      .from("invoices")
      .update({ status: "paid", paid_date: new Date().toISOString().split("T")[0] })
      .eq("id", invoice.id)
    router.refresh()
    setLoading(false)
  }

  const BackArrow = dir === "rtl" ? ArrowRight : ArrowLeft

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #invoice-print-area, #invoice-print-area * { visibility: visible; }
          #invoice-print-area {
            position: absolute; top: 0; left: 0; right: 0;
            width: 100%; margin: 0; padding: 32px;
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="max-w-3xl mx-auto space-y-6" dir={dir}>
        {/* ─── Toolbar ─── */}
        <div className="no-print flex items-center justify-between">
          <Link
            href="/dashboard/invoices"
            className="inline-flex items-center gap-2 text-[#94a3b8] hover:text-[#e2e8f0] text-sm transition-colors"
          >
            <BackArrow className="size-4" />
            {t.backToInvoices}
          </Link>
          <div className="flex items-center gap-2">
            {canMarkPaid && (
              <button
                onClick={handleMarkAsPaid}
                disabled={loading}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white text-sm font-medium transition-all disabled:opacity-60"
              >
                <CheckCircle2 className="size-3.5" />
                {loading ? "..." : t.markAsPaid}
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-xl border border-white/[0.08] text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-white/[0.04] text-sm transition-all"
            >
              <Download className="size-3.5" />
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-xl border border-white/[0.08] text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-white/[0.04] text-sm transition-all"
            >
              <Printer className="size-3.5" />
            </button>
          </div>
        </div>

        {/* ─── Invoice Paper ─── */}
        <div
          id="invoice-print-area"
          className="bg-white rounded-2xl shadow-2xl shadow-black/20 overflow-hidden"
          dir={dir}
        >
          <div className="p-8 sm:p-12">

            {/* Header: Logo + Contact Info */}
            <div className="flex justify-between items-start mb-10">
              <div>
                {profile.business_logo ? (
                  <img
                    src={profile.business_logo}
                    alt={profile.business_name ?? "Logo"}
                    className="h-10 max-w-[160px] object-contain mb-4"
                  />
                ) : (
                  <img
                    src={locale === "ar" ? "/Logo AR.png" : "/Logo EN.png"}
                    alt="Safi"
                    className="h-8 mb-4"
                  />
                )}
                {profile.business_name && (
                  <p className="text-gray-900 font-semibold text-sm">{profile.business_name}</p>
                )}
              </div>
              <div className="text-end text-sm text-gray-500 space-y-1">
                {profile.email && (
                  <p className="flex items-center gap-1.5 justify-end">
                    <span className="size-1.5 rounded-full bg-[#10b981] inline-block" />
                    {profile.email}
                  </p>
                )}
                {profile.specialty && (
                  <p className="text-gray-400">{profile.specialty}</p>
                )}
              </div>
            </div>

            {/* Recipient + Invoice Info */}
            <div className="flex justify-between items-start mb-10 gap-8">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-3">
                  {t.to}
                </p>
                {invoice.client ? (
                  <div className="space-y-1">
                    <p className="text-gray-900 font-semibold text-base">
                      {invoice.client.name}
                    </p>
                    {invoice.client.company && (
                      <p className="text-gray-500 text-sm">{invoice.client.company}</p>
                    )}
                    {invoice.client.email && (
                      <p className="text-gray-400 text-sm flex items-center gap-1.5 mt-2">
                        <Mail className="size-3" />
                        {invoice.client.email}
                      </p>
                    )}
                    {invoice.client.phone && (
                      <p className="text-gray-400 text-sm flex items-center gap-1.5">
                        <Phone className="size-3" />
                        <span dir="ltr">{invoice.client.phone}</span>
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-300">—</p>
                )}
              </div>

              <div className="text-end">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  {t.invoice}
                </h2>
                <div className="space-y-1.5 text-sm">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em]">
                      {t.invoiceNumber}
                    </p>
                    <p className="text-gray-900 font-medium">{invoice.invoice_number}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em]">
                      {t.issueDate}
                    </p>
                    <p className="text-gray-700">{fmtDate(invoice.issue_date, locale)}</p>
                  </div>
                  {invoice.due_date && (
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em]">
                        {t.dueDate}
                      </p>
                      <p className="text-gray-700">{fmtDate(invoice.due_date, locale)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ─── Line Items Table ─── */}
            <div className="mb-8">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-900">
                    <th className="py-3 text-start text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {t.service}
                    </th>
                    {hasLineItems && (
                      <>
                        <th className="py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">
                          {t.quantity}
                        </th>
                        <th className="py-3 text-end text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">
                          {t.unitPrice}
                        </th>
                      </>
                    )}
                    <th className="py-3 text-end text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">
                      {t.amount}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {hasLineItems ? (
                    items.map((item, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="py-3.5 text-[#3b82f6] font-medium">{item.description}</td>
                        <td className="py-3.5 text-center text-gray-600">{item.quantity}</td>
                        <td className="py-3.5 text-end text-gray-600">
                          {formatAmount(item.unit_price, currency)}
                        </td>
                        <td className="py-3.5 text-end text-gray-900 font-medium tabular-nums">
                          {formatAmount(item.quantity * item.unit_price, currency)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="border-b border-gray-100">
                      <td className="py-3.5 text-[#3b82f6] font-medium">
                        {invoice.description || "—"}
                      </td>
                      <td className="py-3.5 text-end text-gray-900 font-medium tabular-nums">
                        {formatAmount(Number(invoice.amount), currency)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* ─── Totals ─── */}
            <div className="flex justify-end mb-10">
              <div className="w-72 space-y-2 text-sm">
                {(hasLineItems || taxRate > 0 || discountAmt > 0) && (
                  <>
                    <div className="flex justify-between text-gray-600">
                      <span>{t.subtotal}</span>
                      <span className="tabular-nums">{formatAmount(subtotal, currency)}</span>
                    </div>
                    {taxRate > 0 && (
                      <div className="flex justify-between text-gray-600">
                        <span>{t.tax} {taxRate}%</span>
                        <span className="tabular-nums">{formatAmount(taxAmount, currency)}</span>
                      </div>
                    )}
                    {discountAmt > 0 && (
                      <div className="flex justify-between text-gray-600">
                        <span>{t.discount}</span>
                        <span className="tabular-nums">-{formatAmount(discountAmt, currency)}</span>
                      </div>
                    )}
                  </>
                )}
                <div className="border-t-2 border-gray-900 pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-900">{t.total}</span>
                    <span className="text-xl font-bold text-[#3b82f6] tabular-nums">
                      {formatAmount(hasLineItems ? totalAmount : Number(invoice.amount), currency)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── Status Badge ─── */}
            <div className="flex justify-center mb-8">
              <span
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider"
                style={{
                  backgroundColor: `${statusColors[invoice.status]}15`,
                  color: statusColors[invoice.status],
                }}
              >
                <span
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: statusColors[invoice.status] }}
                />
                {statusLabel}
              </span>
            </div>

            {/* ─── Notes ─── */}
            {invoice.notes && !hasLineItems && (
              <div className="border-t border-gray-100 pt-6 mb-6">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">
                  {t.notes}
                </p>
                <p className="text-gray-500 text-sm leading-relaxed whitespace-pre-wrap">
                  {invoice.notes}
                </p>
              </div>
            )}

            {/* ─── Footer ─── */}
            <div className="border-t border-gray-200 pt-6 mt-8">
              <p className="text-center text-gray-400 text-sm">{t.thankYou}</p>
              <div className="flex justify-between items-center mt-4 text-xs text-gray-300">
                <span>{profile.full_name}</span>
                <span>{profile.email}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
