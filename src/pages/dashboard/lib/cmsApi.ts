import { supabase } from '@/lib/supabase';
import type { CmsEntry, CmsVersion } from '@/pages/dashboard/views/admin/types';

/* Content editing writes three things through this module, always together:
   the live entry, a snapshot in cms_entry_versions, and the editor's name.
   Keeping it in one place means every save — manual, scheduled, or restored —
   leaves the same readable trail in the history panel. */

export type VersionAction = 'baseline' | 'create' | 'update' | 'restore' | 'schedule' | 'delete';

type Snapshot = {
  id: number;
  key: string;
  lang: string;
  page_key: string;
  area: string;
  label_ar: string | null;
  label_en: string | null;
  value: string;
  kind: string;
  published: boolean;
  sort_order: number;
};

const nowIso = () => new Date().toISOString();

function snapshot(row: Snapshot) {
  return {
    entry_id: row.id,
    key: row.key,
    lang: row.lang,
    page_key: row.page_key,
    area: row.area,
    label_ar: row.label_ar,
    label_en: row.label_en,
    value: row.value,
    kind: row.kind,
    published: row.published,
    sort_order: row.sort_order,
  };
}

export async function insertVersion(row: Snapshot, action: VersionAction, editor: string) {
  try {
    await supabase.from('cms_entry_versions').insert({
      ...snapshot(row),
      action,
      editor: editor || '—',
    });
  } catch {
    /* the history is best-effort: never block a content save because of it */
  }
}

export async function saveEntry(
  row: CmsEntry,
  changes: Partial<CmsEntry>,
  editor: string,
  action: VersionAction = 'update',
): Promise<string> {
  try {
    const { error } = await supabase
      .from('cms_entries')
      .update({ ...changes, last_editor: editor, updated_at: nowIso() })
      .eq('id', row.id);
    if (error) return error.message;
    await insertVersion({ ...row, ...changes } as Snapshot, action, editor);
    return '';
  } catch (err) {
    return err instanceof Error ? err.message : 'save failed';
  }
}

export async function createEntry(
  fields: Record<string, unknown>,
  editor: string,
): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('cms_entries')
      .insert({ ...fields, last_editor: editor })
      .select('*')
      .maybeSingle();
    if (error) return error.message;
    if (data) await insertVersion(data as Snapshot, 'create', editor);
    return '';
  } catch (err) {
    return err instanceof Error ? err.message : 'create failed';
  }
}

export async function deleteEntry(row: CmsEntry, editor: string): Promise<string> {
  try {
    await insertVersion(row as Snapshot, 'delete', editor);
    const { error } = await supabase.from('cms_entries').delete().eq('id', row.id);
    return error ? error.message : '';
  } catch (err) {
    return err instanceof Error ? err.message : 'delete failed';
  }
}

/* Scheduling stores the future value next to the live one, so the site can keep
   serving the current copy until the moment arrives. */
export async function scheduleEntry(
  row: CmsEntry,
  editor: string,
  atIso: string,
  value: string,
  published: boolean,
): Promise<string> {
  try {
    const { error } = await supabase
      .from('cms_entries')
      .update({
        scheduled_at: atIso,
        scheduled_value: value,
        scheduled_published: published,
        scheduled_editor: editor,
        last_editor: editor,
        updated_at: nowIso(),
      })
      .eq('id', row.id);
    if (error) return error.message;
    /* The snapshot keeps today's live copy — the scheduled value is stored on
       the entry itself until its moment, so history stays a record of what the
       site actually showed. */
    await insertVersion(row as Snapshot, 'schedule', editor);
    return '';
  } catch (err) {
    return err instanceof Error ? err.message : 'schedule failed';
  }
}

export async function clearSchedule(row: CmsEntry, editor: string): Promise<string> {
  try {
    const { error } = await supabase
      .from('cms_entries')
      .update({
        scheduled_at: null,
        scheduled_value: null,
        scheduled_published: null,
        scheduled_editor: null,
        last_editor: editor,
        updated_at: nowIso(),
      })
      .eq('id', row.id);
    if (error) return error.message;
    await insertVersion(row as Snapshot, 'update', editor);
    return '';
  } catch (err) {
    return err instanceof Error ? err.message : 'cancel failed';
  }
}

/* Called whenever the admin panel opens: any schedule whose moment has passed
   becomes the live content and the schedule is cleared. The site itself also
   evaluates the schedule locally, so visitors see it even if no admin is here. */
export async function applyDueSchedules(editor: string): Promise<number> {
  try {
    const now = nowIso();
    const { data, error } = await supabase
      .from('cms_entries')
      .select('*')
      .lte('scheduled_at', now)
      .not('scheduled_at', 'is', null);
    if (error || !data || data.length === 0) return 0;

    let applied = 0;
    for (const raw of data as CmsEntry[]) {
      const value = raw.scheduled_value ?? raw.value;
      const published = raw.scheduled_published ?? true;
      const who = raw.scheduled_editor || editor;
      const { error: upError } = await supabase
        .from('cms_entries')
        .update({
          value,
          published,
          scheduled_at: null,
          scheduled_value: null,
          scheduled_published: null,
          scheduled_editor: null,
          last_editor: who,
          updated_at: nowIso(),
        })
        .eq('id', raw.id)
        .eq('scheduled_at', raw.scheduled_at);
      if (!upError) {
        applied += 1;
        await insertVersion({ ...raw, value, published } as Snapshot, 'schedule', who);
      }
    }
    return applied;
  } catch {
    return 0;
  }
}

export async function listVersions(entryId: number): Promise<{ rows: CmsVersion[]; error: string }> {
  try {
    const { data, error } = await supabase
      .from('cms_entry_versions')
      .select('*')
      .eq('entry_id', entryId)
      .order('created_at', { ascending: false })
      .limit(40);
    if (error) return { rows: [], error: error.message };
    return { rows: (data ?? []) as CmsVersion[], error: '' };
  } catch (err) {
    return { rows: [], error: err instanceof Error ? err.message : 'history unavailable' };
  }
}

export function formatWhen(iso: string | null | undefined, lang: string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  try {
    return date.toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      calendar: 'gregory',
      numberingSystem: 'latn',
    });
  } catch {
    return date.toISOString().slice(0, 16).replace('T', ' ');
  }
}

/* Converts a `<input type="datetime-local">` value (local wall clock) into the
   UTC ISO string the database stores. */
export function localToIso(local: string): string {
  const date = new Date(local);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

export function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function isDue(iso: string | null | undefined): boolean {
  if (!iso) return false;
  const time = new Date(iso).getTime();
  return !Number.isNaN(time) && time <= Date.now();
}

/* The whole panel's activity feed — who changed what, across every entry. */
export async function listRecentVersions(limit = 12): Promise<CmsVersion[]> {
  try {
    const { data, error } = await supabase
      .from('cms_entry_versions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) return [];
    return (data ?? []) as CmsVersion[];
  } catch {
    return [];
  }
}