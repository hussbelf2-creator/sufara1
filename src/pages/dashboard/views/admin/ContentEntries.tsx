import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { refreshCms } from '@/hooks/useCms';
import { useAuth } from '@/pages/auth/AuthProvider';
import { Card, Modal, Pill } from '@/pages/dashboard/components/ui';
import {
  saveEntry, createEntry, deleteEntry, formatWhen, listRecentVersions,
} from '@/pages/dashboard/lib/cmsApi';
import { syncSiteContent } from '@/pages/dashboard/lib/cmsSync';
import type { VersionAction } from '@/pages/dashboard/lib/cmsApi';
import ContentRow from './ContentRow';
import PreviewModal from './PreviewModal';
import ScheduleModal from './ScheduleModal';
import VersionsModal from './VersionsModal';
import { cmsText } from './cmsText';
import type { CmsEntry, CmsLang, CmsVersion } from './types';

type Props = {
  entries: CmsEntry[];
  loading: boolean;
  error: string;
  reload: () => void;
  flash: (message: string) => void;
};

const PAGES = [
  { key: 'home', ar: 'الرئيسية', en: 'Home' },
  { key: 'shop', ar: 'المتجر', en: 'Shop' },
  { key: 'factories', ar: 'المصانع', en: 'Factories' },
  { key: 'faq', ar: 'الأسئلة الشائعة', en: 'FAQ' },
  { key: 'orders', ar: 'الطلبات', en: 'Orders' },
  { key: 'support', ar: 'الدعم', en: 'Support' },
  { key: 'legal', ar: 'الصفحات القانونية', en: 'Legal' },
  { key: 'brand', ar: 'الشعار والهوية', en: 'Brand' },
  { key: 'common', ar: 'العناصر المشتركة', en: 'Shared' },
  { key: 'general', ar: 'عام', en: 'General' },
];

/* The store carries thousands of lines once a full import has run, so the list
   is paged instead of dumped whole. */
const PAGE_SIZE = 12;

const ACTION_LABEL: Record<string, string> = {
  baseline: cmsText.ar.actionBaseline,
  create: cmsText.ar.actionCreate,
  update: cmsText.ar.actionUpdate,
  restore: cmsText.ar.actionRestore,
  schedule: cmsText.ar.actionSchedule,
  delete: cmsText.ar.actionDelete,
};

const ACTION_ICON: Record<string, string> = {
  baseline: 'ri-flag-line',
  create: 'ri-add-circle-line',
  update: 'ri-edit-2-line',
  restore: 'ri-history-line',
  schedule: 'ri-time-line',
  delete: 'ri-delete-bin-6-line',
};

export default function ContentEntries({ entries, loading, error, reload, flash }: Props) {
  const T = cmsText.ar;
  const { user, fullName, demoRole } = useAuth();
  const editor = fullName || user?.email || (demoRole === 'admin' ? 'مدير المنصة (تجريبي)' : 'مدير المنصة');

  const [lang, setLang] = useState<CmsLang>('ar');
  const [page, setPage] = useState('all');
  const [query, setQuery] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const autoRan = useRef(false);
  const autoDone = useRef(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [activity, setActivity] = useState<CmsVersion[]>([]);
  const [preview, setPreview] = useState<{ row: CmsEntry; value: string } | null>(null);
  const [schedule, setSchedule] = useState<CmsEntry | null>(null);
  const [scheduleDraft, setScheduleDraft] = useState('');
  const [history, setHistory] = useState<CmsEntry | null>(null);
  const [form, setForm] = useState({
    key: '', label_ar: '', label_en: '', page_key: 'home', area: 'general', value: '', kind: 'text',
  });

  const loadActivity = useCallback(async () => {
    const rows = await listRecentVersions(10);
    setActivity(rows);
  }, []);

  useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  const filtered = useMemo(() => entries.filter((row) => {
    if (row.lang !== lang) return false;
    if (page !== 'all' && row.page_key !== page) return false;
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    return [row.key, row.label_ar, row.label_en, row.value]
      .some((v) => String(v ?? '').toLowerCase().includes(needle));
  }), [entries, lang, page, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(pageIndex, pageCount - 1);
  const offset = currentPage * PAGE_SIZE;

  const visible = useMemo(
    () => filtered.slice(offset, offset + PAGE_SIZE),
    [filtered, offset],
  );

  useEffect(() => {
    setPageIndex(0);
  }, [lang, page, query]);

  /* First visit pulls in every line the site can print, so the panel starts
     complete instead of home-page only. Safe to repeat — it fills gaps only. */
  const runSync = useCallback(async (silent: boolean) => {
    setSyncing(true);
    const result = await syncSiteContent();
    setSyncing(false);
    autoDone.current = result.scanned > 0;
    if (result.error) {
      if (!silent) flash(T.syncError);
      return;
    }
    if (result.added > 0) {
      flash(T.syncDone.replace('{{count}}', String(result.added)));
      reload();
      return;
    }
    if (!silent) flash(T.syncNone);
  }, [flash, reload, T.syncDone, T.syncError, T.syncNone]);

  useEffect(() => {
    if (autoRan.current) return;
    autoRan.current = true;
    try {
      if (localStorage.getItem('sta-cms-imported') === '1') return;
    } catch {
      return;
    }
    runSync(true).then(() => {
      /* The flag is only set when the scan really read the site's copy, so a
         failed first run is retried on the next visit instead of being lost. */
      if (!autoDone) return;
      try {
        localStorage.setItem('sta-cms-imported', '1');
      } catch {
        /* private mode — the manual button still works */
      }
    });
  }, [runSync]);

  const groups = useMemo(() => {
    const map = new Map<string, CmsEntry[]>();
    visible.forEach((row) => {
      const list = map.get(row.area) ?? [];
      list.push(row);
      map.set(row.area, list);
    });
    return [...map.entries()];
  }, [visible]);

  const commit = async (
    row: CmsEntry,
    changes: Partial<CmsEntry>,
    action: VersionAction = 'update',
    message = T.saved,
  ): Promise<boolean> => {
    setSavingId(row.id);
    try {
      const failure = await saveEntry(row, changes, editor, action);
      if (failure) {
        flash(T.saveError);
        return false;
      }
      flash(message);
      refreshCms();
      reload();
      loadActivity();
      return true;
    } catch {
      flash(T.saveError);
      return false;
    } finally {
      setSavingId(null);
    }
  };

  const remove = async (row: CmsEntry) => {
    if (confirmId !== row.id) {
      setConfirmId(row.id);
      window.setTimeout(() => setConfirmId((cur) => (cur === row.id ? null : cur)), 4000);
      return;
    }
    const failure = await deleteEntry(row, editor);
    if (failure) {
      flash(T.saveError);
      return;
    }
    flash(T.deleted);
    setConfirmId(null);
    refreshCms();
    reload();
    loadActivity();
  };

  const add = async () => {
    if (!form.key.trim() || !form.value.trim()) {
      flash(T.required);
      return;
    }
    if (entries.some((row) => row.lang === lang && row.key === form.key.trim())) {
      flash(T.keyTaken);
      return;
    }
    const failure = await createEntry({
      key: form.key.trim(),
      lang,
      page_key: form.page_key,
      area: form.area.trim() || 'general',
      label_ar: form.label_ar.trim() || form.key.trim(),
      label_en: form.label_en.trim() || form.key.trim(),
      value: form.value,
      kind: form.kind,
      published: true,
      sort_order: 90,
    }, editor);
    if (failure) {
      flash(T.saveError);
      return;
    }
    flash(T.added);
    setAdding(false);
    setForm({ key: '', label_ar: '', label_en: '', page_key: 'home', area: 'general', value: '', kind: 'text' });
    refreshCms();
    reload();
    loadActivity();
  };

  const openSchedule = (row: CmsEntry, value: string) => {
    setScheduleDraft(value);
    setSchedule(row);
  };

  return (
    <>
      <Card
        title={T.tabContent}
        sub={`${filtered.length} / ${entries.filter((r) => r.lang === lang).length}`}
        className="mb"
        action={(
          <div className="cms-head-actions">
            <button
              type="button"
              className="btn sm ghost"
              disabled={syncing}
              onClick={() => runSync(false)}
              title={T.syncHint}
            >
              <i className={syncing ? 'ri-loader-4-line spin' : 'ri-download-cloud-2-line'} />
              {syncing ? T.syncing : T.syncBtn}
            </button>
            <button type="button" className="btn sm primary" onClick={() => setAdding(true)}>
              <i className="ri-add-line" /> {T.addEntry}
            </button>
          </div>
        )}
      >
        <div className="row-between wrap mb" style={{ gap: 10 }}>
          <div className="seg compact" role="tablist" aria-label={T.editingLang}>
            <button type="button" role="tab" aria-selected={lang === 'ar'} className={lang === 'ar' ? 'is-on' : ''} onClick={() => setLang('ar')}>
              {T.langAr}
            </button>
            <button type="button" role="tab" aria-selected={lang === 'en'} className={lang === 'en' ? 'is-on' : ''} onClick={() => setLang('en')}>
              {T.langEn}
            </button>
          </div>
          <div className="acct-search" style={{ minWidth: 230, flex: 1 }}>
            <i className="ri-search-line" />
            <input
              type="search"
              value={query}
              placeholder={T.search}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select className="month-select" value={page} onChange={(e) => setPage(e.target.value)} aria-label={T.page}>
            <option value="all">{T.allPages}</option>
            {PAGES.map((p) => (
              <option key={p.key} value={p.key}>{lang === 'ar' ? p.ar : p.en}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="empty"><i className="ri-loader-4-line spin" /><div>{T.loading}</div></div>
        ) : error ? (
          <div className="empty">
            <i className="ri-error-warning-line" />
            <div>{error}</div>
            <button type="button" className="btn sm primary" onClick={reload}>
              <i className="ri-refresh-line" /> {T.retry}
            </button>
          </div>
        ) : visible.length === 0 ? (
          <div className="empty">
            <i className="ri-file-text-line" />
            <div>{T.empty}</div>
            <div className="small muted">{T.emptyHint}</div>
          </div>
        ) : (
          <div className="stack">
            {groups.map(([area, rows]) => (
              <div key={area}>
                <div className="cms-group">
                  <span>{area}</span>
                  <Pill tone="mute">{rows.length}</Pill>
                </div>
                <div className="stack" style={{ gap: 10 }}>
                  {rows.map((row) => (
                    <ContentRow
                      key={row.id}
                      row={row}
                      lang={lang}
                      saving={savingId === row.id}
                      confirming={confirmId === row.id}
                      onSaveValue={(target, value) => commit(target, { value })}
                      onTogglePublish={(target, next) => commit(
                        target,
                        { published: next },
                        'update',
                        next ? T.publishedToast : T.hiddenToast,
                      )}
                      onDelete={remove}
                      onPreview={(target, value) => setPreview({ row: target, value })}
                      onSchedule={(target, value) => openSchedule(target, value)}
                      onHistory={(target) => setHistory(target)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {pageCount > 1 && (
          <div className="cms-pager">
            <span className="cms-pager-range">
              {T.showing
                .replace('{{from}}', String(offset + 1))
                .replace('{{to}}', String(Math.min(offset + PAGE_SIZE, filtered.length)))
                .replace('{{count}}', String(filtered.length))}
            </span>
            <div className="cms-pager-btns">
              <button
                type="button"
                className="btn sm ghost"
                disabled={currentPage === 0}
                onClick={() => setPageIndex(currentPage - 1)}
              >
                <i className="ri-arrow-right-line" /> {T.pagePrev}
              </button>
              <span className="cms-pager-label">
                {T.pageOf
                  .replace('{{page}}', String(currentPage + 1))
                  .replace('{{total}}', String(pageCount))}
              </span>
              <button
                type="button"
                className="btn sm ghost"
                disabled={currentPage >= pageCount - 1}
                onClick={() => setPageIndex(currentPage + 1)}
              >
                {T.pageNext} <i className="ri-arrow-left-line" />
              </button>
            </div>
          </div>
        )}

        <div className="divider" />
        <div className="note">
          <i className="ri-information-line" />
          <span>{T.note}</span>
        </div>
        <div className="note">
          <i className="ri-download-cloud-2-line" />
          <span>{T.syncHint}</span>
        </div>
      </Card>

      <Card
        title={T.recentActivity}
        sub={T.recentActivitySub.replace('{{count}}', String(activity.length))}
        className="mb"
      >
        {activity.length === 0 ? (
          <div className="empty">
            <i className="ri-history-line" />
            <div>{T.recentEmpty}</div>
          </div>
        ) : (
          <ul className="cms-feed">
            {activity.map((item) => (
              <li key={item.id}>
                <span className={`cms-ver-ic ${item.action}`}>
                  <i className={ACTION_ICON[item.action] ?? 'ri-edit-2-line'} />
                </span>
                <div className="cms-feed-body">
                  <div className="t">
                    {ACTION_LABEL[item.action] ?? item.action}
                    <code>{item.key}</code>
                  </div>
                  <div className="s">{formatWhen(item.created_at, 'ar')}</div>
                </div>
                <span className="cms-feed-who">
                  <i className="ri-user-line" />
                  {item.editor || T.editorUnknown}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal open={adding} title={T.addEntry} sub={T.addEntrySub} onClose={() => setAdding(false)}>
        <div className="field">
          <label htmlFor="cms-key">{T.keyLabel}</label>
          <input
            id="cms-key"
            dir="ltr"
            placeholder={T.keyHint}
            value={form.key}
            onChange={(e) => setForm({ ...form, key: e.target.value })}
          />
        </div>
        <div className="grid c2">
          <div className="field">
            <label htmlFor="cms-lar">{T.labelAr}</label>
            <input id="cms-lar" value={form.label_ar} onChange={(e) => setForm({ ...form, label_ar: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="cms-len">{T.labelEn}</label>
            <input id="cms-len" dir="ltr" value={form.label_en} onChange={(e) => setForm({ ...form, label_en: e.target.value })} />
          </div>
        </div>
        <div className="grid c2">
          <div className="field">
            <label htmlFor="cms-page">{T.page}</label>
            <select id="cms-page" value={form.page_key} onChange={(e) => setForm({ ...form, page_key: e.target.value })}>
              {PAGES.map((p) => <option key={p.key} value={p.key}>{p.ar}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="cms-kind">{T.kindLabel}</label>
            <select id="cms-kind" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
              <option value="text">{T.kindText}</option>
              <option value="textarea">{T.kindTextarea}</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label htmlFor="cms-area">{T.areaLabel}</label>
          <input id="cms-area" dir="ltr" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="cms-value">{T.valueLabel}</label>
          <textarea id="cms-value" rows={4} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
        </div>
        <div className="small muted" style={{ marginBottom: 4 }}>
          {T.editingLang}: {lang === 'ar' ? T.langAr : T.langEn}
        </div>
        <div className="modal-actions">
          <button type="button" className="btn primary" onClick={add}><i className="ri-add-line" /> {T.add}</button>
          <button type="button" className="btn ghost" onClick={() => setAdding(false)}>
            {lang === 'ar' ? 'إلغاء' : 'Cancel'}
          </button>
        </div>
      </Modal>

      {preview && (
        <PreviewModal
          row={preview.row}
          value={preview.value}
          lang={lang}
          onClose={() => setPreview(null)}
        />
      )}

      {schedule && (
        <ScheduleModal
          row={schedule}
          draft={scheduleDraft}
          editor={editor}
          onClose={() => setSchedule(null)}
          onDone={(message) => {
            setSchedule(null);
            flash(message);
            refreshCms();
            reload();
            loadActivity();
          }}
        />
      )}

      {history && (
        <VersionsModal
          row={history}
          editor={editor}
          onClose={() => setHistory(null)}
          onChanged={(message) => {
            flash(message);
            reload();
            loadActivity();
          }}
        />
      )}
    </>
  );
}