/* Idle-contract detection.
   A contract is "idle" when nobody has touched it for more than 30 days, so the
   list can flag the ones quietly going stale. The update timestamp is stored as
   a localized label (Arabic-Indic digits, Arabic or English month names, or an
   ISO date), so it is parsed defensively — an unparseable value simply means
   "not idle" rather than a false warning. */

import type { Contract } from './types';

/* Anything untouched for longer than this many days is considered idle. */
export const IDLE_DAYS = 30;

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

const MONTHS: Record<string, number> = {
  // English (full + short)
  january: 1, jan: 1,
  february: 2, feb: 2,
  march: 3, mar: 3,
  april: 4, apr: 4,
  may: 5,
  june: 6, jun: 6,
  july: 7, jul: 7,
  august: 8, aug: 8,
  september: 9, sep: 9, sept: 9,
  october: 10, oct: 10,
  november: 11, nov: 11,
  december: 12, dec: 12,
  // Arabic (Levantine + Gulf spellings)
  يناير: 1, فبراير: 2, مارس: 3, أبريل: 4, ابريل: 4, مايو: 5, يونيو: 6,
  يوليو: 7, أغسطس: 8, اغسطس: 8, سبتمبر: 9, أكتوبر: 10, اكتوبر: 10,
  نوفمبر: 11, ديسمبر: 12, كانون: 1, شباط: 2, نيسان: 4, أيار: 5, ايار: 5,
  حزيران: 6, تموز: 7, آب: 8, أيلول: 9, ايلول: 9, تشرين: 10, كانونالأول: 12,
};

/* Turns Arabic-Indic / Persian digits into plain Latin ones. */
const toLatinDigits = (value: string): string => value
  .replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)))
  .replace(/[۰-۹]/g, (d) => String(FA_DIGITS.indexOf(d)));

/* Parses a localized "last updated" label into a real date, or null. */
export const parseContractDate = (value?: string): Date | null => {
  if (!value) return null;
  const raw = toLatinDigits(String(value)).replace(/\s+/g, ' ').trim();
  if (!raw) return null;

  const iso = raw.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    const d = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const words = raw.match(/(\d{1,2})\s+([^\d\s]+)\s+(\d{4})/);
  if (words) {
    const day = Number(words[1]);
    const year = Number(words[3]);
    const month = MONTHS[words[2].toLowerCase().replace(/[.,]/g, '')];
    if (month && day >= 1 && day <= 31) {
      const d = new Date(year, month - 1, day);
      return Number.isNaN(d.getTime()) ? null : d;
    }
  }

  const numeric = raw.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (numeric) {
    const d = new Date(Number(numeric[3]), Number(numeric[2]) - 1, Number(numeric[1]));
    return Number.isNaN(d.getTime()) ? null : d;
  }

  return null;
};

/* How many whole days have passed since the contract was last updated. */
export const idleDays = (c: Contract, now: Date = new Date()): number | null => {
  const updated = parseContractDate(c.updatedAt);
  if (!updated) return null;
  const diff = Math.floor((now.getTime() - updated.getTime()) / 86400000);
  return diff < 0 ? 0 : diff;
};

export const isIdleContract = (c: Contract, now: Date = new Date()): boolean => {
  const days = idleDays(c, now);
  return days !== null && days > IDLE_DAYS;
};