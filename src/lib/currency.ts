/* Display currency.

   Every price is stored and charged in SAR. The visitor can read prices in
   their own currency (PKR, EGP, IDR…) using the exchange rates published in
   PlatformConfig.locale.currencies — the checkout always states the SAR amount
   that will actually be charged. */

import i18n from '@/i18n';
import { getConfig } from '@/config/store';
import type { CurrencyDef } from '@/config/platform';

const KEY = 'safeer-currency';

const LANG_DEFAULT: Record<string, string> = { ur: 'PKR', id: 'IDR' };

export function currencyList(): CurrencyDef[] {
  return getConfig().locale.currencies;
}

export function getDisplayCurrency(): CurrencyDef {
  const list = currencyList();
  let code = '';
  try {
    code = localStorage.getItem(KEY) ?? '';
  } catch {
    code = '';
  }
  if (!code) code = LANG_DEFAULT[(i18n.language || 'ar').slice(0, 2)] ?? 'SAR';
  return list.find((c) => c.code === code) ?? list[0];
}

export function setDisplayCurrency(code: string): void {
  try {
    localStorage.setItem(KEY, code);
  } catch {
    /* in-memory only */
  }
  /* Prices are rendered through translated components; nudging the i18n
     change event repaints every price on the page without a reload. */
  i18n.emit('languageChanged', i18n.language);
}

export function currencyForCountry(countryCode: string): string {
  return getConfig().locale.countryCurrency[(countryCode || '').toLowerCase()] ?? 'USD';
}

const isArabicScript = () => /^(ar|ur)/.test((i18n.language || 'ar').toLowerCase());

/** Formats a SAR amount in the given currency (default: the visitor's). */
export function formatIn(sar: number, cur: CurrencyDef = getDisplayCurrency()): string {
  const value = sar * cur.perSar;
  const amount = value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: cur.decimals,
  });
  const symbol = isArabicScript() ? cur.symbolAr : cur.symbolEn;
  return isArabicScript() ? `${amount} ${symbol}` : `${symbol} ${amount}`;
}

/** Always SAR — for invoices, ledgers and the amount actually charged. */
export function formatSarStrict(sar: number): string {
  return formatIn(sar, currencyList().find((c) => c.code === 'SAR') ?? currencyList()[0]);
}
