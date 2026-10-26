import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Order } from '@/pages/shop/types';
import { formatDateTime, formatSAR } from '@/pages/shop/lib/format';
import { useClearance } from '@/hooks/useClearance';

/* Destination-clearance request shown inside the tracking page when the
   Incoterm (CIF / FOB) makes the buyer the importer of record. The buyer is
   asked for two concrete things — upload the customs paperwork and confirm the
   destination duties were paid — and the card keeps a live progress state so
   nobody has to guess whether the shipment can be released. */
export default function ClearanceTask({ order }: { order: Order }) {
  const { t } = useTranslation();
  const { state, addDocs, removeDoc, confirmPaid } = useClearance(order.tracking);
  const inputRef = useRef<HTMLInputElement>(null);
  const [confirming, setConfirming] = useState(false);

  const required = [
    t('orders.track.clearance.reqInvoice'),
    t('orders.track.clearance.reqPacking'),
    t('orders.track.clearance.reqTransport'),
    t('orders.track.clearance.reqOrigin'),
    t('orders.track.clearance.reqImporter'),
  ];

  const hasDocs = state.docs.length > 0;
  const ready = hasDocs && state.paid;
  const remaining = (hasDocs ? 0 : 1) + (state.paid ? 0 : 1);

  const onPick = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    addDocs(Array.from(files));
  };

  return (
    <section className={`st-clear ${ready ? 'is-ready' : ''}`} aria-live="polite">
      <header className="st-clear-head">
        <span className="ic"><i className="ri-pass-valid-line" /></span>
        <div className="tx">
          <h4>{t('orders.track.clearance.title')}</h4>
          <p>{t('orders.track.clearance.sub', { id: order.id })}</p>
        </div>
        <span className={`st-clear-badge ${ready ? 'ok' : 'warn'}`}>
          {ready ? t('orders.track.clearance.ready') : t('orders.track.clearance.remaining', { steps: remaining })}
        </span>
      </header>

      <div className="st-clear-grid">
        <div className="st-clear-col">
          <h5><i className="ri-attachment-2" /> {t('orders.track.clearance.docsTitle')}</h5>
          <p className="fine">{t('orders.track.clearance.docsSub')}</p>

          <ul className="st-clear-req">
            {required.map((label) => (
              <li key={label}><i className="ri-checkbox-blank-circle-line" />{label}</li>
            ))}
          </ul>

          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            multiple
            hidden
            onChange={(e) => {
              onPick(e.target.files);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            className="st-btn ghost sm"
            onClick={() => inputRef.current?.click()}
          >
            <i className="ri-upload-cloud-2-line" /> {t('orders.track.clearance.upload')}
          </button>

          <ul className="st-clear-files">
            {state.docs.map((d) => (
              <li key={`${d.name}-${d.at}`}>
                <i className="ri-file-text-line" />
                <span className="nm" title={d.name}>{d.name}</span>
                <span className="sz">{Math.max(1, Math.round(d.size / 1024))} KB</span>
                <button
                  type="button"
                  className="rm"
                  aria-label={t('orders.track.clearance.remove')}
                  onClick={() => removeDoc(d.name)}
                >
                  <i className="ri-close-line" />
                </button>
              </li>
            ))}
            {!hasDocs && (
              <li className="empty"><i className="ri-inbox-line" /> {t('orders.track.clearance.empty')}</li>
            )}
          </ul>
        </div>

        <div className="st-clear-col fee">
          <h5><i className="ri-secure-payment-line" /> {t('orders.track.clearance.feeTitle')}</h5>
          <div className="st-clear-amount">
            <b>{formatSAR(order.customs)}</b>
            <span>{t('orders.track.clearance.feeHint')}</span>
          </div>
          <p className="fine">{t('orders.track.clearance.feeNote', { term: order.incoterm })}</p>

          {state.paid ? (
            <div className="st-clear-paid">
              <i className="ri-checkbox-circle-fill" />
              <div>
                <b>{t('orders.track.clearance.paid')}</b>
                {state.paidAt && <span>{t('orders.track.clearance.paidOn', { date: formatDateTime(state.paidAt) })}</span>}
              </div>
            </div>
          ) : confirming ? (
            <div className="st-clear-confirm">
              <p>{t('orders.track.clearance.confirmAsk')}</p>
              <div className="row">
                <button
                  type="button"
                  className="st-btn primary sm"
                  onClick={() => { confirmPaid(); setConfirming(false); }}
                >
                  <i className="ri-check-line" /> {t('orders.track.clearance.confirmYes')}
                </button>
                <button type="button" className="st-btn ghost sm" onClick={() => setConfirming(false)}>
                  {t('orders.track.clearance.cancel')}
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="st-btn primary sm" onClick={() => setConfirming(true)}>
              <i className="ri-hand-coin-line" /> {t('orders.track.clearance.confirmFee')}
            </button>
          )}

          <p className="st-clear-review">
            <i className="ri-time-line" /> {t('orders.track.clearance.review')}
          </p>
        </div>
      </div>

      <footer className="st-clear-foot">
        <i className="ri-shield-check-line" />
        <span>{t('orders.track.clearance.note')}</span>
      </footer>
    </section>
  );
}