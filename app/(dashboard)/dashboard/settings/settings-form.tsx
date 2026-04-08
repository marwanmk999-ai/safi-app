"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"
import { createClient } from "@/lib/supabase/client"
import type { Profile } from "@/lib/types/database"
import {
  User,
  Settings2,
  Shield,
  AlertTriangle,
  Check,
  Loader2,
  Image as ImageIcon,
  Upload,
  X,
} from "lucide-react"

const CURRENCIES = ["USD", "EUR", "SAR", "AED", "JOD", "EGP", "QAR", "KWD"]

interface SettingsFormProps {
  profile: Profile | null
  userEmail: string
}

export function SettingsForm({ profile, userEmail }: SettingsFormProps) {
  const { t, locale, setLocale, dir } = useI18n()
  const router = useRouter()
  const supabase = createClient()

  // Profile state
  const [fullName, setFullName] = useState(profile?.full_name ?? "")
  const [specialty, setSpecialty] = useState(profile?.specialty ?? "")
  const [businessName, setBusinessName] = useState(profile?.business_name ?? "")
  const [businessLogo, setBusinessLogo] = useState(profile?.business_logo ?? "")
  const [logoUploading, setLogoUploading] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  // Preferences state
  const [currency, setCurrency] = useState(profile?.currency ?? "USD")
  const [prefSaving, setPrefSaving] = useState(false)
  const [prefSaved, setPrefSaved] = useState(false)

  // Password state
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState("")
  const [passwordError, setPasswordError] = useState(false)

  const inputClass =
    "w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-3 text-[#e2e8f0] placeholder:text-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/50 focus:border-[#3b82f6]/50 transition-colors"
  const disabledInputClass =
    "w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-[#64748b] cursor-not-allowed"
  const labelClass = "block text-sm text-[#94a3b8] mb-2"
  const cardClass =
    "bg-white/[0.04] border border-white/[0.08] rounded-[20px] p-6 backdrop-blur-sm"

  async function handleProfileSave() {
    setProfileSaving(true)
    setProfileSaved(false)
    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: profile?.id,
        full_name: fullName,
        specialty,
        business_name: businessName || null,
        business_logo: businessLogo || null,
        updated_at: new Date().toISOString(),
      })
    setProfileSaving(false)
    if (!error) {
      setProfileSaved(true)
      router.refresh()
      setTimeout(() => setProfileSaved(false), 2000)
    }
  }

  async function handlePrefSave() {
    setPrefSaving(true)
    setPrefSaved(false)
    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: profile?.id,
        currency,
        updated_at: new Date().toISOString(),
      })
    setPrefSaving(false)
    if (!error) {
      setPrefSaved(true)
      router.refresh()
      setTimeout(() => setPrefSaved(false), 2000)
    }
  }

  async function handlePasswordChange() {
    setPasswordMessage("")
    setPasswordError(false)

    if (newPassword !== confirmPassword) {
      setPasswordMessage(t.passwordMismatch)
      setPasswordError(true)
      return
    }

    setPasswordSaving(true)
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    setPasswordSaving(false)

    if (error) {
      setPasswordMessage(error.message)
      setPasswordError(true)
    } else {
      setPasswordMessage(t.passwordUpdated)
      setPasswordError(false)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setTimeout(() => setPasswordMessage(""), 3000)
    }
  }

  function SaveButton({
    onClick,
    saving,
    saved,
  }: {
    onClick: () => void
    saving: boolean
    saved: boolean
  }) {
    return (
      <button
        onClick={onClick}
        disabled={saving}
        className="flex items-center gap-2 bg-[#3b82f6] hover:bg-[#3b82f6]/90 disabled:opacity-50 text-white rounded-xl px-6 py-2.5 text-sm font-medium transition-colors"
      >
        {saving ? (
          <Loader2 className="size-4 animate-spin" />
        ) : saved ? (
          <Check className="size-4" />
        ) : null}
        {saved ? t.saved : t.save}
      </button>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl" dir={dir}>
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-bold text-[#e2e8f0]">{t.settings}</h2>
      </div>

      {/* Card 1: Profile Info */}
      <div className={cardClass}>
        <div className="flex items-center gap-3 mb-6">
          <div className="size-10 rounded-xl bg-[#3b82f6]/10 text-[#3b82f6] flex items-center justify-center">
            <User className="size-5" />
          </div>
          <h3 className="text-lg font-semibold text-[#e2e8f0]">
            {t.profileInfo}
          </h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>{t.fullName}</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{t.email}</label>
            <input
              type="email"
              value={userEmail}
              disabled
              className={disabledInputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{t.specialty}</label>
            <input
              type="text"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>
              {t.businessNameLabel}
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder={t.businessNamePlaceholder}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>
              {t.businessLogo}
            </label>
            <p className="text-[10px] text-[#f59e0b] mb-3 flex items-center gap-1">
              ⚠️ {t.pngOnly}
            </p>
            <div className="flex items-center gap-4">
              {businessLogo ? (
                <div className="relative group">
                  <img
                    src={businessLogo}
                    alt="Logo"
                    className="h-16 max-w-[140px] rounded-xl object-contain bg-white p-2 border border-white/[0.08]"
                  />
                  <button
                    type="button"
                    onClick={() => setBusinessLogo("")}
                    className="absolute -top-2 -end-2 size-5 rounded-full bg-[#ef4444] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ) : (
                <div className="h-16 w-[140px] rounded-xl bg-white/[0.04] border border-dashed border-white/[0.12] flex flex-col items-center justify-center text-[#475569] gap-1">
                  <ImageIcon className="size-5" />
                  <span className="text-[9px]">
                    {t.safiLogoWillShow}
                  </span>
                </div>
              )}
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.1] text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-white/[0.04] cursor-pointer transition-all text-sm">
                  <Upload className="size-4" />
                  {logoUploading
                    ? "..."
                    : t.uploadPngLogo}
                  <input
                    type="file"
                    accept=".png,image/png"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      if (!file.type.includes("png")) {
                        alert(t.fileMustBePng)
                        return
                      }
                      setLogoUploading(true)
                      const path = `${profile?.id}/logo.png`
                      const { error } = await supabase.storage
                        .from("logos")
                        .upload(path, file, { upsert: true })
                      if (!error) {
                        const { data } = supabase.storage
                          .from("logos")
                          .getPublicUrl(path)
                        setBusinessLogo(data.publicUrl + "?t=" + Date.now())
                      }
                      setLogoUploading(false)
                    }}
                  />
                </label>
                <span className="text-[10px] text-[#475569]">
                  {t.noLogoHint}
                </span>
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <SaveButton
              onClick={handleProfileSave}
              saving={profileSaving}
              saved={profileSaved}
            />
          </div>
        </div>
      </div>

      {/* Card 2: Preferences */}
      <div className={cardClass}>
        <div className="flex items-center gap-3 mb-6">
          <div className="size-10 rounded-xl bg-[#8b5cf6]/10 text-[#8b5cf6] flex items-center justify-center">
            <Settings2 className="size-5" />
          </div>
          <h3 className="text-lg font-semibold text-[#e2e8f0]">
            {t.preferences}
          </h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>{t.defaultCurrency}</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className={inputClass}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c} className="bg-[#0f172a] text-[#e2e8f0]">
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>{t.language}</label>
            <button
              onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
              className="flex items-center gap-3 bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-3 text-[#e2e8f0] hover:bg-white/[0.1] transition-colors w-full"
            >
              <span className="text-lg">{locale === "ar" ? "🇸🇦" : "🇺🇸"}</span>
              <span>{locale === "ar" ? "العربية" : "English"}</span>
              <span className="ms-auto text-[#64748b] text-sm">
                {t.toggleLang}
              </span>
            </button>
          </div>
          <div className="flex justify-end pt-2">
            <SaveButton
              onClick={handlePrefSave}
              saving={prefSaving}
              saved={prefSaved}
            />
          </div>
        </div>
      </div>

      {/* Card 3: Security */}
      <div className={cardClass}>
        <div className="flex items-center gap-3 mb-6">
          <div className="size-10 rounded-xl bg-[#10b981]/10 text-[#10b981] flex items-center justify-center">
            <Shield className="size-5" />
          </div>
          <h3 className="text-lg font-semibold text-[#e2e8f0]">
            {t.changePassword}
          </h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>{t.currentPassword}</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{t.newPassword}</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{t.confirmPassword}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
            />
          </div>
          {passwordMessage && (
            <p
              className={`text-sm ${
                passwordError ? "text-[#ef4444]" : "text-[#10b981]"
              }`}
            >
              {passwordMessage}
            </p>
          )}
          <div className="flex justify-end pt-2">
            <button
              onClick={handlePasswordChange}
              disabled={passwordSaving || !newPassword || !confirmPassword}
              className="flex items-center gap-2 bg-[#3b82f6] hover:bg-[#3b82f6]/90 disabled:opacity-50 text-white rounded-xl px-6 py-2.5 text-sm font-medium transition-colors"
            >
              {passwordSaving && (
                <Loader2 className="size-4 animate-spin" />
              )}
              {t.changePassword}
            </button>
          </div>
        </div>
      </div>

      {/* Card 4: Danger Zone */}
      <div className="bg-white/[0.04] border border-[#ef4444]/20 rounded-[20px] p-6 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="size-10 rounded-xl bg-[#ef4444]/10 text-[#ef4444] flex items-center justify-center">
            <AlertTriangle className="size-5" />
          </div>
          <h3 className="text-lg font-semibold text-[#ef4444]">
            {t.dangerZone}
          </h3>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#94a3b8]">{t.deleteAccount}</p>
          <button
            disabled
            className="bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20 rounded-xl px-6 py-2.5 text-sm font-medium opacity-50 cursor-not-allowed"
          >
            {t.deleteAccount} — {t.comingSoon}
          </button>
        </div>
      </div>
    </div>
  )
}
