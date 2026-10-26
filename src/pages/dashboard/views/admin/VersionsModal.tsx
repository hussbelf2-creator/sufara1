import { useEffect, useState } from 'react';
import { listVersions, saveEntry, formatWhen } from '@/pages/dashboard/lib/cmsApi';
import { refreshCms } from '@/hooks/useCms';
import { cmsText } from './cmsText';
import type { CmsEntry, CmsVersion } from './types';

type Props = {
  row: CmsEntry;
  editor: string;
  onClose: () => void;
  onChanged: (message: string) => void;
};

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

/* Every save writes a snapshot here, so this list is the entry's real past:
   who touched it, what it said, and when. Restoring re-publishes that snapshot
   and records the restore as a new version rather than deleting history. */
export default function VersionsModal({ row, editor, onClose, onChanged }: Props) {
  const T = cmsText.ar;
  const [rows, setRows] = useState<CmsVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState<number | null>(null);
  const [armId, setArmId] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await listVersions(row.id);
    setRows(res.rows);
    setError(res.error);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row.id]);

  const restore = async (version: CmsVersion) => {
    if (armId !== version.id) {
      setArmId(version.id);
      window.setTimeout(() => setArmId((cur) => (cur === version.id ? null : cur)), 4000);
      return;
    }
    setBusyId(version.id);
    const message = await saveEntry(
      row,
      {
        value: version.value,
        published: version.published,
        label_ar: version.label_ar,
        label_en: version.label_en,
        kind: version.kind,
        sort_order: version.sort_order,
      },
      editor,
      'restore',
    );
    setBusyId(null);
    setArmId(null);
    if (message) {
      onChanged(T.historyRestoreError);
      return;
    }
    refreshCms();
    onChanged(T.historyRestored);
    await load();
  };

  return (
    <div className="modal-mask" role="presentation" onClick={onClose}>
      <div
        className="modal-card cms-wide"
        role="dialog"
        aria-modal="true"
        aria-label={T.historyTitle}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cms-modal-head">
          <div>
            <h3>{T.historyTitle}</h3>
            <p className="sub">{T.historySub}</p>
          </div>
          <button type="button" className="cms-x" onClick={onClose} aria-label={T.previewClose}>
            <i className="ri-close-line" />
          </button>
        </div>

        <div className="cms-ver-key">
          <code>{row.key}</code>
          <span className="pill mute">{T.versionCount.replace('{{count}}', String(rows.length))}</span>
        </div>

        {loading ? (
          <div className="empty"><i className="ri-loader-4-line spin" /><div>{T.historyLoading}</div></div>
        ) : error ? (
          <div className="empty">
            <i className="ri-error-warning-line" />
            <div>{T.historyError}</div>
            <button type="button" className="btn sm primary" onClick={load}>
              <i className="ri-refresh-line" /> {T.retry}
            </button>
          </div>
        ) : rows.length === 0 ? (
          <div className="empty">
            <i className="ri-history-line" />
            <div>{T.historyEmpty}</div>
          </div>
        ) : (
          <div className="cms-ver-scroll">
            <ul className="cms-ver-list">
              {rows.map((version, index) => {
                const open = openId === version.id;
                return (
                  <li className={`cms-ver-item ${open ? 'is-open' : ''}`} key={version.id}>
                    <div className="cms-ver-top">
                      <span className={`cms-ver-ic ${version.action}`}>
                        <i className={ACTION_ICON[version.action] ?? 'ri-edit-2-line'} />
                      </span>
                      <div className="cms-ver-body">
                        <div className="t">
                          {ACTION_LABEL[version.action] ?? version.action}
                          {index === 0 && <span className="pill ok">{T.historyCurrent}</span>}
                          {!version.published && <span className="pill mute">{T.statusHidden}</span>}
                        </div>
                        <div className="s">
                          {version.editor || T.editorUnknown} · {formatWhen(version.created_at, 'ar')}
                        </div>
                      </div>
                      <div className="cms-ver-end">
                        <button
                          type="button"
                          className="btn sm ghost"
                          onClick={() => setOpenId(open ? null : version.id)}
                        >
                          <i className={open ? 'ri-eye-off-line' : 'ri-eye-line'} />
                          {open ? T.historyHideValue : T.historyShowValue}
                        </button>
                        {index !== 0 && (
                          <button
                            type="button"
                            className={`btn sm ${armId === version.id ? 'primary' : 'ghost'}`}
                            onClick={() => restore(version)}
                            disabled={busyId === version.id}
                          >
                            <i className={busyId === version.id ? 'ri-loader-4-line spin' : 'ri-arrow-go-back-line'} />
                            {armId === version.id ? T.historyRestoreArm : T.historyRestore}
                          </button>
                        )}
                      </div>
                    </div>
                    {open && <div className="cms-ver-value">{version.value || '—'}</div>}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={onClose}>{T.previewClose}</button>
        </div>
      </div>
    </div>
  );
}