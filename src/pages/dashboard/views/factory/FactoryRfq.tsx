import { useState } from 'react';
import type { FunctionComponent } from 'react';
import { useTranslation } from 'react-i18next';
import { useDashboard } from '@/hooks/useDashboard';
import { downloadCsv } from '@/pages/dashboard/lib/csv';
import { useFactoryOps, formatWhen } from '@/pages/dashboard/lib/factoryStore';
import {
  Card, Pill, PageHead, Modal, Toast,
} from '@/pages/dashboard/components/ui';

/* A single quote-request row (buyer/product/etc). Kept local so the submit
   modal can carry the buyer + product through from the table. */
interface RfqRow {
  buyer: string;
  product: string;
  qty: string;
  country: string;
  delivery: string;
  deadline: string;
  competitors: number;
}

/* --------------------------------------------------------------- rfq */

function FactoryRfq() {
  const { t, i18n } = useTranslation();
  const d = useDashboard();
  const ops = useFactoryOps();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<RfqRow | null>(null);
  const [compareBuyer, setCompareBuyer] = useState<string | null>(null);
  const [price, setPrice] = useState('');
  const [lead, setLead] = useState('');
  const [terms, setTerms] = useState(() => t('dashboard.factory.rfq.termsOption1'));
  const [toast, setToast] = useState('');
  const flash = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(''), 2000); };

  const exportCsv = () => {
    downloadCsv(
      'factory-rfq.csv',
      [
        t('dashboard.factory.rfq.thBuyer'),
        t('dashboard.factory.rfq.thProduct'),
        t('dashboard.factory.rfq.thQty'),
        t('dashboard.factory.rfq.thCountry'),
        t('dashboard.factory.rfq.thDelivery'),
        t('dashboard.factory.rfq.thDeadline'),
        t('dashboard.factory.rfq.thCompetitors'),
      ],
      d.factoryRfqList.map((r) => [r.buyer, r.product, r.qty, r.country, r.delivery, r.deadline, String(r.competitors)]),
    );
    flash(t('dashboard.common.exportedFile', { file: 'factory-rfq.csv' }));
  };

  const openSubmit = (row: RfqRow) => {
    setActive(row);
    setPrice('');
    setLead('');
    setTerms(t('dashboard.factory.rfq.termsOption1'));
    setOpen(true);
  };

  const send = () => {
    if (!price.trim()) { flash(t('dashboard.factory.rfq.priceRequired')); return; }
    if (active) {
      ops.addRfqResponse({
        buyer: active.buyer,
        product: active.product,
        price: `${price.trim()} ${t('dashboard.charts.currency')}`,
        lead: lead.trim() || '—',
        terms,
      });
    }
    setOpen(false);
    setActive(null);
    flash(t('dashboard.factory.rfq.offerSubmittedToast'));
  };

  const compareOffers = compareBuyer ? (d.factoryRfqOffers.find((o) => o.buyer === compareBuyer)?.offers ?? []) : [];
  const bestPrice = compareOffers.length ? Math.min(...compareOffers.map((o) => Number(o.price))) : 0;

  /* Merges the seeded reply history with the offers submitted in this browser,
     newest first. */
  const liveHistory = ops.rfqResponses.map((r) => ({
    id: r.id,
    buyer: r.buyer,
    product: r.product,
    price: r.price,
    lead: r.lead,
    at: formatWhen(r.at, i18n.language),
    status: t('dashboard.factory.rfq.statusSubmitted'),
    tone: 'warn',
  }));
  const history = [...liveHistory, ...d.factoryRfqHistory];

  return (
    <>
      <PageHead
        eyebrow={t('dashboard.factory.eyebrow')}
        title={t('dashboard.factory.rfq.title')}
        sub={t('dashboard.factory.rfq.sub')}
        actions={<button type="button" className="btn ghost" onClick={exportCsv}><i className="ri-download-2-line" /> {t('dashboard.common.export')}</button>}
      />

      <Card className="mb">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>{t('dashboard.factory.rfq.thBuyer')}</th>
                <th>{t('dashboard.factory.rfq.thProduct')}</th>
                <th>{t('dashboard.factory.rfq.thQty')}</th>
                <th>{t('dashboard.factory.rfq.thCountry')}</th>
                <th>{t('dashboard.factory.rfq.thDelivery')}</th>
                <th>{t('dashboard.factory.rfq.thDeadline')}</th>
                <th>{t('dashboard.factory.rfq.thCompetitors')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {d.factoryRfqList.map((r) => (
                <tr key={r.buyer}>
                  <td className="strong">{r.buyer}</td>
                  <td className="muted small">{r.product}</td>
                  <td className="strong">{r.qty}</td>
                  <td>{r.country}</td>
                  <td className="muted small">{r.delivery}</td>
                  <td><Pill tone="warn">{r.deadline}</Pill></td>
                  <td className="strong">{r.competitors}</td>
                  <td>
                    <div className="row-between" style={{ gap: 6 }}>
                      <button type="button" className="btn sm ghost" aria-label={t('dashboard.factory.rfq.compare')} onClick={() => setCompareBuyer(r.buyer)}><i className="ri-scales-3-line" /> {t('dashboard.factory.rfq.compare')}</button>
                      <button type="button" className="btn sm primary" aria-label={t('dashboard.factory.rfq.respond')} onClick={() => openSubmit(r)}><i className="ri-send-plane-line" /> {t('dashboard.factory.rfq.respond')}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title={t('dashboard.factory.rfq.historyTitle')} sub={t('dashboard.factory.rfq.historySub')}>
        {history.length === 0 ? (
          <div className="note"><i className="ri-information-line" /><span>{t('dashboard.factory.rfq.historyEmpty')}</span></div>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>{t('dashboard.factory.rfq.thBuyer')}</th>
                  <th>{t('dashboard.factory.rfq.thYourPrice')}</th>
                  <th>{t('dashboard.factory.rfq.thLead')}</th>
                  <th>{t('dashboard.factory.rfq.thDate')}</th>
                  <th>{t('dashboard.factory.rfq.thStatus')}</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={`${h.buyer}-${h.product}-${h.at}`}>
                    <td className="tbl-name"><div><div className="t">{h.buyer}</div><div className="s">{h.product}</div></div></td>
                    <td className="strong accent">{h.price}</td>
                    <td className="muted small">{h.lead}</td>
                    <td className="muted small">{h.at}</td>
                    <td><Pill tone={h.tone}>{h.status}</Pill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={t('dashboard.factory.rfq.modalTitle')} sub={active ? `${active.buyer} · ${active.qty}` : t('dashboard.factory.rfq.modalSub')}>
        <div className="field">
          <label htmlFor="r-price">{t('dashboard.factory.rfq.priceLabel')}</label>
          <input id="r-price" value={price} onChange={(e) => setPrice(e.target.value)} placeholder={t('dashboard.factory.rfq.pricePlaceholder')} />
        </div>
        <div className="field">
          <label htmlFor="r-lead">{t('dashboard.factory.rfq.leadLabel')}</label>
          <input id="r-lead" value={lead} onChange={(e) => setLead(e.target.value)} placeholder={t('dashboard.factory.rfq.leadPlaceholder')} />
        </div>
        <div className="field">
          <label htmlFor="r-terms">{t('dashboard.factory.rfq.termsLabel')}</label>
          <select id="r-terms" value={terms} onChange={(e) => setTerms(e.target.value)}>
            <option value={t('dashboard.factory.rfq.termsOption1')}>{t('dashboard.factory.rfq.termsOption1')}</option>
            <option value={t('dashboard.factory.rfq.termsOption2')}>{t('dashboard.factory.rfq.termsOption2')}</option>
            <option value={t('dashboard.factory.rfq.termsOption3')}>{t('dashboard.factory.rfq.termsOption3')}</option>
          </select>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn primary" onClick={send}>{t('dashboard.factory.rfq.send')}</button>
          <button type="button" className="btn ghost" onClick={() => setOpen(false)}>{t('dashboard.common.cancel')}</button>
        </div>
      </Modal>

      <Modal open={!!compareBuyer} onClose={() => setCompareBuyer(null)} title={t('dashboard.factory.rfq.compareTitle')} sub={t('dashboard.factory.rfq.compareSub')}>
        {compareOffers.length === 0 ? (
          <div className="note"><i className="ri-information-line" /><span>{t('dashboard.factory.rfq.historyEmpty')}</span></div>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>{t('dashboard.factory.rfq.thSupplier')}</th>
                  <th>{t('dashboard.factory.rfq.thPrice')}</th>
                  <th>{t('dashboard.factory.rfq.thLead')}</th>
                  <th>{t('dashboard.factory.rfq.thTerms')}</th>
                  <th>{t('dashboard.factory.rfq.thRating')}</th>
                </tr>
              </thead>
              <tbody>
                {compareOffers.map((o) => (
                  <tr key={o.supplier} className={o.mine ? 'sel' : ''}>
                    <td className="strong">
                      {o.supplier}
                      {o.mine && <Pill tone="info">{t('dashboard.factory.rfq.youBadge')}</Pill>}
                    </td>
                    <td className="strong accent">
                      {o.price}
                      {Number(o.price) === bestPrice && <Pill tone="ok">{t('dashboard.factory.rfq.bestBadge')}</Pill>}
                    </td>
                    <td className="muted small">{o.lead}</td>
                    <td className="muted small">{o.terms}</td>
                    <td className="strong"><i className="ri-star-fill" style={{ color: 'var(--accent2)' }} /> {o.rating}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={() => setCompareBuyer(null)}>{t('dashboard.common.close')}</button>
        </div>
      </Modal>

      <Toast message={toast} />
    </>
  );
}

export const factoryRfqViews: Record<string, FunctionComponent> = {
  'f-rfq': FactoryRfq,
};