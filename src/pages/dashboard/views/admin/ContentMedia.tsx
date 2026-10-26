import { useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { refreshCms } from '@/hooks/useCms';
import { useAuth } from '@/pages/auth/AuthProvider';
import { Card, Pill } from '@/pages/dashboard/components/ui';
import { cmsText } from './cmsText';
import type { CmsMedia } from './types';

type Props = {
  rows: CmsMedia[];
  reload: () => void;
  flash: (message: string) => void;
};

const SECTIONS = [
  'home-hero', 'home-story', 'home-ambassadors', 'home-logistics',
  'home-numbers', 'home-join', 'store-hero', 'ambassador-library',
];

const LANGS = [
  { value: 'both', ar: 'اللغتان', en: 'Both languages' },
  { value: 'ar', ar: 'العربية', en: 'Arabic' },
  { value: 'en', ar: 'الإنجليزية', en: 'English' },
];

export default function ContentMedia({ rows, reload, flash }: Props) {
  const T = cmsText.ar;
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [form, setForm] = useState({
    kind: 'video',
    lang: 'both',
    section: 'home-hero',
    title_ar: '',
    title_en: '',
    url: '',
    poster_url: '',
  });

  const upload = async () => {
    if (!file && !form.url.trim()) {
      flash(T.needSource);
      return;
    }
    if (!form.title_ar.trim()) {
      flash(T.needTitle);
      return;
    }
    setBusy(true);
    try {
      let finalUrl = form.url.trim();
      let path: string | null = null;

      if (file) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('kind', form.kind);
        const base = String(import.meta.env.VITE_PUBLIC_SUPABASE_URL ?? '');
        const key = String(import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY ?? '');
        let uploaded = false;
        /* The function only accepts an admin's own session token — the anon
           key alone is refused. */
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token ?? '';

        try {
          const res = await fetch(`${base}/functions/v1/cms-upload`, {
            method: 'POST',
            headers: { apikey: key, Authorization: `Bearer ${accessToken}` },
            body: fd,
          });
          const payload = (await res.json().catch(() => null)) as { url?: string; path?: string } | null;
          if (res.ok && payload?.url) {
            finalUrl = payload.url;
            path = payload.path ?? null;
            uploaded = true;
          }
        } catch {
          /* fall through to the direct storage path below */
        }

        if (!uploaded && user) {
          const safe = file.name.toLowerCase().replace(/[^a-z0-9._-]/g, '-');
          path = `cms/${Date.now()}-${safe}`;
          const { error: upError } = await supabase.storage
            .from('media')
            .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
          if (!upError) {
            /* `media` is a public, read-only bucket for published site media:
               a stable public URL instead of a year-long signed link. */
            const { data: pub } = supabase.storage.from('media').getPublicUrl(path);
            if (pub?.publicUrl) {
              finalUrl = pub.publicUrl;
              uploaded = true;
            }
          }
        }

        if (!uploaded) {
          flash(T.uploadError);
          return;
        }
      }

      const { error: dbError } = await supabase.from('cms_media').insert({
        title_ar: form.title_ar.trim(),
        title_en: form.title_en.trim() || form.title_ar.trim(),
        kind: form.kind,
        lang: form.lang,
        section: form.section,
        url: finalUrl,
        poster_url: form.poster_url.trim() || null,
        storage_path: path,
        status: 'published',
        sort_order: 10,
      });
      if (dbError) {
        flash(T.uploadError);
        return;
      }
      flash(T.uploaded);
      setForm({ ...form, title_ar: '', title_en: '', url: '', poster_url: '' });
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      refreshCms();
      reload();
    } catch {
      flash(T.uploadError);
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (row: CmsMedia) => {
    const next = row.status === 'published' ? 'hidden' : 'published';
    const { error } = await supabase.from('cms_media').update({ status: next }).eq('id', row.id);
    if (error) {
      flash(T.saveError);
      return;
    }
    flash(T.mediaUpdated);
    refreshCms();
    reload();
  };

  const remove = async (row: CmsMedia) => {
    if (confirmId !== row.id) {
      setConfirmId(row.id);
      window.setTimeout(() => setConfirmId((cur) => (cur === row.id ? null : cur)), 4000);
      return;
    }
    const { error } = await supabase.from('cms_media').delete().eq('id', row.id);
    if (error) {
      flash(T.saveError);
      return;
    }
    if (row.storage_path) {
      await supabase.storage.from('media').remove([row.storage_path]);
    }
    flash(T.mediaDeleted);
    setConfirmId(null);
    refreshCms();
    reload();
  };

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      flash(T.copied);
    } catch {
      flash(url);
    }
  };

  const langLabel = (value: string) => (LANGS.find((l) => l.value === value)?.ar ?? value);

  return (
    <>
      <Card title={T.uploadCard} sub={T.uploadCardSub} className="mb">
        <div className="grid c2">
          <div className="field">
            <label htmlFor="cm-kind">{T.mediaKind}</label>
            <select id="cm-kind" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
              <option value="video">{T.kindVideo}</option>
              <option value="image">{T.kindImage}</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="cm-lang">{T.mediaLang}</label>
            <select id="cm-lang" value={form.lang} onChange={(e) => setForm({ ...form, lang: e.target.value })}>
              {LANGS.map((l) => <option key={l.value} value={l.value}>{l.ar}</option>)}
            </select>
          </div>
        </div>

        <div className="grid c2">
          <div className="field">
            <label htmlFor="cm-tar">{T.titleArLabel}</label>
            <input id="cm-tar" value={form.title_ar} onChange={(e) => setForm({ ...form, title_ar: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="cm-ten">{T.titleEnLabel}</label>
            <input id="cm-ten" dir="ltr" value={form.title_en} onChange={(e) => setForm({ ...form, title_en: e.target.value })} />
          </div>
        </div>

        <div className="field">
          <label htmlFor="cm-sec">{T.section}</label>
          <select id="cm-sec" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })}>
            {SECTIONS.map((key) => (
              <option key={key} value={key}>{T.sections[key] ?? key}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="cm-url">{T.urlLabel}</label>
          <input
            id="cm-url"
            dir="ltr"
            placeholder="https://…mp4"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
          />
          <div className="small muted" style={{ marginTop: 5 }}>{T.urlHint}</div>
        </div>

        <div className="field">
          <label htmlFor="cm-poster">{T.posterLabel}</label>
          <input
            id="cm-poster"
            dir="ltr"
            value={form.poster_url}
            onChange={(e) => setForm({ ...form, poster_url: e.target.value })}
          />
        </div>

        <input
          ref={fileRef}
          className="file-input-hidden"
          type="file"
          id="cm-file"
          accept={form.kind === 'video' ? 'video/mp4,video/webm' : 'image/jpeg,image/png,image/webp'}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <label className={`drop-zone ${file ? 'has-file' : ''}`} htmlFor="cm-file" style={{ marginBottom: 12 }}>
          <i className="ri-upload-cloud-2-line" />
          <span>{file ? T.fileChosen : T.chooseFile}</span>
          <span className="fname">{file ? file.name : T.noFile}</span>
        </label>

        {!user && (
          <div className="note" style={{ marginBottom: 12 }}>
            <i className="ri-information-line" />
            <span>{T.uploadCardSub}</span>
          </div>
        )}

        <button type="button" className="btn primary" onClick={upload} disabled={busy}>
          <i className={busy ? 'ri-loader-4-line spin' : 'ri-upload-2-line'} />
          {busy ? T.uploading : T.upload}
        </button>
      </Card>

      <Card title={T.mediaList} sub={T.mediaListSub.replace('{{count}}', String(rows.length))}>
        {rows.length === 0 ? (
          <div className="empty">
            <i className="ri-film-line" />
            <div>{T.mediaEmpty}</div>
          </div>
        ) : (
          <div className="media">
            {rows.map((row) => (
              <article className={`tile cms-media-tile ${row.status === 'published' ? '' : 'is-off'}`} key={row.id}>
                <div className="cms-media-preview">
                  {row.kind === 'video' ? (
                    <video src={row.url} poster={row.poster_url ?? undefined} controls preload="metadata" />
                  ) : (
                    <img src={row.url} alt={row.title_ar} />
                  )}
                </div>
                <div className="meta">
                  <div className="t">{row.title_ar}</div>
                  <div className="s" dir="ltr">{row.title_en}</div>
                  <div className="cms-media-tags">
                    <Pill tone={row.status === 'published' ? 'ok' : 'mute'}>
                      {row.status === 'published' ? T.statusPublished : T.statusHidden}
                    </Pill>
                    <Pill tone="info">{row.kind === 'video' ? T.kindVideo : T.kindImage}</Pill>
                    <Pill tone="mute">{langLabel(row.lang)}</Pill>
                  </div>
                  <div className="s" style={{ marginTop: 4 }}>{T.sections[row.section] ?? row.section}</div>
                  <div className="cms-media-actions">
                    <button type="button" className="btn sm ghost" onClick={() => toggle(row)}>
                      <i className={row.status === 'published' ? 'ri-eye-off-line' : 'ri-eye-line'} />
                      {row.status === 'published' ? T.hide : T.show}
                    </button>
                    <button type="button" className="btn sm ghost" onClick={() => copy(row.url)} aria-label={T.copy}>
                      <i className="ri-file-copy-line" />
                    </button>
                    <button
                      type="button"
                      className={`btn sm ${confirmId === row.id ? 'primary' : 'ghost'}`}
                      onClick={() => remove(row)}
                      aria-label={T.delete}
                    >
                      <i className={confirmId === row.id ? 'ri-alert-line' : 'ri-delete-bin-6-line'} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}