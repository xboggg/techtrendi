export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  locale: string;
  /** Approximate exchange rate from 1 USD to this currency */
  rate: number;
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: "USD", symbol: "$", name: "US Dollar", locale: "en-US", rate: 1 },
  { code: "EUR", symbol: "€", name: "Euro", locale: "de-DE", rate: 0.92 },
  { code: "GBP", symbol: "£", name: "British Pound", locale: "en-GB", rate: 0.79 },
  { code: "GHS", symbol: "GH₵", name: "Ghana Cedi", locale: "en-GH", rate: 14.5 },
  { code: "NGN", symbol: "₦", name: "Nigerian Naira", locale: "en-NG", rate: 1550 },
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling", locale: "en-KE", rate: 129 },
  { code: "ZAR", symbol: "R", name: "South African Rand", locale: "en-ZA", rate: 18.2 },
  { code: "INR", symbol: "₹", name: "Indian Rupee", locale: "en-IN", rate: 83.5 },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", locale: "ja-JP", rate: 155 },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan", locale: "zh-CN", rate: 7.25 },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar", locale: "en-CA", rate: 1.36 },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", locale: "en-AU", rate: 1.53 },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc", locale: "de-CH", rate: 0.88 },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham", locale: "ar-AE", rate: 3.67 },
  { code: "BRL", symbol: "R$", name: "Brazilian Real", locale: "pt-BR", rate: 5.0 },
  { code: "XOF", symbol: "CFA", name: "West African CFA", locale: "fr-SN", rate: 605 },
];

const CURRENCY_STORAGE_KEY = "techtrendi_preferred_currency";

export function getPreferredCurrency(): string {
  try {
    return localStorage.getItem(CURRENCY_STORAGE_KEY) || "USD";
  } catch {
    return "USD";
  }
}

export function setPreferredCurrency(code: string) {
  try {
    localStorage.setItem(CURRENCY_STORAGE_KEY, code);
  } catch {
    // ignore
  }
}

export function getCurrencyInfo(code: string): CurrencyInfo {
  return CURRENCIES.find(c => c.code === code) || CURRENCIES[0];
}

/**
 * Convert a USD amount to the target currency using approximate exchange rates.
 */
export function convertFromUSD(amountInUSD: number, currencyCode: string): number {
  const info = getCurrencyInfo(currencyCode);
  return amountInUSD * info.rate;
}

/**
 * Format an amount in the given currency (no conversion applied).
 */
export function formatCurrency(amount: number, currencyCode: string = "USD"): string {
  const info = getCurrencyInfo(currencyCode);
  try {
    return new Intl.NumberFormat(info.locale, {
      style: "currency",
      currency: info.code,
      minimumFractionDigits: info.code === "JPY" ? 0 : 2,
      maximumFractionDigits: info.code === "JPY" ? 0 : 2,
    }).format(amount);
  } catch {
    return `${info.symbol}${amount.toFixed(2)}`;
  }
}

/**
 * Convert a USD amount to the target currency and format it.
 */
export function formatCurrencyFromUSD(amountInUSD: number, currencyCode: string = "USD"): string {
  const converted = convertFromUSD(amountInUSD, currencyCode);
  return formatCurrency(converted, currencyCode);
}
