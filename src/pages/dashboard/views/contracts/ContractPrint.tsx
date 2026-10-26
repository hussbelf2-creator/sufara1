import { useTranslation } from 'react-i18next';
import BrandMark from '@/components/feature/BrandMark';
import { duesSummary } from './types';
import type { Contract } from './types';

/* A formal, print-ready contract document. It carries the platform mark, both
   parties, the product and technical specs, the delivery terms, the clauses,
   the product images and both signature blocks. It is rendered inside the
   dedicated print overlay and is the only thing the browser prints. */
export default function ContractPrint({ contract }: { contract: Contract }) {
  const { t } = useTranslation();
  const c = contract;
  const dues = duesSummary(c);

  const signBlock = (label: string, name: string, signed: boolean) => (
    <div className="ct-doc-sign">
      <div className="role">{label}</div>
      <div className="name">{name || '—'}</div>
      <div className="line">
        {signed && <span className="sig">{name || '—'}</span>}
      </div>
      <div className="status" style={{ color: signed ? 'var(--accent-strong)' : '#8a5a12' }}>
        <i className={signed ? 'ri-checkbox-circle-line' : 'ri-time-line'} />{' '}
        {signed ? t('dashboard.contracts.docSigned') : t('dashboard.contracts.docNotSigned')}
      </div>
    </div>
  );

  return (
    <div className="ct-print-root" dir="rtl">
      <div className="ct-doc-head">
        <div className="ct-doc-brand">
          <BrandMark size={48} label={t('common.brandMark')} />
          <div>
            <div className="bt">{t('dashboard.contracts.printBrand')}</div>
            <div className="bs">{t('dashboard.contracts.printBrandSub')}</div>
          </div>
        </div>
        <div className="ct-doc-title">
          <h2>{t('dashboard.contracts.printTitle')}</h2>
          <div className="ref">{t('dashboard.contracts.docRef')}: {c.id}</div>
          <div className="ref">{t('dashboard.contracts.docIssued')}: {c.updatedAt || c.createdAt}</div>
          <div className="ref">{t('dashboard.contracts.docStatus')}: {t(`dashboard.contracts.status.${c.status}`)}</div>
        </div>
      </div>

      <div className="ct-doc-sec">
        <h4>{t('dashboard.contracts.docParties')}</h4>
        <div className="ct-doc-parties">
          <div className="ct-doc-box">
            <div className="lbl">{t('dashboard.contracts.docBuyer')}</div>
            <div className="nm">{c.buyerCompany || c.buyer || '—'}</div>
            <div className="mt">{c.buyerCountry || '—'}</div>
          </div>
          <div className="ct-doc-box">
            <div className="lbl">{t('dashboard.contracts.docFactory')}</div>
            <div className="nm">{c.factory || '—'}</div>
            <div className="mt">{c.factoryCity || '—'}</div>
          </div>
        </div>
      </div>

      <div className="ct-doc-sec">
        <h4>{t('dashboard.contracts.docProduct')}</h4>
        <table className="ct-doc-table">
          <tbody>
            <tr>
              <th>{t('dashboard.contracts.productLabel')}</th>
              <td>{c.product || '—'}</td>
              <th>{t('dashboard.contracts.quantityLabel')}</th>
              <td>{c.quantity || '—'}</td>
            </tr>
            <tr>
              <th>{t('dashboard.contracts.unitPriceLabel')}</th>
              <td>{c.unitPrice || '—'}</td>
              <th>{t('dashboard.contracts.totalLabel')}</th>
              <td>{c.total || '—'}</td>
            </tr>
            <tr>
              <th>{t('dashboard.contracts.currencyLabel')}</th>
              <td>{c.currency || '—'}</td>
              <th>{t('dashboard.contracts.paymentLabel')}</th>
              <td>{c.payment || '—'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="ct-doc-sec">
        <h4>{t('dashboard.contracts.docPeriod')}</h4>
        <table className="ct-doc-table">
          <tbody>
            <tr>
              <th>{t('dashboard.contracts.startDateLabel')}</th>
              <td>{c.startDate || '—'}</td>
              <th>{t('dashboard.contracts.endDateLabel')}</th>
              <td>{c.endDate || '—'}</td>
            </tr>
            <tr>
              <th>{t('dashboard.contracts.durationLabel')}</th>
              <td>{c.duration || '—'}</td>
              <th>{t('dashboard.contracts.docAutoRenew')}</th>
              <td>{c.autoRenew ? t('dashboard.contracts.docYes') : t('dashboard.contracts.docNo')}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {!!c.specs.length && (
        <div className="ct-doc-sec">
          <h4>{t('dashboard.contracts.docSpecs')}</h4>
          <table className="ct-doc-table">
            <thead>
              <tr>
                <th>{t('dashboard.contracts.specLabel')}</th>
                <th>{t('dashboard.contracts.specValue')}</th>
              </tr>
            </thead>
            <tbody>
              {c.specs.map((s, i) => (
                <tr key={`${s.label}-${i}`}>
                  <td>{s.label || '—'}</td>
                  <td>{s.value || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="ct-doc-sec">
        <h4>{t('dashboard.contracts.docDelivery')}</h4>
        <table className="ct-doc-table">
          <tbody>
            <tr>
              <th>{t('dashboard.contracts.incotermLabel')}</th>
              <td>{c.incoterm || '—'}</td>
              <th>{t('dashboard.contracts.portLabel')}</th>
              <td>{c.port || '—'}</td>
            </tr>
            <tr>
              <th>{t('dashboard.contracts.leadLabel')}</th>
              <td>{c.leadDays || '—'}</td>
              <th>{t('dashboard.contracts.deliveryDateLabel')}</th>
              <td>{c.deliveryDate || '—'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {!!c.obligations.length && (
        <div className="ct-doc-sec">
          <h4>{t('dashboard.contracts.docObligations')}</h4>
          <table className="ct-doc-table">
            <thead>
              <tr>
                <th>{t('dashboard.contracts.obPartyLabel')}</th>
                <th>{t('dashboard.contracts.obTextLabel')}</th>
              </tr>
            </thead>
            <tbody>
              {c.obligations.map((o, i) => (
                <tr key={i}>
                  <td>{o.party === 'buyer' ? t('dashboard.contracts.obPartyBuyer') : t('dashboard.contracts.obPartyFactory')}</td>
                  <td>{o.text || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!!c.payments.length && (
        <div className="ct-doc-sec">
          <h4>{t('dashboard.contracts.docDues')}</h4>
          <table className="ct-doc-table">
            <thead>
              <tr>
                <th>{t('dashboard.contracts.duesLabel')}</th>
                <th>{t('dashboard.contracts.duesDate')}</th>
                <th>{t('dashboard.contracts.duesAmount')}</th>
                <th>{t('dashboard.contracts.duesStatus')}</th>
              </tr>
            </thead>
            <tbody>
              {c.payments.map((r, i) => (
                <tr key={i}>
                  <td>{r.label || '—'}</td>
                  <td>{r.date || '—'}</td>
                  <td>{(Number(r.amount) || 0).toLocaleString()} {c.currency}</td>
                  <td>{t(`dashboard.contracts.duesStatus${r.status === 'paid' ? 'Paid' : r.status === 'due' ? 'Due' : 'Scheduled'}`)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="ct-doc-dues">
            <span>{t('dashboard.contracts.docPaid')}: <b>{dues.paid.toLocaleString()} {c.currency}</b></span>
            <span>{t('dashboard.contracts.docRemaining')}: <b>{dues.remaining.toLocaleString()} {c.currency}</b></span>
          </div>
        </div>
      )}

      {(!!c.penalty || !!c.notes) && (
        <div className="ct-doc-sec">
          <h4>{t('dashboard.contracts.docExtra')}</h4>
          <table className="ct-doc-table">
            <tbody>
              {!!c.penalty && (
                <tr>
                  <th>{t('dashboard.contracts.penaltyLabel')}</th>
                  <td>{c.penalty}</td>
                </tr>
              )}
              {!!c.notes && (
                <tr>
                  <th>{t('dashboard.contracts.notesLabel')}</th>
                  <td>{c.notes}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {!!c.clauses.length && (
        <div className="ct-doc-sec">
          <h4>{t('dashboard.contracts.docClauses')}</h4>
          <ol className="ct-doc-clauses">
            {c.clauses.map((cl, i) => (
              <li key={i}>{cl}</li>
            ))}
          </ol>
        </div>
      )}

      {!!c.images.length && (
        <div className="ct-doc-sec">
          <h4>{t('dashboard.contracts.docImages')}</h4>
          <div className="ct-doc-imgs">
            {c.images.map((img, i) => (
              <img key={i} src={img} alt={`${c.product} ${i + 1}`} />
            ))}
          </div>
        </div>
      )}

      <div className="ct-doc-sec">
        <h4>{t('dashboard.contracts.docSignatures')}</h4>
        <div className="ct-doc-signs">
          {signBlock(t('dashboard.contracts.docSignBuyer'), c.buyerCompany || c.buyer, c.signBuyer)}
          {signBlock(t('dashboard.contracts.docSignFactory'), c.factory, c.signFactory)}
        </div>
      </div>

      <div className="ct-doc-foot">{t('dashboard.contracts.docFooter')}</div>
    </div>
  );
}