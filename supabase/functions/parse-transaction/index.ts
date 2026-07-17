// صافي — Edge Function للتسجيل التلقائي (§4.1 من الخطة التقنية)
// يستقبل رسالة بنك من iOS Shortcut، يحلّلها، ويكتبها في expenses/income.
// المصادقة: توكن جهاز ضيّق الصلاحية (لا JWT الجلسة) — لذلك verify_jwt=false
// والدالة تنفّذ مصادقتها بنفسها. النص غير المالي لا يغادر إلى الموديل إطلاقًا.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? ""
const SB_URL = Deno.env.get("SUPABASE_URL")!
const SB_SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const MODEL = "claude-haiku-4-5"
const CONFIDENCE_GATE = 0.8

// ── §4.1 Normalize: أرقام هندية/فارسية → لاتينية، تشكيل، فواصل عربية ──
const AR_DIGITS: Record<string, string> = {
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4", "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
  "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4", "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
  "٫": ".", "٬": ",",
}
const normalize = (s: string): string =>
  s.replace(/[٠-٩۰-۹٫٬]/g, (c) => AR_DIGITS[c] ?? c)
    .replace(/[ً-ٰٟ]/g, "")
    .replace(/ـ/g, "")
    .replace(/\s+/g, " ")
    .trim()

// ── فحص رخيص: هل يشبه معاملة؟ (النص غير المالي لا يغادر الجهاز) ──
// تصحيح ثغرة الـspec: حدود حروف حقيقية كي لا يطابق رمز عملة داخل كلمة («موعـدك»).
const MONEY_WORDS = /(خصم|شراء|سحب|حوالة|تحويل|دفع|مشتريات|بطاقة|رصيدك|POS|debit|purchase|payment|transfer|withdraw)/iu
const CURRENCY_CODES = /\b(QAR|SAR|JOD|AED|EGP|KWD|BHD|OMR|USD|EUR)\b/iu
const CURRENCY_AR = /(?<!\p{L})(?:ر\.?\s?ق|ر\.?\s?س|ر\.?\s?ع|د\.?\s?أ|د\.?\s?إ|د\.?\s?ك|د\.?\s?ب|ج\.?\s?م)(?!\p{L})/u
const looksFinancial = (t: string): boolean =>
  /\d/.test(t) && (MONEY_WORDS.test(t) || CURRENCY_CODES.test(t) || CURRENCY_AR.test(t))

// ── رفض OTP فورًا، قبل أي نداء للموديل (3-D Secure فخّ) ──
const isOtp = (t: string): boolean =>
  /\b(otp)\b|one[-\s]?time\s*(password|code|pin)|verification\s*code|security\s*code|do\s*not\s*share|رمز\s*(التحقق|التأكيد|الأمان|الدخول|السري|المرور|لمرة)|كود\s*(التحقق|التأكيد)|كلمة\s*(المرور|السر)|لا\s*(تشارك|تفصح|تعطي)/iu.test(t)

const SYSTEM_PROMPT = `أنت محلل رسائل بنكية. أعد JSON فقط بلا أي نص آخر، بالمخطط:
{"is_transaction":bool,"amount":number,"currency":"ISO4217","merchant":string,
"type":"expense"|"income","category":string,"occurred_at":string|null,"confidence":number}
التصنيفات المسموحة: طعام، مواصلات، اشتراكات، أدوات عمل، فواتير، تسوق، صحة، ترفيه، سكن، أخرى.
رسالة OTP أو إعلان أو استعلام رصيد => {"is_transaction":false}.
كن متحفظًا بالثقة: إن لم يتضح المبلغ أو العملة بيقين، أنزل confidence تحت 0.8.`

function extractJson(raw: string): any {
  const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim()
  try { return JSON.parse(cleaned) } catch {
    const m = cleaned.match(/\{[\s\S]*\}/)
    if (m) return JSON.parse(m[0])
    throw new Error("invalid_json")
  }
}

async function haikuParse(text: string): Promise<any> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: MODEL, max_tokens: 300, system: SYSTEM_PROMPT, messages: [{ role: "user", content: text }] }),
  })
  if (!res.ok) throw new Error(`anthropic_${res.status}`)
  const data = await res.json()
  return extractJson(data.content?.[0]?.text ?? "")
}

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("")
}

const fmtHead = (amount: number, currency: string, merchant: string, category?: string) =>
  `${amount.toFixed(2)} ${currency} — ${merchant}${category ? ` (${category})` : ""}`

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8" } })

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ ok: false, message: "method not allowed" }, 405)

  // ── مصادقة: توكن الجهاز من Authorization: Bearer أو x-safi-token ──
  const auth = req.headers.get("authorization") ?? ""
  const token = (auth.toLowerCase().startsWith("bearer ") ? auth.slice(7) : req.headers.get("x-safi-token") ?? "").trim()
  if (!token) return json({ ok: false, message: "✗ توكن مفقود" }, 401)

  const sb = createClient(SB_URL, SB_SERVICE, { auth: { persistSession: false } })
  const tokenHash = await sha256Hex(token)
  const { data: dt } = await sb
    .from("device_tokens")
    .select("id, user_id")
    .eq("token_hash", tokenHash)
    .is("revoked_at", null)
    .maybeSingle()
  if (!dt) return json({ ok: false, message: "✗ توكن غير صالح" }, 401)
  const userId = dt.user_id
  // fire-and-forget: آخر استخدام
  sb.from("device_tokens").update({ last_used_at: new Date().toISOString() }).eq("id", dt.id).then(() => {})

  // ── المدخلات ──
  let body: any
  try { body = await req.json() } catch { return json({ ok: false, message: "⚠️ جسم الطلب غير صالح" }, 400) }
  const rawText: string = typeof body?.rawText === "string" ? body.rawText : ""
  const source: string = typeof body?.source === "string" && body.source.trim() ? body.source.trim() : "ios_shortcut"
  if (!rawText.trim()) return json({ ok: false, message: "✗ نص فارغ", reason: "empty" })
  if (rawText.length > 1200) return json({ ok: false, message: "✗ نص طويل جدًا", reason: "too_long" })

  // ── الأنبوب ──
  const text = normalize(rawText)
  if (!looksFinancial(text)) return json({ ok: false, message: "✗ مش معاملة", reason: "not_financial" })
  if (isOtp(text)) return json({ ok: false, message: "✗ مش معاملة", reason: "otp" })

  let parsed: any
  try { parsed = await haikuParse(text) } catch (e) {
    const msg = String((e as Error).message)
    if (msg === "invalid_json") return json({ ok: false, message: "⚠️ رد غير صالح من الموديل", reason: "invalid_json" }, 502)
    return json({ ok: false, message: `⚠️ خطأ بالمحرك (${msg})`, reason: "api_error" }, 502)
  }

  const amount = typeof parsed?.amount === "number" ? parsed.amount : Number(parsed?.amount)
  const currency = typeof parsed?.currency === "string" ? parsed.currency.trim().toUpperCase() : ""
  if (parsed?.is_transaction !== true || !Number.isFinite(amount) || !(amount > 0) || !/^[A-Z]{3}$/.test(currency))
    return json({ ok: false, message: "✗ مش معاملة", reason: "not_transaction" })

  const rawConf = typeof parsed?.confidence === "number" ? parsed.confidence : Number(parsed?.confidence)
  const confidence = Number.isFinite(rawConf) ? Math.min(Math.max(rawConf, 0), 1) : 0
  const merchant = typeof parsed?.merchant === "string" && parsed.merchant.trim() ? parsed.merchant.trim() : "غير محدد"
  const category = typeof parsed?.category === "string" && parsed.category.trim() ? parsed.category.trim() : "أخرى"
  const type: "expense" | "income" = parsed?.type === "income" ? "income" : "expense"
  const occurred = typeof parsed?.occurred_at === "string" && /^\d{4}-\d{2}-\d{2}/.test(parsed.occurred_at)
    ? parsed.occurred_at.slice(0, 10) : new Date().toISOString().slice(0, 10)
  const status = confidence >= CONFIDENCE_GATE ? "confirmed" : "pending_review"

  // ── دخل → جدول income (بلا status؛ الدخل الوارد أبسط) ──
  if (type === "income") {
    const { error } = await sb.from("income").insert({
      user_id: userId, amount, currency, description: merchant, date: occurred,
    })
    if (error) return json({ ok: false, message: "⚠️ فشل الحفظ", reason: "db_error", detail: error.message }, 500)
    return json({ ok: true, message: `✓ سجلنالك دخل: ${fmtHead(amount, currency, merchant)}`, status: "confirmed", type })
  }

  // ── dedup: نفس المبلغ/العملة خلال 10 دقائق (SMS + إشعار تطبيق لنفس الخصم) ──
  const since = new Date(Date.now() - 10 * 60_000).toISOString()
  const { data: dup } = await sb.from("expenses").select("id").eq("user_id", userId)
    .eq("amount", amount).eq("currency", currency).gte("created_at", since).limit(1)
  if (dup && dup.length) return json({ ok: true, message: `↺ مكرّرة، تجاهلناها: ${fmtHead(amount, currency, merchant)}`, status: "deduped", type })

  // ── مصروف → جدول expenses (نص عادي؛ الـtrigger يشفّر description/merchant) ──
  const { error } = await sb.from("expenses").insert({
    user_id: userId, amount, currency, description: merchant, category, merchant,
    source, raw_sms: rawText.slice(0, 1000), confidence, status, date: occurred,
  })
  if (error) return json({ ok: false, message: "⚠️ فشل الحفظ", reason: "db_error", detail: error.message }, 500)

  const head = fmtHead(amount, currency, merchant, category)
  return json({
    ok: true,
    status,
    type,
    message: status === "confirmed"
      ? `✓ سجلنالك: ${head}`
      : `⏸ بحاجة تأكيد: ${head} · ثقة ${Math.round(confidence * 100)}%`,
  })
})
