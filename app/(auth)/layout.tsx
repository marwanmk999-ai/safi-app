export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#070b14] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Geometric arabesque pattern */}
      <div className="absolute inset-0 safi-pattern" />

      {/* Ambient gradient orb — blue, top-right */}
      <div
        className="pointer-events-none absolute -top-32 -right-32 w-[560px] h-[560px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(59,130,246,0.10) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />

      {/* Ambient gradient orb — emerald, bottom-left */}
      <div
        className="pointer-events-none absolute -bottom-40 -left-40 w-[480px] h-[480px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />

      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  )
}
