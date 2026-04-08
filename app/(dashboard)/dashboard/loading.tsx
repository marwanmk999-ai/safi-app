export default function DashboardLoading() {
  return (
    <div className="space-y-8" dir="rtl">
      {/* Welcome skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-56 bg-white/[0.06] rounded-lg animate-pulse" />
        <div className="h-5 w-72 bg-white/[0.04] rounded-lg animate-pulse" />
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white/[0.04] border border-white/[0.08] rounded-[20px] p-6 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 w-24 bg-white/[0.06] rounded animate-pulse" />
              <div className="size-10 rounded-xl bg-white/[0.06] animate-pulse" />
            </div>
            <div className="h-8 w-20 bg-white/[0.06] rounded-lg animate-pulse" />
          </div>
        ))}
      </div>

      {/* Empty state skeleton */}
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-[20px] p-12 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          <div className="size-16 rounded-2xl bg-white/[0.06] animate-pulse" />
          <div className="h-6 w-64 bg-white/[0.06] rounded-lg animate-pulse" />
          <div className="h-4 w-80 bg-white/[0.04] rounded-lg animate-pulse" />
          <div className="flex gap-3 mt-2">
            <div className="h-10 w-28 bg-white/[0.06] rounded-xl animate-pulse" />
            <div className="h-10 w-28 bg-white/[0.06] rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
