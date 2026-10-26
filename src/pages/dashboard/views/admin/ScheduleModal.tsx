import { useState } from 'react';
import { scheduleEntry, clearSchedule, localToIso, toLocalInput, formatWhen } from '@/pages/dashboard/lib/cmsApi';
import { cmsText } from './cmsText';
import type { CmsEntry } from './types';

type Props = {
  row: CmsEntry;
  draft: string;
  editor: string;
  onClose: () => void;
  onDone: (message: string) => void;
};

/* Auto-publish scheduling: the future copy is stored beside the live copy, so
   the site keeps showing today's wording until the chosen minute arrives. */
export default function ScheduleModal({ row, draft, editor, onClose, onDone }: Props) {
  const T = cmsText.ar;
  const [at, setAt] = useState(toLocalInput(row.scheduled_at) || '');
  const [value, setValue] = useState(row.scheduled_value ?? draft ?? row.value);
  const [published, setPublished] = useState(row.scheduled_published ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const hasSchedule = Boolean(row.scheduled_at);

  const submit = async () => {
    setError('');
    if (!at) {
      setError(T.scheduleNeedDate);
      return;
    }
    const iso = localToIso(at);
    if (!iso || new Date(iso).getTime() <= Date.now() - 60_000) {
      setError(T.schedulePast);
      return;
    }
    setBusy(true);
    try {
      const message = await scheduleEntry(row, editor, iso, value, published);
      if (message) {
        setError(T.scheduleError);
        return;
      }
      onDone(T.scheduleSaved);
    } catch {
      setError(T.scheduleError);
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    setBusy(true);
    try {
      const message = await clearSchedule(row, editor);
      if (message) {
        setError(T.scheduleError);
        return;
      }
      onDone(T.scheduleCleared);
    } catch {
      setError(T.scheduleError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-mask" role="presentation" onClick={onClose}>
      <div
        className="modal-card cms-wide"
        role="dialog"
        aria-modal="true"
        aria-label={T.scheduleTitle}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cms-modal-head">
          <div>
            <h3>{T.scheduleTitle}</h3>
            <p className="sub">{T.scheduleSub}</p>
          </div>
          <button type="button" className="cms-x" onClick={onClose} aria-label={T.previewClose}>
            <i className="ri-close-line" />
          </button>
        </div>

        {hasSchedule && (
          <div className="cms-sched-note">
            <i className="ri-calendar-check-line" />
            <span>
              {T.scheduledFor}: <strong>{formatWhen(row.scheduled_at, 'ar')}</strong>
              {row.scheduled_editor ? ` · ${T.scheduledBy} ${row.scheduled_editor}` : ''}
            </span>
          </div>
        )}

        <div className="cms-sched-grid">
          <div className="field">
            <label htmlFor="sch-at">{T.scheduleAt}</label>
            <input
              id="sch-at"
              type="datetime-local"
              dir="ltr"
              value={at}
              onChange={(e) => setAt(e.target.value)}
            />
            <div className="small muted" style={{ marginTop: 5 }}>{T.scheduleHint}</div>
          </div>
          <div className="field">
            <label htmlFor="sch-state">{T.scheduleState}</label>
            <select
              id="sch-state"
              value={published ? 'published' : 'hidden'}
              onChange={(e) => setPublished(e.target.value === 'published')}
            >
              <option value="published">{T.schedulePublish}</option>
              <option value="hidden">{T.scheduleHide}</option>
            </select>
          </div>
        </div>

        <div className="field">
          <label htmlFor="sch-value">{T.scheduleValue}</label>
          <textarea
            id="sch-value"
            rows={4}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>

        {error && (
          <div className="cms-inline-error">
            <i className="ri-error-warning-line" />
            <span>{error}</span>
          </div>
        )}

        <div className="modal-actions cms-modal-actions">
          <button type="button" className="btn primary" onClick={submit} disabled={busy}>
            <i className={busy ? 'ri-loader-4-line spin' : 'ri-time-line'} />
            {hasSchedule ? T.scheduleUpdate : T.scheduleSave}
          </button>
          {hasSchedule && (
            <button type="button" className="btn ghost" onClick={cancel} disabled={busy}>
              <i className="ri-close-circle-line" /> {T.scheduleClear}
            </button>
          )}
          <button type="button" className="btn ghost" onClick={onClose}>
            {T.previewClose}
          </button>
        </div>
      </div>
    </div>
  );
}