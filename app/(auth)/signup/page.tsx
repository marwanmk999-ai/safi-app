"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

export default function SignupPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const supabase = createClient()
  const { t, locale, setLocale, dir } = useI18n()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    })

    if (error) {
      const msg = error.message.toLowerCase()
      if (msg.includes("already registered")) {
        setError(t.alreadyRegistered)
      } else if (msg.includes("rate limit")) {
        setError(t.rateLimited)
      } else {
        setError(t.genericError + ": " + error.message)
      }
      setLoading(false)
      return
    }

    // If session exists, user is auto-confirmed — go to dashboard
    if (data.session) {
      window.location.href = "/dashboard"
      return
    }

    // Otherwise need email confirmation
    setSuccess(true)
    setLoading(false)
  }

  const handleGoogleSignup = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) setError(t.googleError)
  }

  if (success) {
    return (
      <div dir={dir} className="flex flex-col items-center gap-6">
        <img src={dir === "rtl" ? "/Logo AR.png" : "/Logo EN.png"} alt="Safi" className="h-[34px] brightness-0 invert" />
        <div className="w-full bg-white/[0.04] border border-white/[0.08] rounded-[20px] p-8 backdrop-blur-sm text-center">
          <CheckCircle2 className="w-16 h-16 text-[#10b981] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#e2e8f0] mb-3">{t.accountCreated}</h2>
          <p className="text-[#94a3b8] mb-6">{t.checkEmail}</p>
          <Link
            href="/login"
            className="text-[#3b82f6] hover:text-[#2563eb] font-medium"
          >
            {t.backToLogin}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div dir={dir} className="flex flex-col items-center gap-8">
      <img src={dir === "rtl" ? "/Logo AR.png" : "/Logo EN.png"} alt="Safi" className="h-[34px] brightness-0 invert" />

      <div className="w-full bg-white/[0.04] border border-white/[0.08] rounded-[20px] p-8 backdrop-blur-sm">
        <div className="flex justify-end mb-4">
          <button onClick={() => setLocale(locale === "ar" ? "en" : "ar")} className="text-sm text-[#64748b] hover:text-[#94a3b8]">
            {t.toggleLang}
          </button>
        </div>
        <h1 className="text-2xl font-bold text-[#e2e8f0] text-center mb-2">
          {t.signup}
        </h1>
        <p className="text-[#64748b] text-center text-sm mb-8">
          {t.signupDesc}
        </p>

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder={t.fullName}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="h-14 text-base rounded-2xl border border-white/10 bg-white/5 px-4 text-white placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
          <input
            type="email"
            placeholder={t.email}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-14 text-base rounded-2xl border border-white/10 bg-white/5 px-4 text-white placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
          <input
            type="password"
            placeholder={t.password}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="h-14 text-base rounded-2xl border border-white/10 bg-white/5 px-4 text-white placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />

          {/* Terms checkbox */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-1 size-4 rounded border-white/20 bg-white/5 text-[#3b82f6] focus:ring-[#3b82f6]/50 accent-[#3b82f6] shrink-0"
            />
            <span className="text-xs text-[#94a3b8] leading-relaxed">
              {t.agreeToTerms}{" "}
              <Link href="/terms" className="text-[#3b82f6] hover:text-[#60a5fa] underline underline-offset-2">
                {t.termsOfService}
              </Link>{" "}
              {t.and}{" "}
              <Link href="/privacy" className="text-[#3b82f6] hover:text-[#60a5fa] underline underline-offset-2">
                {t.privacyPolicy}
              </Link>
            </span>
          </label>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !agreedToTerms}
            className="h-14 rounded-2xl font-bold text-lg bg-[#3b82f6] text-white hover:bg-[#2563eb] transition-all shadow-[0_0_40px_rgba(59,130,246,0.4)] hover:shadow-[0_0_60px_rgba(59,130,246,0.6)] disabled:opacity-60"
          >
            {loading ? "..." : t.signup}
          </button>
        </form>

        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-sm text-[#64748b]">{t.or}</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <button
          type="button"
          onClick={handleGoogleSignup}
          className="w-full h-14 rounded-2xl border border-white/10 bg-white/5 text-[#e2e8f0] font-medium hover:bg-white/[0.08] transition-all flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {t.signupWithGoogle}
        </button>
      </div>

      <p className="text-sm text-[#64748b]">
        {t.hasAccount}{" "}
        <Link href="/login" className="text-[#3b82f6] hover:text-[#2563eb] font-medium">
          {t.loginNow}
        </Link>
      </p>

      <p className="text-xs text-[#475569] text-center max-w-xs">
        {t.privacyNote}
      </p>
    </div>
  )
}
