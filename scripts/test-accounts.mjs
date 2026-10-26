#!/usr/bin/env node
/* Test accounts for every panel — for a TEST Supabase project only.

   Creates (or resets) four confirmed accounts and gives each its panel:
     admin  · factory (owns the seeded factory "hasa", verified) ·
     ambassador (leader, code TEST-AMB) · buyer

   Usage
     SUPABASE_URL=https://<ref>.supabase.co SUPABASE_SERVICE_ROLE_KEY=… \
       node scripts/test-accounts.mjs create [--domain safeer.test] [--password '…'] [--factory hasa]
     … node scripts/test-accounts.mjs remove [--domain safeer.test]

   Safety
     • The database refuses unless the project has the flag switched on, once,
       from the SQL editor:  insert into public.app_flags values ('test_accounts', 'true');
       Never switch it on in production.
     • Passwords are generated per account (unless --password is given), printed
       once here and stored nowhere — not in the code, not in the database.
     • The service-role key never leaves your machine; do not commit it. */

import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';

const [command = 'help', ...rest] = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = rest.indexOf(`--${name}`);
  return i >= 0 && rest[i + 1] ? rest[i + 1] : fallback;
};
const domain = opt('domain', 'safeer.test');
const fixedPassword = opt('password', '');
const factoryId = opt('factory', 'hasa');

const ACCOUNTS = [
  { key: 'admin', email: `admin@${domain}`, meta: { full_name: 'مدير تجريبي' }, panel: 'admin' },
  { key: 'factory', email: `factory@${domain}`, meta: { full_name: 'مصنع تجريبي', requested_panel: 'factory', company: 'مصنع تجريبي' }, panel: 'factory' },
  { key: 'ambassador', email: `ambassador@${domain}`, meta: { full_name: 'سفير تجريبي', requested_panel: 'ambassador', country: 'id' }, panel: 'ambassador' },
  { key: 'buyer', email: `buyer@${domain}`, meta: { full_name: 'مشترٍ تجريبي', country: 'id', phone: '+62 812 0000 0000' }, panel: 'buyer' },
];

function fail(msg) {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
}

if (!['create', 'remove'].includes(command)) {
  console.log('Usage: node scripts/test-accounts.mjs create|remove [--domain safeer.test] [--password …] [--factory hasa]');
  process.exit(command === 'help' ? 0 : 1);
}
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) fail('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (of the TEST project).');
if (fixedPassword && fixedPassword.length < 12) fail('--password must be at least 12 characters.');

const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const { data: enabled, error: flagError } = await db.rpc('test_accounts_enabled');
if (flagError) fail(`Cannot reach the project or migration 011 is missing: ${flagError.message}`);
if (enabled !== true) {
  fail("Test accounts are disabled on this project. If — and only if — this is a test project, run in the SQL editor:\n"
    + "  insert into public.app_flags values ('test_accounts', 'true') on conflict (key) do update set value = 'true';");
}

async function findUser(email) {
  for (let page = 1; page < 50; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) fail(error.message);
    const hit = data.users.find((u) => (u.email ?? '').toLowerCase() === email.toLowerCase());
    if (hit) return hit;
    if (data.users.length < 200) return null;
  }
  return null;
}

if (command === 'create') {
  const out = [];
  for (const a of ACCOUNTS) {
    const password = fixedPassword || `Sf-${randomBytes(9).toString('base64url')}`;
    const existing = await findUser(a.email);
    let id;
    if (existing) {
      const { error } = await db.auth.admin.updateUserById(existing.id, { password, email_confirm: true, ban_duration: 'none' });
      if (error) fail(`${a.email}: ${error.message}`);
      id = existing.id;
    } else {
      const { data, error } = await db.auth.admin.createUser({ email: a.email, password, email_confirm: true, user_metadata: a.meta });
      if (error) fail(`${a.email}: ${error.message}`);
      id = data.user.id;
    }
    out.push({ ...a, id, password, reset: Boolean(existing) });
  }
  const ids = Object.fromEntries(out.map((a) => [a.key, a.id]));
  const { data: result, error } = await db.rpc('provision_test_accounts', {
    p_admin: ids.admin, p_factory: ids.factory, p_ambassador: ids.ambassador, p_buyer: ids.buyer, p_factory_id: factoryId,
  });
  if (error) fail(`Provisioning failed: ${error.message}`);

  console.log('\nTest accounts ready (passwords are shown only now):\n');
  console.table(out.map((a) => ({ panel: a.panel, email: a.email, password: a.password, status: a.reset ? 'password reset' : 'created' })));
  console.log(`factory: ${result.factory_id} · ambassador code: ${result.ambassador_code}`);
  console.log('Sign in at /auth (choose the panel). The admin is asked to enrol a TOTP authenticator on first sign-in.\n');
}

if (command === 'remove') {
  const found = [];
  for (const a of ACCOUNTS) {
    const u = await findUser(a.email);
    if (u) found.push({ ...a, id: u.id });
  }
  if (!found.length) { console.log('No test accounts found.'); process.exit(0); }
  const { error } = await db.rpc('unprovision_test_accounts', { p_users: found.map((a) => a.id) });
  if (error) fail(error.message);
  for (const a of found) {
    const { error: e } = await db.auth.admin.deleteUser(a.id);
    if (e) {
      /* Accounts with orders or ledger history cannot be deleted; they are
         blocked instead so the history stays intact. */
      await db.auth.admin.updateUserById(a.id, { ban_duration: '876000h' });
      console.log(`${a.email}: kept for history, sign-in blocked`);
    } else {
      console.log(`${a.email}: deleted`);
    }
  }
}
