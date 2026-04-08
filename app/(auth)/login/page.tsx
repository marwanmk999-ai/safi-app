"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import { Mail, Lock, Shield } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const { t, locale, setLocale, dir } = useI18n()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      const msg = error.message.toLowerCase()
      if (msg.includes("invalid") || msg.includes("credentials")) {
        setError(t.invalidCredentials)
      } else if (msg.includes("rate limit")) {
        setError(t.rateLimited)
      } else if (msg.includes("not confirmed")) {
        setError(t.notConfirmed)
      } else {
        setError(t.genericError + ": " + error.message)
      }
      setLoading(false)
      return
    }

    if (data.session) {
      window.location.href = "/dashboard"
    }
  }

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) setError(t.googleError)
  }

  return (
    <div dir={dir} className="flex flex-col items-center gap-8 safi-page-enter">
      {/* Language toggle — top-right pill */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
          className="rounded-full px-4 py-1.5 border border-white/10 text-xs text-[#64748b] hover:text-[#94a3b8] hover:border-white/20 bg-white/[0.03] backdrop-blur-sm transition-all duration-300"
        >
          {t.toggleLang}
        </button>
      </div>

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

        <h1 className="text-2xl font-bold text-[#e2e8f0] text-center mb-2">
          {t.login}
        </h1>
        <p className="text-[#64748b] text-center text-sm mb-8">
          {t.loginDesc}
        </p>

        <form onSubmit={handleLogin} className="flex flex-col gap-4 safi-stagger">
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

          {/* Password input */}
          <div className="relative">
            <Lock className="absolute top-1/2 -translate-y-1/2 start-4 w-[18px] h-[18px] text-[#475569] pointer-events-none" />
            <input
              type="password"
              placeholder={t.password}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            {loading ? "..." : t.login}
          </button>

          <div className="flex items-center justify-center">
            <Link
              href="/forgot-password"
              className="text-sm text-[#64748b] hover:text-[#94a3b8] transition-colors"
            >
              {t.forgotPassword}
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-sm text-[#64748b]">{t.or}</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full h-[3.25rem] rounded-[14px] border border-white/10 bg-white/[0.04] text-[#e2e8f0] font-medium hover:bg-white/[0.07] hover:border-white/20 hover:shadow-[0_0_20px_-6px_rgba(255,255,255,0.06)] transition-all duration-300 flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {t.loginWithGoogle}
          </button>
        </form>
      </div>

      <p className="text-sm text-[#64748b]">
        {t.noAccount}{" "}
        <Link href="/signup" className="text-[#3b82f6] hover:text-[#2563eb] font-medium transition-colors">
          {t.signupNow}
        </Link>
      </p>

      <div className="text-xs text-[#475569] text-center max-w-xs flex items-center justify-center gap-1.5">
        <Shield className="w-3.5 h-3.5 text-[#3b82f6]/40 shrink-0" />
        <span>
          {t.privacyNote}
          {" — "}
          <Link href="/privacy" className="text-[#3b82f6]/70 hover:text-[#3b82f6] transition-colors">
            {t.privacyPolicy}
          </Link>
          {" | "}
          <Link href="/terms" className="text-[#3b82f6]/70 hover:text-[#3b82f6] transition-colors">
            {t.termsOfService}
          </Link>
        </span>
      </div>
    </div>
  )
}
