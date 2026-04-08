const currencySymbols: Record<string, string> = {
  USD: "$",
  EUR: "€",
  SAR: "ر.س",
  AED: "د.إ",
  JOD: "د.أ",
  EGP: "ج.م",
  QAR: "ر.ق",
  KWD: "د.ك",
}

// Exchange rates relative to 1 USD (approximate April 2026)
const ratesFromUSD: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  SAR: 3.75,
  AED: 3.67,
  JOD: 0.709,
  EGP: 50.5,
  QAR: 3.64,
  KWD: 0.307,
}

export function getCurrencySymbol(currency: string): string {
  return currencySymbols[currency] ?? currency
}

/**
 * Convert amount from one currency to another
 */
export function convertCurrency(amount: number, from: string, to: string): number {
  if (from === to) return amount
  const fromRate = ratesFromUSD[from] ?? 1
  const toRate = ratesFromUSD[to] ?? 1
  // Convert: from → USD → to
  return (amount / fromRate) * toRate
}

/**
 * Format amount with currency symbol (no conversion)
 */
export function formatAmount(amount: number, currency: string = "USD"): string {
  const symbol = getCurrencySymbol(currency)
  const formatted = Math.abs(amount).toLocaleString("en-US", { minimumFractionDigits: 2 })
  return `${symbol} ${formatted}`
}

/**
 * Convert amount from source currency to target currency, then format
 */
export function convertAndFormat(amount: number, fromCurrency: string, toCurrency: string): string {
  const converted = convertCurrency(amount, fromCurrency, toCurrency)
  return formatAmount(converted, toCurrency)
}
