#!/usr/bin/env node
/* Downloads every object of every storage bucket into <dir>/<bucket>/<path>.
   Used by backup.sh (the folder is then tarred and encrypted). */
import { createClient } from '@supabase/supabase-js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const out = process.argv[2];
if (!out) { console.error('usage: storage-backup.mjs <dir>'); process.exit(1); }
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function walk(bucket, prefix = '') {
  const files = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await db.storage.from(bucket).list(prefix, { limit: 1000, offset });
    if (error) throw new Error(`${bucket}/${prefix}: ${error.message}`);
    for (const item of data) {
      const path = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id === null) files.push(...await walk(bucket, path));   // folder
      else files.push(path);
    }
    if (data.length < 1000) break;
  }
  return files;
}

const { data: buckets, error } = await db.storage.listBuckets();
if (error) { console.error(error.message); process.exit(1); }
let count = 0;
for (const b of buckets) {
  for (const path of await walk(b.name)) {
    const { data, error: e } = await db.storage.from(b.name).download(path);
    if (e) throw new Error(`${b.name}/${path}: ${e.message}`);
    const target = join(out, b.name, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, Buffer.from(await data.arrayBuffer()));
    count += 1;
  }
}
console.log(`storage: ${count} files from ${buckets.length} buckets`);
