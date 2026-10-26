import { useState } from 'react';
import type { FunctionComponent } from 'react';
import { useTranslation } from 'react-i18next';
import { downloadCsv } from '@/pages/dashboard/lib/csv';
import { useFactoryOps, formatWhen } from '@/pages/dashboard/lib/factoryStore';
import type { AuditEntry, AuditKind } from '@/pages/dashboard/lib/factoryStore';
import {
  Card, Pill, PageHead, Toast,
} from '@/pages/dashboard/components/ui';

/* The factory audit log. Every product edit, product status change and deal
   stage move the owner performs is recorded with the acting user and the exact
   time, so any change can be traced back to who made it and when. */
function FactoryAudit() {
  const { t, i18n } = useTranslation();
  const ops = useFactoryOps();
  const [toast, setToast] = useState('');
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<'all' | AuditKind>('all');
  const flash = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(''), 2000); };

  /* Turns a stored value into readable text: status and deal-stage values are
     keys that get localised, product values are shown as they were saved. */
  const valueText = (e: AuditEntry): string => {
    if (e.action === 'productStatus') return t(`dashboard.factory.status.${e.value}`);
    if (e.action === 'dealStage') return t(`dashboard.factory.deals.stage.${e.value}`);
    return e.value || '—';
  };
  const actorText = (e: AuditEntry): string => e.actor || t('dashboard.factory.audit.actorSystem');

  const rows = ops.audit;
  const kindTone = (k: AuditKind) => (k === 'deal' ? 'info' : 'ok');
  const hasFilters = query.trim() !== '' || kind !== 'all';

  const filtered = rows.filter((e) => {
    if (kind !== 'all' && e.kind !== kind) return false;
    const q = query.trim().toLowerCase();
    if (q) {
      return e.ref.toLowerCase().includes(q) || actorText(e).toLowerCase().includes(q);
    }
    return true;
  });

  const exportCsv = () => {
    downloadCsv(
      'factory-audit-log.csv',
      [
        t('dashboard.factory.audit.thTime'),
        t('dashboard.factory.audit.thKind'),
        t('dashboard.factory.audit.thEntry'),
        t('dashboard.factory.audit.thActor'),
        t('dashboard.factory.audit.thValue'),
      ],
      filtered.map((e) => [
        formatWhen(e.at, i18n.language),
        t(`dashboard.factory.audit.kind.${e.kind}`),
        t(`dashboard.factory.audit.actions.${e.action}`),
        actorText(e),
        valueText(e),
      ]),
    );
    flash(t('dashboard.factory.audit.exportToast'));
  };

  return (
    <>
      <PageHead
        eyebrow={t('dashboard.factory.eyebrow')}
        title={t('dashboard.factory.audit.title')}
        sub={t('dashboard.factory.audit.sub')}
        actions={<button type="button" className="btn ghost" onClick={exportCsv}><i className="ri-download-2-line" /> {t('dashboard.factory.audit.export')}</button>}
      />

      <Card>
        <div className="audit-bar">
          <div className="fld grow">
            <i className="ri-search-line" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('dashboard.factory.audit.searchPlaceholder')} aria-label={t('dashboard.factory.audit.searchPlaceholder')} />
          </div>
          <select value={kind} onChange={(e) => setKind(e.target.value as 'all' | AuditKind)} aria-label={t('dashboard.factory.audit.thKind')}>
            <option value="all">{t('dashboard.factory.audit.filterAll')}</option>
            <option value="product">{t('dashboard.factory.audit.kind.product')}</option>
            <option value="deal">{t('dashboard.factory.audit.kind.deal')}</option>
          </select>
          {hasFilters && (
            <button type="button" className="btn sm ghost" onClick={() => { setQuery(''); setKind('all'); }}>
              <i className="ri-close-line" /> {t('dashboard.factory.audit.clearFilters')}
            </button>
          )}
          <span className="small muted audit-count">{t('dashboard.factory.audit.count', { count: filtered.length, total: rows.length })}</span>
        </div>

        {filtered.length === 0 ? (
          <div className="empty"><i className="ri-history-line" /><div>{rows.length === 0 ? t('dashboard.factory.audit.empty') : t('dashboard.factory.audit.noResults')}</div></div>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>{t('dashboard.factory.audit.thEntry')}</th>
                  <th>{t('dashboard.factory.audit.thKind')}</th>
                  <th>{t('dashboard.factory.audit.thValue')}</th>
                  <th>{t('dashboard.factory.audit.thActor')}</th>
                  <th>{t('dashboard.factory.audit.thTime')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <div className="tbl-name">
                        <div className={`audit-dot ${e.kind}`}><i className={e.kind === 'deal' ? 'ri-hand-coin-line' : 'ri-shopping-bag-3-line'} /></div>
                        <div>
                          <div className="t">{t(`dashboard.factory.audit.actions.${e.action}`)}</div>
                          <div className="s">{e.ref}</div>
                        </div>
                      </div>
                    </td>
                    <td><Pill tone={kindTone(e.kind)}>{t(`dashboard.factory.audit.kind.${e.kind}`)}</Pill></td>
                    <td className="strong">{valueText(e)}</td>
                    <td className="muted small">{actorText(e)}</td>
                    <td className="muted small">{formatWhen(e.at, i18n.language)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Toast message={toast} />
    </>
  );
}

export const factoryAuditViews: Record<string, FunctionComponent> = {
  'f-audit': FactoryAudit,
};