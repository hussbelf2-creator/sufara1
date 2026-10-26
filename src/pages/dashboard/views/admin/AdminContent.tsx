import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchAllRows } from '@/lib/fetchAll';
import { useAuth } from '@/pages/auth/AuthProvider';
import { applyDueSchedules } from '@/pages/dashboard/lib/cmsApi';
import { Card, PageHead, Pill, Stat, Toast } from '@/pages/dashboard/components/ui';
import ContentEntries from './ContentEntries';
import ContentMedia from './ContentMedia';
import { cmsText } from './cmsText';
import type { CmsEntry, CmsMedia } from './types';

type Tab = 'content' | 'media';

export default function AdminContent() {
  const T = cmsText.ar;
  const { user, fullName, demoRole } = useAuth();
  const editor = fullName || user?.email || (demoRole === 'admin' ? 'مدير المنصة (تجريبي)' : 'مدير المنصة');
  const [tab, setTab] = useState<Tab>('content');
  const [entries, setEntries] = useState<CmsEntry[]>([]);
  const [media, setMedia] = useState<CmsMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const flash = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2800);
  };

  const load = useCallback(async () => {
    setError('');
    try {
      /* Anything whose scheduled minute has passed becomes live copy before the
         panel reads the table, so what the admin sees is what the site serves. */
      await applyDueSchedules(editor);

      /* Paged fetches: the store holds every line on the site, well past the
         single-response row cap. */
      const [entryFetch, mediaFetch] = await Promise.all([
        fetchAllRows<CmsEntry>((from, to) => supabase
          .from('cms_entries')
          .select('*')
          .order('id', { ascending: true })
          .range(from, to)),
        fetchAllRows<CmsMedia>((from, to) => supabase
          .from('cms_media')
          .select('*')
          .order('sort_order', { ascending: true })
          .range(from, to)),
      ]);
      if (entryFetch.error) {
        setError(entryFetch.error);
        return;
      }
      const ordered = entryFetch.rows.slice().sort((a, b) => (
        a.page_key.localeCompare(b.page_key)
        || a.sort_order - b.sort_order
        || a.id - b.id
      ));
      setEntries(ordered);
      setMedia(mediaFetch.rows);
    } catch {
      setError(T.saveError);
    } finally {
      setLoading(false);
    }
  }, [T.saveError, editor]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => ({
    total: entries.length,
    published: entries.filter((row) => row.published).length,
    draft: entries.filter((row) => !row.published).length,
    videos: media.filter((row) => row.kind === 'video').length,
    scheduled: entries.filter((row) => row.scheduled_at).length,
  }), [entries, media]);

  const heroAr = media.find((row) => row.section === 'home-hero' && row.kind === 'video'
    && (row.lang === 'ar' || row.lang === 'both') && row.status === 'published');
  const heroEn = media.find((row) => row.section === 'home-hero' && row.kind === 'video'
    && (row.lang === 'en' || row.lang === 'both') && row.status === 'published');

  return (
    <>
      <PageHead
        eyebrow={T.eyebrow}
        title={T.title}
        sub={T.sub}
        actions={(
          <div className="seg compact" role="tablist" aria-label={T.title}>
            <button type="button" role="tab" aria-selected={tab === 'content'} className={tab === 'content' ? 'is-on' : ''} onClick={() => setTab('content')}>
              <i className="ri-file-text-line" /> {T.tabContent}
            </button>
            <button type="button" role="tab" aria-selected={tab === 'media'} className={tab === 'media' ? 'is-on' : ''} onClick={() => setTab('media')}>
              <i className="ri-film-line" /> {T.tabMedia}
            </button>
          </div>
        )}
      />

      <div className="grid c4 mb">
        <Stat icon="ri-file-text-line" num={String(stats.total)} lbl={T.statEntries} />
        <Stat icon="ri-checkbox-circle-line" num={String(stats.published)} lbl={T.statPublished} />
        <Stat icon="ri-draft-line" num={String(stats.draft)} lbl={T.statDraft} />
        <Stat icon="ri-film-line" num={String(stats.videos)} lbl={T.statVideos} />
      </div>

      {stats.scheduled > 0 && (
        <div className="cms-sched-bar mb">
          <i className="ri-calendar-schedule-line" />
          <span>
            {stats.scheduled} {T.schedule} — {T.scheduleSub}
          </span>
          <Pill tone="warn">{T.scheduledBadge}</Pill>
        </div>
      )}

      <Card
        className="mb"
        title={T.heroCard}
        sub={T.heroCardSub}
        action={(
          <button type="button" className="btn sm primary" onClick={() => setTab('media')}>
            <i className="ri-upload-cloud-2-line" /> {T.heroManage}
          </button>
        )}
      >
        <div className="grid c2">
          <div className="cms-hero-lang">
            <div className="cms-hero-flag">AR</div>
            <div className="cms-hero-body">
              <div className="t">{T.heroAr}</div>
              <div className="s">{heroAr?.title_ar ?? T.heroMissing}</div>
            </div>
            <Pill tone={heroAr ? 'ok' : 'mute'}>{heroAr ? T.statusPublished : T.draft}</Pill>
          </div>
          <div className="cms-hero-lang">
            <div className="cms-hero-flag">EN</div>
            <div className="cms-hero-body">
              <div className="t">{T.heroEn}</div>
              <div className="s" dir="ltr">{heroEn?.title_en ?? T.heroMissing}</div>
            </div>
            <Pill tone={heroEn ? 'ok' : 'mute'}>{heroEn ? T.statusPublished : T.draft}</Pill>
          </div>
        </div>
      </Card>

      {tab === 'content' ? (
        <ContentEntries
          entries={entries}
          loading={loading}
          error={error}
          reload={load}
          flash={flash}
        />
      ) : (
        <ContentMedia rows={media} reload={load} flash={flash} />
      )}

      <Toast message={toast} />
    </>
  );
}