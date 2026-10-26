import { useEffect, useState } from 'react';
import { Switch } from '@/pages/dashboard/components/ui';
import { formatWhen } from '@/pages/dashboard/lib/cmsApi';
import { cmsText } from './cmsText';
import type { CmsEntry, CmsLang } from './types';

type Props = {
  row: CmsEntry;
  lang: CmsLang;
  saving: boolean;
  confirming: boolean;
  onSaveValue: (row: CmsEntry, value: string) => void;
  onTogglePublish: (row: CmsEntry, next: boolean) => void;
  onDelete: (row: CmsEntry) => void;
  onPreview: (row: CmsEntry, value: string) => void;
  onSchedule: (row: CmsEntry, value: string) => void;
  onHistory: (row: CmsEntry) => void;
};

/* One editable content line. Its tools sit in a single compact rail so the
   copy itself stays the loudest thing in the row. */
export default function ContentRow({
  row, lang, saving, confirming,
  onSaveValue, onTogglePublish, onDelete, onPreview, onSchedule, onHistory,
}: Props) {
  const T = cmsText.ar;
  const [value, setValue] = useState(row.value);

  useEffect(() => {
    setValue(row.value);
  }, [row.value]);

  const dirty = value !== row.value;
  const scheduled = Boolean(row.scheduled_at);
  const label = (lang === 'ar' ? row.label_ar : row.label_en) || row.key;

  return (
    <div className={`cms-row ${row.published ? '' : 'is-off'}`}>
      <div className="cms-row-head">
        <div className="cms-row-label">
          <span className="cms-row-title">{label}</span>
          <code>{row.key}</code>
        </div>
        <div className="cms-row-tools">
          {scheduled && (
            <span className="cms-sched-pill" title={row.scheduled_editor ?? ''}>
              <i className="ri-time-line" />
              {T.scheduledBadge} · {formatWhen(row.scheduled_at, 'ar')}
            </span>
          )}
          <button type="button" className="cms-tool" title={T.preview} onClick={() => onPreview(row, value)}>
            <i className="ri-eye-line" />
          </button>
          <button type="button" className="cms-tool" title={T.schedule} onClick={() => onSchedule(row, value)}>
            <i className="ri-calendar-schedule-line" />
          </button>
          <button type="button" className="cms-tool" title={T.history} onClick={() => onHistory(row)}>
            <i className="ri-history-line" />
          </button>
          <button
            type="button"
            className={`cms-tool ${confirming ? 'is-danger' : ''}`}
            title={T.delete}
            onClick={() => onDelete(row)}
          >
            <i className={confirming ? 'ri-alert-line' : 'ri-delete-bin-6-line'} />
          </button>
        </div>
      </div>

      {row.kind === 'textarea' ? (
        <textarea
          className="cms-input"
          rows={3}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      ) : (
        <input
          className="cms-input"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      )}

      <div className="cms-row-foot">
        <div className="cms-row-meta">
          <Switch
            checked={row.published}
            label={row.published ? T.publish : T.draft}
            onChange={(next) => onTogglePublish(row, next)}
          />
          <span className="cms-row-editor">
            {T.lastEditedBy}: {row.last_editor || T.editorUnknown}
            {row.updated_at ? ` · ${formatWhen(row.updated_at, 'ar')}` : ''}
          </span>
        </div>
        <button
          type="button"
          className="btn sm primary"
          disabled={!dirty || saving}
          onClick={() => onSaveValue(row, value)}
        >
          <i className={saving ? 'ri-loader-4-line spin' : 'ri-save-3-line'} /> {T.save}
        </button>
      </div>
    </div>
  );
}