// Copies the pure PlatformConfig module into the Edge Functions so the server
// prices orders with exactly the same rules and bands as the storefront.
// Run after editing src/config/platform.ts:  npm run sync:shared
// The test src/__tests__/server-parity.test.ts fails if the copies drift.
import { readFileSync, writeFileSync } from 'node:fs';

const src = readFileSync(new URL('../src/config/platform.ts', import.meta.url), 'utf8');
const header = '// GENERATED from src/config/platform.ts by scripts/sync-shared.mjs — do not edit.\n';
writeFileSync(new URL('../supabase/functions/_shared/platform.ts', import.meta.url), header + src);
console.log('synced supabase/functions/_shared/platform.ts');
