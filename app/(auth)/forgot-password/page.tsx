"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import { Mail, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const supabase = createClient()
  const { t, locale, dir } = useI18n()

  const BackArrow = dir === "rtl" ? ArrowLeft : ArrowRight

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    })

    if (error) {
      setError(t.genericError + ": " + error.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  const title = locale === "ar" ? "نسيت كلمة المرور" : "Forgot Password"
  const subtitle = locale === "ar"
    ? "أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين"
    : "Enter your email and we'll send you a reset link"
  const successMessage = locale === "ar"
    ? "تم إرسال رابط إعادة تعيين كلمة المرور"
    : "Password reset link has been sent"
  const checkEmailMessage = locale === "ar"
    ? "تحقق من بريدك الإلكتروني واتبع الرابط لإعادة تعيين كلمة المرور"
    : "Check your email and follow the link to reset your password"
  const sendLabel = locale === "ar" ? "إرسال الرابط" : "Send Reset Link"

  return (
    <div dir={dir} className="flex flex-col items-center gap-8 safi-page-enter">
      {/* Logo with ambient glow */}
      <div className="relative flex items-center justify-center">
        <div
          className="absolute w-24 h-24 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(59,130,246,0.10) 0%, transparent 70%)",
            filter: "blur(16px)",
          }}
        />
        <img
          src={dir === "rtl" ? "/Logo AR.png" : "/Logo EN.png"}
          alt="Safi"
          className="relative h-[34px] brightness-0 invert"
        />
      </div>

      {/* Main card */}
      <div className="w-full safi-card p-10 relative overflow-hidden">
        {/* Top gradient accent line */}
        <div
          className="absolute top-0 left-6 right-6 h-px"
          style={{
            background: "linear-gradient(90deg, transparent, #3b82f6, transparent)",
            opacity: 0.5,
          }}
        />

        {sent ? (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="size-14 rounded-full bg-[#10b981]/10 flex items-center justify-center">
                <CheckCircle className="size-7 text-[#10b981]" />
              </div>
            </div>
            <h1 className="text-xl font-bold text-[#e2e8f0]">{successMessage}</h1>
            <p className="text-[#64748b] text-sm">{checkEmailMessage}</p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm text-[#3b82f6] hover:text-[#2563eb] font-medium transition-colors mt-4"
            >
              <BackArrow className="size-4" />
              {t.backToLogin}
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-[#e2e8f0] text-center mb-2">
              {title}
            </h1>
            <p className="text-[#64748b] text-center text-sm mb-8">
              {subtitle}
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Email input */}
              <div className="relative">
                <Mail className="absolute top-1/2 -translate-y-1/2 start-4 w-[18px] h-[18px] text-[#475569] pointer-events-none" />
                <input
                  type="email"
                  placeholder={t.email}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="safi-input w-full ps-11"
                />
              </div>

              {error && (
                <p className="text-red-400 text-sm text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="safi-btn-primary w-full"
              >
                {loading ? "..." : sendLabel}
              </button>

              <div className="flex items-center justify-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm text-[#64748b] hover:text-[#94a3b8] transition-colors"
                >
                  <BackArrow className="size-4" />
                  {t.backToLogin}
                </Link>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
