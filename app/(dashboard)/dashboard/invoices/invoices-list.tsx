"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, FileText, Calendar, User } from "lucide-react"
import type { Invoice, Client } from "@/lib/types/database"
import { CreateInvoiceDialog } from "./create-invoice-dialog"
import { convertAndFormat } from "@/lib/format"
import { useI18n } from "@/lib/i18n/context"
import type { Locale } from "@/lib/i18n/translations"

type StatusFilter = "all" | Invoice["status"]

interface InvoicesListProps {
  invoices: (Invoice & { client: Client | null })[]
  clients: Client[]
  userCurrency: string
  locale?: Locale
}

export function InvoicesList({ invoices, clients, userCurrency, locale: serverLocale }: InvoicesListProps) {
  const { t, locale: clientLocale } = useI18n()
  const locale = serverLocale ?? clientLocale
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("all")
  const [dialogOpen, setDialogOpen] = useState(false)

  const statusConfig: Record<
    Invoice["status"],
    { label: string; className: string }
  > = {
    draft: {
      label: t.draft,
      className: "bg-[#64748b]/10 text-[#64748b] border-[#64748b]/20",
    },
    pending: {
      label: t.pending,
      className: "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20",
    },
    paid: {
      label: t.paid,
      className: "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20",
    },
    overdue: {
      label: t.overdue,
      className: "bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20",
    },
    cancelled: {
      label: t.cancelled,
      className: "bg-[#6b7280]/10 text-[#6b7280] border-[#6b7280]/20",
    },
  }

  const filterTabs: { key: StatusFilter; label: string }[] = [
    { key: "all", label: t.all },
    { key: "pending", label: t.pending },
    { key: "paid", label: t.paid },
    { key: "overdue", label: t.overdue },
    { key: "draft", label: t.draft },
  ]

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "—"
    return new Date(dateStr).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const filtered =
    activeFilter === "all"
      ? invoices
      : invoices.filter((inv) => inv.status === activeFilter)

  return (
    <div className="space-y-4">
      {/* Top bar: filters + create button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Filter tabs */}
        <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.08] rounded-xl p-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                activeFilter === tab.key
                  ? "bg-white/[0.08] text-[#e2e8f0]"
                  : "text-[#64748b] hover:text-[#94a3b8]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-[#3b82f6] hover:bg-[#3b82f6]/90 text-white rounded-xl px-4 h-10"
        >
          <Plus className="size-4 ml-1.5" />
          {t.createInvoiceBtn}
        </Button>
      </div>

      {/* Invoice cards */}
      {filtered.length === 0 ? (
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-[20px] p-12 backdrop-blur-sm text-center">
          <div className="mx-auto size-16 rounded-2xl bg-[#3b82f6]/10 text-[#3b82f6] flex items-center justify-center mb-4">
            <FileText className="size-7" />
          </div>
          <h3 className="text-lg font-semibold text-[#e2e8f0] mb-2">
            {t.noInvoicesTitle}
          </h3>
          <p className="text-[#64748b] text-sm mb-6">
            {t.createFirstInvoice}
          </p>
          <Button
            onClick={() => setDialogOpen(true)}
            className="bg-[#3b82f6] hover:bg-[#3b82f6]/90 text-white rounded-xl px-6 h-10"
          >
            <Plus className="size-4 ml-1.5" />
            {t.createInvoiceBtn}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((invoice) => {
            const status = statusConfig[invoice.status]
            return (
              <Link
                key={invoice.id}
                href={`/dashboard/invoices/${invoice.id}`}
                className="block bg-white/[0.04] border border-white/[0.08] rounded-[20px] p-5 backdrop-blur-sm hover:bg-white/[0.06] transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Right side: info */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-[#e2e8f0] font-semibold text-base">
                        {invoice.invoice_number}
                      </span>
                      <Badge
                        variant="outline"
                        className={`border text-xs ${status.className}`}
                      >
                        {status.label}
                      </Badge>
                    </div>

                    {invoice.description && (
                      <p className="text-[#94a3b8] text-sm line-clamp-1">
                        {invoice.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-[#64748b]">
                      {invoice.client?.name && (
                        <span className="flex items-center gap-1">
                          <User className="size-3" />
                          {invoice.client.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3" />
                        {formatDate(invoice.issue_date)}
                      </span>
                      {invoice.due_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          {t.dueDateLabel} {formatDate(invoice.due_date)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Left side: amount */}
                  <div className="text-left sm:text-left">
                    <p className="text-xl font-bold text-[#e2e8f0]">
                      {convertAndFormat(Number(invoice.amount), invoice.currency, userCurrency)}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      <CreateInvoiceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        clients={clients}
      />
    </div>
  )
}
