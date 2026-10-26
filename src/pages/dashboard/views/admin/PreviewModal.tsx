import { cmsText } from './cmsText';
import type { CmsEntry, CmsLang } from './types';

type Props = {
  row: CmsEntry;
  value: string;
  lang: CmsLang;
  onClose: () => void;
};

/* A browser-shaped preview of the line as a visitor would read it.
   Deliberately not a live copy of the page: it shows the exact copy block the
   entry controls, side by side with what is live right now, so the admin can
   judge the wording before publishing. */
export default function PreviewModal({ row, value, lang, onClose }: Props) {
  const T = cmsText.ar;
  const rtl = lang === 'ar';
  const isHeading = row.kind === 'text'
    && /(title|heading|head|badge|eyebrow|tag)/i.test(row.key);
  const changed = value !== row.value;
  const label = (rtl ? row.label_ar : row.label_en) || row.key;

  return (
    <div className="modal-mask cms-preview-mask" role="presentation" onClick={onClose}>
      <div
        className="modal-card cms-wide"
        role="dialog"
        aria-modal="true"
        aria-label={T.previewTitle}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cms-modal-head">
          <div>
            <h3>{T.previewTitle}</h3>
            <p className="sub">{T.previewSub}</p>
          </div>
          <button type="button" className="cms-x" onClick={onClose} aria-label={T.previewClose}>
            <i className="ri-close-line" />
          </button>
        </div>

        <div className="cms-browser" dir={rtl ? 'rtl' : 'ltr'}>
          <div className="cms-browser-bar">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
            <span className="cms-browser-url">
              <i className="ri-lock-2-line" />
              {rtl ? 'safeer.sa/ar' : 'safeer.sa/en'}
            </span>
            <span className="cms-browser-lang">{rtl ? 'AR' : 'EN'}</span>
          </div>

          <div className="cms-browser-body">
            <div className="cms-browser-kicker">{label}</div>
            <div className={`cms-preview-copy ${isHeading ? 'is-heading' : ''}`}>{value || '—'}</div>
            <div className="cms-preview-pagehint">
              <i className="ri-layout-2-line" />
              {row.page_key} · {row.area}
            </div>
          </div>
        </div>

        <div className="cms-preview-compare">
          <div className="cms-preview-col">
            <div className="cms-preview-colhead">
              <span className="tag draft">{T.previewDraft}</span>
              <span className={`pill ${row.published ? 'ok' : 'mute'}`}>
                {row.published ? T.previewVisible : T.previewHidden}
              </span>
            </div>
            <div className="cms-preview-mini">{value || '—'}</div>
          </div>
          <div className="cms-preview-col">
            <div className="cms-preview-colhead">
              <span className="tag live">{T.previewLive}</span>
              <span className={`pill ${row.published ? 'ok' : 'mute'}`}>
                {row.published ? T.previewVisible : T.previewHidden}
              </span>
            </div>
            <div className="cms-preview-mini muted">{row.value || '—'}</div>
          </div>
        </div>

        {!changed && <div className="small muted cms-preview-same">{T.previewNote}</div>}

        <div className="modal-actions">
          <button type="button" className="btn primary" onClick={onClose}>
            <i className="ri-check-line" /> {T.previewClose}
          </button>
        </div>
      </div>
    </div>
  );
}