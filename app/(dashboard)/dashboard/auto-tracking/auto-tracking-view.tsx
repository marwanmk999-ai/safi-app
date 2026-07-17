"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { buildShortcutPlist } from "@/lib/shortcut"
import { Zap, Copy, Check, Trash2, Plus, KeyRound, ShieldCheck, Loader2, AlertTriangle, ChevronDown, Download } from "lucide-react"

interface DeviceToken {
  id: string
  label: string | null
  created_at: string
  last_used_at: string | null
}

// توليد توكن عشوائي + بصمته (نفس خوارزمية الـEdge Function: sha256 hex)
function genToken(): string {
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  let bin = ""
  for (const b of bytes) bin += String.fromCharCode(b)
  const b64 = btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
  return `safi_${b64}`
}
async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("")
}

export function AutoTrackingView({
  userId, endpoint, initialTokens,
}: { userId: string; endpoint: string; initialTokens: DeviceToken[] }) {
  const { locale, dir } = useI18n()
  const ar = locale === "ar"
  const router = useRouter()
  const supabase = createClient()

  const [tokens, setTokens] = useState<DeviceToken[]>(initialTokens)
  const [freshToken, setFreshToken] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [showSteps, setShowSteps] = useState(false)

  const s = ar ? {
    title: "التسجيل التلقائي",
    lead: "فعِّلها مرة… وانسَ التسجيل للأبد. يلتقط صافي إشعارات الخصم من بنكك عبر اختصار آيفون، فيسجّل كل مصروف ويصنّفه تلقائيًا.",
    privacy: "خصوصيتك أولًا: الفلترة تتم على جهازك، والنص غير المالي لا يغادر التلفون إطلاقًا.",
    endpointLabel: "رابط الاستقبال (Endpoint)",
    genBtn: "أنشئ توكن جهاز جديد",
    generating: "جارٍ الإنشاء…",
    freshTitle: "توكنك الجديد",
    freshWarn: "لن يظهر مرة ثانية. الأسهل: نزّل الاختصار الجاهز (فيه التوكن مدفون) بدل نسخه يدويًا.",
    copy: "نسخ",
    copied: "تم النسخ ✓",
    dlBtn: "نزّل الاختصار الجاهز",
    dlHint: "ملف .shortcut فيه الرابط وتوكنك جاهزَين. افتحه على الآيفون → يُستورَد في تطبيق الاختصارات مباشرة.",
    active: "التوكنات الفعّالة",
    none: "لا توكنات بعد — أنشئ واحدًا للبدء.",
    created: "أُنشئ",
    lastUsed: "آخر استخدام",
    never: "لم يُستخدم بعد",
    revoke: "إلغاء",
    stepsTitle: "بعد تنزيل الاختصار — خطوتان فقط",
    steps: [
      "افتح الملف المُنزَّل → «إضافة اختصار» (لو ظهر تحذير: الإعدادات ← الاختصارات ← فعّل Allow Untrusted Shortcuts، ثم أعد الاستيراد).",
      "جرّبه: افتح الاختصار «Safi Auto-Track»، شغّله، والصق رسالة بنك في المدخل — يجب أن يظهر إشعار «✓ سجلنالك…».",
      "الأتمتة: الاختصارات ← Automation ← + ← Message ← Sender contains: اسم بنكك (مثل QNB) ← Run Immediately ✓",
      "في الأتمتة اختر إجراء «Run Shortcut» ← Safi Auto-Track ← Done. خلص!",
    ],
    tip: "خطوة الأتمتة (عند وصول رسالة) لازم تُعمَل بيدك — Apple تمنع أي تطبيق من تركيبها تلقائيًا. لكنها ~4 نقرات بلا أي إعداد.",
    keyNote: "ملاحظة: مفتاح Anthropic مضبوط بالفعل. لو ظهر «خطأ بالمحرك» تأكد من ضبطه في أسرار دوال Supabase.",
  } : {
    title: "Auto-Tracking",
    lead: "Set it up once, never log an expense again. Safi picks up your bank's debit alerts via an iPhone Shortcut, then logs and categorizes every expense automatically.",
    privacy: "Privacy first: filtering happens on your device — non-financial text never leaves your phone.",
    endpointLabel: "Endpoint URL",
    genBtn: "Generate new device token",
    generating: "Generating…",
    freshTitle: "Your new token",
    freshWarn: "It won't be shown again. Easiest path: download the ready-made Shortcut (token baked in) instead of copying by hand.",
    copy: "Copy",
    copied: "Copied ✓",
    dlBtn: "Download ready-made Shortcut",
    dlHint: "A .shortcut file with your URL + token already inside. Open it on your iPhone → it imports straight into the Shortcuts app.",
    active: "Active tokens",
    none: "No tokens yet — generate one to start.",
    created: "Created",
    lastUsed: "Last used",
    never: "Never used",
    revoke: "Revoke",
    stepsTitle: "After downloading the Shortcut — just two things",
    steps: [
      "Open the downloaded file → 'Add Shortcut' (if warned: Settings → Shortcuts → enable Allow Untrusted Shortcuts, then re-import).",
      "Test it: open the 'Safi Auto-Track' shortcut, run it, paste a bank message as input — you should get a '✓ سجلنالك…' notification.",
      "Automation: Shortcuts → Automation → + → Message → Sender contains: your bank (e.g. QNB) → Run Immediately ✓",
      "In the automation pick 'Run Shortcut' → Safi Auto-Track → Done. That's it!",
    ],
    tip: "The message-received automation must be created by you — Apple blocks any app from installing it automatically. But it's ~4 taps with zero config.",
    keyNote: "Note: the Anthropic key is already set. If you see an engine error, double-check it in Supabase Edge Function secrets.",
  }

  async function copy(text: string, id: string) {
    try { await navigator.clipboard.writeText(text); setCopied(id); setTimeout(() => setCopied(null), 1800) } catch {}
  }

  function downloadShortcut(rawToken: string) {
    const plist = buildShortcutPlist(endpoint, rawToken)
    const blob = new Blob([plist], { type: "application/octet-stream" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "Safi Auto-Track.shortcut"
    document.body.appendChild(a)
    a.click()
    setTimeout(() => { URL.revokeObjectURL(url); a.remove() }, 1500)
  }

  async function generate() {
    setBusy(true); setErr(null); setFreshToken(null)
    try {
      const raw = genToken()
      const hash = await sha256Hex(raw)
      const label = new Date().toLocaleDateString(ar ? "ar" : "en-GB", { day: "2-digit", month: "short", year: "numeric" })
      const { data, error } = await supabase
        .from("device_tokens")
        .insert({ user_id: userId, token_hash: hash, label })
        .select("id, label, created_at, last_used_at")
        .single()
      if (error) throw error
      setFreshToken(raw)
      setTokens((prev) => [data as DeviceToken, ...prev])
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally { setBusy(false) }
  }

  async function revoke(id: string) {
    const prev = tokens
    setTokens((t) => t.filter((x) => x.id !== id))
    const { error } = await supabase.from("device_tokens").update({ revoked_at: new Date().toISOString() }).eq("id", id)
    if (error) { setTokens(prev); setErr(error.message) }
    router.refresh()
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-4 sm:p-6" dir={dir}>
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <Zap className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{s.title}</h1>
        </div>
      </div>

      <p className="text-muted-foreground leading-relaxed">{s.lead}</p>
      <p className="text-sm text-muted-foreground flex items-start gap-2">
        <ShieldCheck className="h-4 w-4 mt-0.5 flex-shrink-0 text-emerald-500" />
        <span>{s.privacy}</span>
      </p>

      {/* Endpoint */}
      <div className="rounded-xl border bg-card p-4 space-y-2">
        <div className="text-xs font-medium text-muted-foreground">{s.endpointLabel}</div>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs sm:text-sm bg-muted rounded-lg px-3 py-2 overflow-x-auto whitespace-nowrap" dir="ltr">{endpoint}</code>
          <Button variant="outline" size="sm" onClick={() => copy(endpoint, "ep")}>
            {copied === "ep" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Generate */}
      <Button onClick={generate} disabled={busy} className="w-full h-12 text-base">
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
        <span className="ms-2">{busy ? s.generating : s.genBtn}</span>
      </Button>

      {err && (
        <div className="flex items-center gap-2 text-sm text-red-500 bg-red-500/10 rounded-lg px-3 py-2">
          <AlertTriangle className="h-4 w-4" /> <span dir="ltr">{err}</span>
        </div>
      )}

      {/* Fresh token — shown once */}
      {freshToken && (
        <div className="rounded-xl border-2 border-primary/40 bg-primary/5 p-4 space-y-3">
          <div className="flex items-center gap-2 font-semibold text-primary">
            <KeyRound className="h-5 w-5" /> {s.freshTitle}
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm bg-background rounded-lg px-3 py-2.5 overflow-x-auto whitespace-nowrap font-mono" dir="ltr">{freshToken}</code>
            <Button size="sm" onClick={() => copy(freshToken, "fresh")}>
              {copied === "fresh" ? <><Check className="h-4 w-4" /> <span className="ms-1">{s.copied}</span></> : <><Copy className="h-4 w-4" /> <span className="ms-1">{s.copy}</span></>}
            </Button>
          </div>
          <p className="text-xs text-amber-600 dark:text-amber-500 flex items-start gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" /> <span>{s.freshWarn}</span>
          </p>
          <div className="pt-1 border-t border-primary/20 space-y-2">
            <Button onClick={() => downloadShortcut(freshToken)} className="w-full h-11">
              <Download className="h-5 w-5" /> <span className="ms-2">{s.dlBtn}</span>
            </Button>
            <p className="text-xs text-muted-foreground">{s.dlHint}</p>
          </div>
        </div>
      )}

      {/* Active tokens */}
      <div className="space-y-2">
        <div className="text-sm font-medium">{s.active}</div>
        {tokens.length === 0 ? (
          <p className="text-sm text-muted-foreground">{s.none}</p>
        ) : (
          <div className="space-y-2">
            {tokens.map((tk) => (
              <div key={tk.id} className="flex items-center justify-between rounded-xl border bg-card px-4 py-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">{tk.label ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">
                    {s.lastUsed}: {tk.last_used_at ? new Date(tk.last_used_at).toLocaleString(ar ? "ar" : "en-GB") : s.never}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => revoke(tk.id)} className="text-red-500 hover:text-red-600 hover:bg-red-500/10">
                  <Trash2 className="h-4 w-4" /> <span className="ms-1">{s.revoke}</span>
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Shortcut steps */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <button onClick={() => setShowSteps((v) => !v)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium">
          <span>{s.stepsTitle}</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${showSteps ? "rotate-180" : ""}`} />
        </button>
        {showSteps && (
          <div className="px-4 pb-4 space-y-3 border-t pt-3">
            <ol className="space-y-2.5">
              {s.steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{i + 1}</span>
                  <span className="leading-relaxed text-muted-foreground">{step}</span>
                </li>
              ))}
            </ol>
            <p className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">{s.tip}</p>
            <p className="text-xs text-amber-600 dark:text-amber-500">{s.keyNote}</p>
          </div>
        )}
      </div>
    </div>
  )
}
