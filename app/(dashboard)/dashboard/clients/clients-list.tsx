"use client"

import { useState } from "react"
import { useI18n } from "@/lib/i18n/context"
import { Users, Mail, Phone, Building2, Search } from "lucide-react"
import type { Client } from "@/lib/types/database"
import { AddClientDialog } from "./add-client-dialog"

interface Props {
  clients: Client[]
  transactionCounts: Record<string, number>
}

export function ClientsList({ clients, transactionCounts }: Props) {
  const { t, dir } = useI18n()
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email?.toLowerCase().includes(search.toLowerCase())) ||
    (c.company?.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-6" dir={dir}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-[#64748b]" />
          <input
            type="text"
            placeholder={t.searchClients ?? "Search clients..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 rounded-xl border border-white/10 bg-white/5 ps-10 pe-4 text-white placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm"
          />
        </div>
        <button
          onClick={() => setDialogOpen(true)}
          className="h-12 rounded-xl px-6 font-medium bg-[#3b82f6] text-white hover:bg-[#2563eb] transition-all shadow-[0_0_30px_rgba(59,130,246,0.3)] text-sm"
        >
          {t.addClient ?? "Add Client"}
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-[20px] p-12 backdrop-blur-sm text-center">
          <Users className="size-12 text-[#3b82f6] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#e2e8f0] mb-2">
            {t.noClients ?? "No clients yet"}
          </h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((client) => (
            <div
              key={client.id}
              className="bg-white/[0.04] border border-white/[0.08] rounded-[20px] p-6 backdrop-blur-sm hover:bg-white/[0.06] transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-[#3b82f6]/10 text-[#3b82f6] flex items-center justify-center">
                    <Users className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#e2e8f0]">{client.name}</h3>
                    {client.company && (
                      <p className="text-xs text-[#64748b] flex items-center gap-1 mt-0.5">
                        <Building2 className="size-3" />
                        {client.company}
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-xs bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/20 rounded-full px-2.5 py-1">
                  {transactionCounts[client.name] ?? 0} {t.transactions}
                </span>
              </div>

              <div className="space-y-2">
                {client.email && (
                  <div className="flex items-center gap-2 text-sm text-[#94a3b8]">
                    <Mail className="size-3.5 text-[#64748b]" />
                    <span dir="ltr">{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2 text-sm text-[#94a3b8]">
                    <Phone className="size-3.5 text-[#64748b]" />
                    <span dir="ltr">{client.phone}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <AddClientDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
