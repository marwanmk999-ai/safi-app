"use client";

import { useI18n } from "@/lib/i18n/context";
import { formatAmount } from "@/lib/format";

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
}

interface CategoryData {
  name: string;
  amount: number;
  percentage: number;
}

interface ClientData {
  name: string;
  amount: number;
}

interface InvoiceStatus {
  count: number;
  total: number;
}

interface CurrencyBreakdownItem {
  currency: string;
  count: number;
  originalTotal: number;
  convertedTotal: number;
}

interface ReportsViewProps {
  monthlyData: MonthlyData[];
  topCategories: CategoryData[];
  topClients: ClientData[];
  invoiceSummary: Record<string, InvoiceStatus>;
  currencyBreakdown: CurrencyBreakdownItem[];
  currency: string;
}

const currencyFlags: Record<string, string> = {
  USD: "\u{1F1FA}\u{1F1F8}",
  EUR: "\u{1F1EA}\u{1F1FA}",
  SAR: "\u{1F1F8}\u{1F1E6}",
  AED: "\u{1F1E6}\u{1F1EA}",
  JOD: "\u{1F1EF}\u{1F1F4}",
  EGP: "\u{1F1EA}\u{1F1EC}",
  QAR: "\u{1F1F6}\u{1F1E6}",
  KWD: "\u{1F1F0}\u{1F1FC}",
};

const currencyBarColors: Record<string, string> = {
  USD: "#10b981",
  EUR: "#3b82f6",
  SAR: "#8b5cf6",
  AED: "#f59e0b",
  JOD: "#ef4444",
  EGP: "#06b6d4",
  QAR: "#ec4899",
  KWD: "#f97316",
};

const categoryColors: Record<string, string> = {
  // English keys
  food: "#f59e0b",
  transport: "#3b82f6",
  workTools: "#8b5cf6",
  entertainment: "#ec4899",
  subscriptions: "#06b6d4",
  other: "#64748b",
  // Arabic keys (as stored in DB)
  "أكل": "#f59e0b",
  "مواصلات": "#3b82f6",
  "أدوات شغل": "#8b5cf6",
  "ترفيه": "#ec4899",
  "اشتراكات": "#06b6d4",
  "أخرى": "#64748b",
};

export default function ReportsView({
  monthlyData,
  topCategories,
  topClients,
  invoiceSummary,
  currencyBreakdown,
  currency,
}: ReportsViewProps) {
  const { t, locale } = useI18n();

  const maxMonthly = Math.max(
    ...monthlyData.flatMap((m) => [m.income, m.expenses]),
    1
  );

  const monthNames = monthlyData.map((m) => {
    const [year, month] = m.month.split("-");
    const d = new Date(Number(year), Number(month) - 1, 1);
    return d.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
      month: "short",
    });
  });

  const statusConfig: Record<string, { label: string; color: string }> = {
    paid: { label: t.paid, color: "#10b981" },
    pending: { label: t.pending, color: "#f59e0b" },
    overdue: { label: t.overdue, color: "#ef4444" },
    draft: { label: t.draft, color: "#64748b" },
  };

  const cardClass =
    "bg-white/[0.04] border border-white/[0.08] rounded-[20px] p-6 backdrop-blur-sm";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[#e2e8f0]">{t.reports}</h2>
        <p className="text-[#94a3b8] mt-1">{t.last6Months}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Monthly Overview (span 2 cols) */}
        <div className={`${cardClass} lg:col-span-2`}>
          <h3 className="text-lg font-semibold text-[#e2e8f0] mb-6">
            {t.monthlyOverview}
          </h3>
          {monthlyData.every((m) => m.income === 0 && m.expenses === 0) ? (
            <p className="text-[#64748b] text-center py-8">{t.noData}</p>
          ) : (
            <div className="space-y-4">
              {monthlyData.map((m, i) => (
                <div key={m.month} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#94a3b8] w-16">{monthNames[i]}</span>
                    <div className="flex gap-4 text-xs">
                      <span className="text-[#10b981]">
                        {formatAmount(m.income, currency)}
                      </span>
                      <span className="text-[#ef4444]">
                        {formatAmount(m.expenses, currency)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <div
                      className="h-5 rounded-md bg-[#10b981]/80 transition-all"
                      style={{
                        width: `${(m.income / maxMonthly) * 100}%`,
                        minWidth: m.income > 0 ? "4px" : "0px",
                      }}
                    />
                    <div
                      className="h-5 rounded-md bg-[#ef4444]/80 transition-all"
                      style={{
                        width: `${(m.expenses / maxMonthly) * 100}%`,
                        minWidth: m.expenses > 0 ? "4px" : "0px",
                      }}
                    />
                  </div>
                </div>
              ))}
              {/* Legend */}
              <div className="flex items-center gap-6 pt-2 text-xs text-[#94a3b8]">
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded-sm bg-[#10b981]/80" />
                  <span>{t.income}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded-sm bg-[#ef4444]/80" />
                  <span>{t.expenses}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Card 2: Expense Categories with Donut Chart */}
        <div className={cardClass}>
          <h3 className="text-lg font-semibold text-[#e2e8f0] mb-6">
            {t.expenseCategories}
          </h3>
          {topCategories.length === 0 ? (
            <p className="text-[#64748b] text-center py-8">{t.noData}</p>
          ) : (
            <div className="space-y-5">
              {/* Donut Chart */}
              <div className="flex justify-center">
                <svg width="180" height="180" viewBox="0 0 180 180">
                  {(() => {
                    const radius = 70;
                    const circumference = 2 * Math.PI * radius;
                    let offset = 0;
                    const totalExp = topCategories.reduce((s, c) => s + c.amount, 0);
                    return topCategories.map((cat) => {
                      const pct = totalExp > 0 ? cat.amount / totalExp : 0;
                      const dash = pct * circumference;
                      const gap = circumference - dash;
                      const color = categoryColors[cat.name] ?? "#64748b";
                      const currentOffset = offset;
                      offset += dash;
                      return (
                        <circle
                          key={cat.name}
                          cx="90"
                          cy="90"
                          r={radius}
                          fill="none"
                          stroke={color}
                          strokeWidth="24"
                          strokeDasharray={`${dash} ${gap}`}
                          strokeDashoffset={-currentOffset}
                          strokeLinecap="butt"
                          transform="rotate(-90 90 90)"
                        />
                      );
                    });
                  })()}
                  <text
                    x="90"
                    y="85"
                    textAnchor="middle"
                    className="fill-[#94a3b8]"
                    fontSize="11"
                  >
                    {t.expenses}
                  </text>
                  <text
                    x="90"
                    y="102"
                    textAnchor="middle"
                    className="fill-[#e2e8f0] font-bold"
                    fontSize="14"
                  >
                    {formatAmount(
                      topCategories.reduce((s, c) => s + c.amount, 0),
                      currency
                    )}
                  </text>
                </svg>
              </div>
              {/* Legend */}
              <div className="space-y-2.5">
                {topCategories.map((cat) => {
                  const categoryKey = cat.name as keyof typeof t;
                  const displayName = t[categoryKey] ?? cat.name;
                  const color = categoryColors[cat.name] ?? "#64748b";
                  return (
                    <div key={cat.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="size-3 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-[#e2e8f0]">{displayName}</span>
                      </div>
                      <span className="text-[#94a3b8]">
                        {formatAmount(cat.amount, currency)}{" "}
                        <span className="text-[#64748b]">({cat.percentage.toFixed(0)}%)</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Card 3: Top Clients by Revenue */}
        <div className={cardClass}>
          <h3 className="text-lg font-semibold text-[#e2e8f0] mb-6">
            {t.topClients}
          </h3>
          {topClients.length === 0 ? (
            <p className="text-[#64748b] text-center py-8">{t.noData}</p>
          ) : (
            <div className="space-y-3">
              {topClients.map((client, i) => (
                <div
                  key={client.name}
                  className="flex items-center justify-between py-3 border-b border-white/[0.06] last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[#64748b] text-sm font-mono w-5">
                      {i + 1}
                    </span>
                    <span className="text-[#e2e8f0] text-sm">
                      {client.name}
                    </span>
                  </div>
                  <span className="text-[#10b981] text-sm font-semibold">
                    {formatAmount(client.amount, currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card 4: Income by Currency */}
        <div className={`${cardClass} lg:col-span-2`}>
          <h3 className="text-lg font-semibold text-[#e2e8f0] mb-6">
            {t.incomeByCurrency}
          </h3>
          {currencyBreakdown.length === 0 ? (
            <p className="text-[#64748b] text-center py-8">{t.noData}</p>
          ) : (
            <div className="space-y-4">
              {(() => {
                const totalConverted = currencyBreakdown.reduce((s, c) => s + c.convertedTotal, 0);
                return currencyBreakdown.map((item) => {
                  const pct = totalConverted > 0 ? (item.convertedTotal / totalConverted) * 100 : 0;
                  const flag = currencyFlags[item.currency] ?? "";
                  const barColor = currencyBarColors[item.currency] ?? "#64748b";
                  return (
                    <div key={item.currency} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{flag}</span>
                          <span className="text-[#e2e8f0] font-medium text-sm">{item.currency}</span>
                          <span className="text-[#64748b] text-xs">
                            ({item.count} {item.count === 1 ? "tx" : "txs"})
                          </span>
                        </div>
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="text-[#94a3b8] text-xs">
                            {t.originalAmount}: {formatAmount(item.originalTotal, item.currency)}
                          </span>
                          <span className="text-[#e2e8f0] text-sm font-semibold">
                            {formatAmount(item.convertedTotal, currency)}
                          </span>
                        </div>
                      </div>
                      <div className="h-3 rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: barColor,
                            minWidth: pct > 0 ? "4px" : "0px",
                          }}
                        />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>

        {/* Card 5: Invoice Summary */}
        <div className={`${cardClass} lg:col-span-2`}>
          <h3 className="text-lg font-semibold text-[#e2e8f0] mb-6">
            {t.invoiceSummary}
          </h3>
          {Object.values(invoiceSummary).every((s) => s.count === 0) ? (
            <p className="text-[#64748b] text-center py-8">{t.noData}</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Object.entries(statusConfig).map(([key, config]) => {
                const data = invoiceSummary[key] ?? { count: 0, total: 0 };
                return (
                  <div
                    key={key}
                    className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className="size-3 rounded-full"
                        style={{ backgroundColor: config.color }}
                      />
                      <span className="text-[#94a3b8] text-sm">
                        {config.label}
                      </span>
                    </div>
                    <p
                      className="text-2xl font-bold"
                      style={{ color: config.color }}
                    >
                      {data.count}
                    </p>
                    <p className="text-[#64748b] text-sm mt-1">
                      {formatAmount(data.total, currency)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Financial disclaimer */}
      <p className="text-[11px] text-[#475569] text-center pt-2">
        {locale === "ar"
          ? "هذه التقارير لأغراض معلوماتية فقط ولا تشكل نصيحة مالية"
          : "These reports are for informational purposes only and do not constitute financial advice"}
      </p>
    </div>
  );
}
