import { LEGAL_DOCS, REQUIRED_FOR } from '@/config/legal';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { PanelKey } from './panels';

export type SignUpInput = {
  email: string;
  password: string;
  fullName: string;
  panel: PanelKey;
  company?: string;
  profile?: Record<string, string>;
};

export function signInWithPassword(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email: email.trim(), password });
}

/* Fields that may travel in user_metadata. user_metadata is copied into the
   session token, is readable by the browser, and the user can rewrite it at
   any time with updateUser() — so it carries nothing sensitive and nothing
   that grants anything. Role and verification status are assigned only by
   the server (handle_new_user trigger + admin RPCs); national ID and IBAN go
   to the private KYC table through submit_kyc. */
const PUBLIC_PROFILE_KEYS = [
  'phone',
  'country',
  'city',
  'entity_type',
  'job_title',
  'cr_number',
  'vat_number',
  'industry',
  'website',
  'categories',
  'monthly_volume',
  'employees',
  'factory_area',
  'annual_capacity',
  'promo_channel',
  'audience_size',
  'experience',
  'payout_method',
  'acquisition_channel',
  'verification_method',
  'leader_code',
] as const;

/* Never placed in user_metadata. */
export const SENSITIVE_KEYS = ['national_id', 'iban'] as const;

/* Panels a visitor may ask for at sign-up. Admin is never self-service. */
export const SELF_SERVICE_PANELS: PanelKey[] = ['buyer', 'ambassador', 'factory'];

const PENDING_KYC_KEY = 'safeer-pending-kyc';

export function splitProfile(profile: Record<string, string> = {}) {
  const safe: Record<string, string> = {};
  const sensitive: Record<string, string> = {};
  (PUBLIC_PROFILE_KEYS as readonly string[]).forEach((key) => {
    const v = profile[key];
    if (typeof v === 'string' && v.trim()) safe[key] = v.trim().slice(0, 200);
  });
  (SENSITIVE_KEYS as readonly string[]).forEach((key) => {
    const v = profile[key];
    if (typeof v === 'string' && v.trim()) sensitive[key] = v.replace(/\s+/g, '').slice(0, 40);
  });
  return { safe, sensitive };
}

export function createAccount(input: SignUpInput) {
  const panel = SELF_SERVICE_PANELS.includes(input.panel) ? input.panel : 'buyer';
  const { safe, sensitive } = splitProfile(input.profile);
  /* Held for this tab only until the first authenticated session, then sent
     to submit_kyc and wiped. It never reaches the token. */
  try {
    if (Object.keys(sensitive).length) sessionStorage.setItem(PENDING_KYC_KEY, JSON.stringify(sensitive));
  } catch {
    /* the dashboard asks for the documents again */
  }
  return supabase.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: {
      data: {
        full_name: input.fullName.trim().slice(0, 120),
        requested_panel: panel,
        company: input.company?.trim().slice(0, 160) ?? '',
        ...safe,
        /* "key@version" of every document shown and accepted on this form;
           the database records them (record_signup_legal). */
        legal_accepted: REQUIRED_FOR[panel].map((k) => `${k}@${LEGAL_DOCS[k].version}`),
      },
    },
  });
}

/** Sends national ID / IBAN collected at sign-up to the private KYC table. */
export async function submitPendingKyc() {
  let pending: Record<string, string> | null = null;
  try {
    const raw = sessionStorage.getItem(PENDING_KYC_KEY);
    pending = raw ? JSON.parse(raw) : null;
  } catch {
    pending = null;
  }
  if (!pending) return;
  const { error } = await supabase.rpc('submit_kyc', {
    p_national_id: pending.national_id ?? null,
    p_iban: pending.iban ?? null,
  });
  if (!error) {
    try {
      sessionStorage.removeItem(PENDING_KYC_KEY);
    } catch {
      /* ignore */
    }
  }
}

export type OtpMode = 'signup' | 'recovery';

/* The backend may label a confirmation as "signup" or as the generic "email"
   type depending on its mail template, so we try both before giving up. */
export async function confirmCode(email: string, token: string, mode: OtpMode) {
  const first = await supabase.auth.verifyOtp({ email: email.trim(), token, type: mode });
  if (!first.error || mode === 'recovery') return first;
  const retry = await supabase.auth.verifyOtp({ email: email.trim(), token, type: 'email' });
  if (!retry.error) return retry;
  return first;
}

export function resendConfirmation(email: string) {
  return supabase.auth.resend({ type: 'signup', email: email.trim() });
}

export function requestPasswordReset(email: string, redirectTo: string) {
  return supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
}

export function saveNewPassword(password: string) {
  return supabase.auth.updateUser({ password });
}

export function currentSession() {
  return supabase.auth.getSession();
}

/* The profile row is created by the database trigger handle_new_user from
   whitelisted metadata — the browser no longer writes `profiles`, so it can
   neither pick its role nor mark itself verified. After sign-in we only push
   any pending KYC documents. */
export async function ensureProfile(user: User | null | undefined, _panel?: PanelKey) {
  void _panel;
  if (!user) return;
  try {
    await submitPendingKyc();
  } catch {
    /* retried on next sign-in */
  }
}

/** Roles granted to the signed-in user by the server (user_roles). */
export async function fetchMyAccess(): Promise<{ roles: PanelKey[]; verification: string; mfa: boolean }> {
  const { data, error } = await supabase.rpc('my_access');
  if (error || !data) return { roles: [], verification: 'unverified', mfa: false };
  const row = data as { roles?: string[]; verification_status?: string };
  const roles = (row.roles ?? []).filter(
    (r): r is PanelKey => r === 'buyer' || r === 'ambassador' || r === 'factory' || r === 'admin',
  );
  /* Assurance level comes from the session itself (aal2 = second factor done). */
  let mfa = false;
  try {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    mfa = aal?.currentLevel === 'aal2';
  } catch {
    mfa = false;
  }
  return { roles, verification: row.verification_status ?? 'unverified', mfa };
}

/* Maps backend auth errors onto friendly keys the pages translate. */
export function errorKey(message: string): string {
  const m = (message || '').toLowerCase();
  if (m.includes('invalid login') || m.includes('invalid credentials')) return 'credentials';
  if (m.includes('already registered') || m.includes('already exists')) return 'exists';
  if (m.includes('not confirmed') || m.includes('confirm')) return 'notConfirmed';
  if (m.includes('rate limit') || m.includes('too many') || m.includes('for security purposes')) return 'rate';
  if (m.includes('password') && m.includes('least')) return 'short';
  if (m.includes('email') && (m.includes('invalid') || m.includes('format'))) return 'email';
  if (m.includes('token') || m.includes('otp') || m.includes('expired')) return 'code';
  return 'generic';
}
