import { useMemo, useRef, useState } from 'react';
import type { ChangeEvent, MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Stat, Pill, PageHead, Toast } from '@/pages/dashboard/components/ui';
import { statusTone, cloneContract } from './types';
import type { Contract, ContractNotice, ContractRevision, ContractRole, ContractStatus } from './types';
import { IDLE_DAYS, idleDays, isIdleContract } from './idle';
import { makeBlankContract } from './editorData';
import { downloadNodesAsPdf } from '@/pages/dashboard/lib/contractPdf';
import ContractPrint from './ContractPrint';

type Props = {
  role: ContractRole;
  contracts: Contract[];
  onSelect: (c: Contract) => void;
  onEdit: (c: Contract) => void;
  onNew: () => void;
  onImport: (c: Contract, attached?: boolean) => void;
  onRestore: (c: Contract, rev: ContractRevision) => void;
  onNotify: (c: Contract) => void;
};

const STATUSES: ContractStatus[] = ['draft', 'pending', 'active', 'rejected', 'closed'];

export default function ContractsList({
  role, contracts, onSelect, onEdit, onNew, onImport, onRestore, onNotify,
}: Props) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | ContractStatus>('all');
  const [selected, setSelected] = useState<string[]>([]);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [toast, setToast] = useState('');
  /* Small floating panel anchored to the version badge: shows the last edits
     right in the list, without opening the contract. */
  const [verPop, setVerPop] = useState<{ id: string; top: number; left: number } | null>(null);
  /* Which revision is waiting for a second click before it is restored — keeps
     an accidental single click from overwriting the live contract. */
  const [restoreId, setRestoreId] = useState<string | null>(null);
  /* The last reminder recorded on a contract. The send time lives on the
     contract itself, so the list can show it without any local state. */
  const lastNotice = (c: Contract): ContractNotice | undefined => (c.notices ?? [])[0];

  /* One hidden, print-ready node per contract, captured on demand — this is
     what lets a PDF download happen straight from the list (single or bulk). */
  const pdfRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 2400);
  };

  /* Imports a contract from a file: a .json contract is loaded straight into the
     editor; a scanned PDF/image is attached to a fresh contract ready to edit. */
  const handleImport = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const isJson = /\.json$/i.test(file.name) || file.type === 'application/json';
    if (isJson) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result ?? '')) as Partial<Contract>;
          const base = makeBlankContract();
          const merged: Contract = {
            ...base,
            ...parsed,
            specs: Array.isArray(parsed.specs) ? parsed.specs : base.specs,
            obligations: Array.isArray(parsed.obligations) ? parsed.obligations : [],
            payments: Array.isArray(parsed.payments) ? parsed.payments : [],
            clauses: Array.isArray(parsed.clauses) ? parsed.clauses : [],
            images: Array.isArray(parsed.images) ? parsed.images : [],
            attachments: Array.isArray(parsed.attachments) ? parsed.attachments : [],
            comments: Array.isArray(parsed.comments) ? parsed.comments : [],
          };
          if (!merged.product && !merged.factory && !merged.buyer) {
            flash(t('dashboard.contracts.importError'));
            return;
          }
          onImport(cloneContract(merged));
        } catch {
          flash(t('dashboard.contracts.importError'));
        }
      };
      reader.readAsText(file);
    } else {
      const blank = makeBlankContract();
      blank.attachments = [{ name: file.name, size: `${Math.max(1, Math.round(file.size / 1024))}KB` }];
      onImport(blank, true);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return contracts.filter((c) => {
      if (status !== 'all' && c.status !== status) return false;
      if (!q) return true;
      return [c.id, c.product, c.factory, c.buyer, c.buyerCompany]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [contracts, query, status]);

  const sub = role === 'buyer'
    ? t('dashboard.contracts.buyerSub')
    : role === 'factory'
      ? t('dashboard.contracts.factorySub')
      : t('dashboard.contracts.adminSub');

  const counterparty = (c: Contract) => {
    if (role === 'buyer') return `${c.factory} · ${c.factoryCity}`;
    if (role === 'factory') return `${c.buyerCompany || c.buyer} · ${c.buyerCountry}`;
    return `${c.buyerCompany || c.buyer} ↔ ${c.factory}`;
  };

  const totalCount = contracts.length;
  const pendingCount = contracts.filter((c) => c.status === 'pending').length;
  const activeCount = contracts.filter((c) => c.status === 'active').length;

  /* Contracts that have been waiting for a signature for more than 48 hours —
     the platform governance needs to see these first. */
  const overdue = contracts.filter((c) => c.status === 'pending' && (c.awaitingHours ?? 0) > 48);

  /* Contracts untouched for more than 30 days — flagged so nobody forgets them. */
  const idle = contracts.filter((c) => isIdleContract(c));

  const allChecked = filtered.length > 0 && filtered.every((c) => selected.includes(c.id));

  /* Toggles the version popover and positions it right under the badge. */
  /* Sends a reminder to the factory about an idle contract before it gets
     closed — straight from the list, no need to open the contract. */
  const notifyFactory = (c: Contract) => {
    onNotify(c);
  };

  const toggleVersions = (e: MouseEvent<HTMLButtonElement>, c: Contract) => {
    setRestoreId(null);
    if (verPop?.id === c.id) {
      setVerPop(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const width = 300;
    const left = Math.min(Math.max(12, rect.left), Math.max(12, window.innerWidth - width - 12));
    setVerPop({ id: c.id, top: rect.bottom + 8, left });
  };

  const verContract = verPop ? contracts.find((x) => x.id === verPop.id) ?? null : null;
  const verRevs = (verContract?.revisions ?? []).slice(0, 3);
  const revRole = (by: string) => (by === 'buyer'
    ? t('dashboard.contracts.roleBuyer')
    : by === 'factory'
      ? t('dashboard.contracts.roleFactory')
      : t('dashboard.contracts.roleAdmin'));

  const toggleOne = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleAll = () => {
    setSelected((prev) => {
      if (allChecked) return prev.filter((id) => !filtered.some((c) => c.id === id));
      return Array.from(new Set([...prev, ...filtered.map((c) => c.id)]));
    });
  };

  /* Download a single contract as PDF straight from the list. */
  const downloadOne = async (c: Contract) => {
    const node = pdfRefs.current[c.id];
    if (!node || pdfBusy) return;
    setPdfBusy(true);
    flash(t('dashboard.contracts.pdfGenerating'));
    const ok = await downloadNodesAsPdf([node], `${c.id}.pdf`);
    setPdfBusy(false);
    flash(ok ? t('dashboard.contracts.pdfToast') : t('dashboard.contracts.pdfFallback'));
  };

  /* Download every selected contract bundled into one PDF file. */
  const downloadSelected = async () => {
    const nodes = selected.map((id) => pdfRefs.current[id]).filter((n): n is HTMLDivElement => !!n);
    if (!nodes.length) {
      flash(t('dashboard.contracts.bulkPdfEmpty'));
      return;
    }
    if (pdfBusy) return;
    setPdfBusy(true);
    flash(t('dashboard.contracts.pdfGenerating'));
    const ok = await downloadNodesAsPdf(nodes, `contracts-${Date.now()}.pdf`);
    setPdfBusy(false);
    flash(ok ? t('dashboard.contracts.bulkPdfToast', { count: nodes.length }) : t('dashboard.contracts.pdfFallback'));
  };

  return (
    <>
      <PageHead
        eyebrow={t('dashboard.contracts.eyebrow')}
        title={t('dashboard.contracts.title')}
        sub={sub}
        actions={(
          <div className="row-between wrap" style={{ gap: 8 }}>
            <label className="btn ghost" htmlFor="ct-import">
              <i className="ri-upload-2-line" /> {t('dashboard.contracts.importContract')}
            </label>
            <input id="ct-import" className="file-input-hidden" type="file" accept=".json,application/json,.pdf,image/*" onChange={handleImport} />
            <button type="button" className="btn primary" onClick={onNew}>
              <i className="ri-file-add-line" /> {t('dashboard.contracts.newContract')}
            </button>
          </div>
        )}
      />

      {role === 'admin' && overdue.length > 0 && (
        <div className="ct-alert mb">
          <div className="ct-alert-ic"><i className="ri-alarm-warning-line" /></div>
          <div className="ct-alert-body">
            <div className="t">{t('dashboard.contracts.pendingAlertTitle')}</div>
            <div className="s">
              {t('dashboard.contracts.pendingAlertCount', { count: overdue.length })}
              {' · '}
              {t('dashboard.contracts.pendingAlertNote')}
            </div>
            <ul className="ct-alert-list">
              {overdue.map((c) => (
                <li key={c.id}>
                  <button type="button" className="ct-alert-btn" onClick={() => onSelect(c)}>
                    <i className="ri-time-line" />
                    <span>
                      {t('dashboard.contracts.pendingAlertItem', {
                        id: c.id,
                        party: c.buyerCompany || c.buyer || c.factory,
                        hours: c.awaitingHours,
                      })}
                    </span>
                    <span className="go">{t('dashboard.contracts.openContract')}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {idle.length > 0 && (
        <div className="ct-alert ct-idle mb">
          <div className="ct-alert-ic"><i className="ri-hourglass-line" /></div>
          <div className="ct-alert-body">
            <div className="t">{t('dashboard.contracts.idleAlertTitle', { days: IDLE_DAYS })}</div>
            <div className="s">{t('dashboard.contracts.idleAlertSub', { count: idle.length })}</div>
            <ul className="ct-alert-list">
              {idle.map((c) => (
                <li key={c.id} className="ct-alert-row">
                  <button type="button" className="ct-alert-btn" onClick={() => onSelect(c)}>
                    <i className="ri-hourglass-line" />
                    <span>
                      {t('dashboard.contracts.idleAlertItem', {
                        id: c.id,
                        days: idleDays(c) ?? 0,
                        time: c.updatedAt,
                      })}
                    </span>
                    <span className="go">{t('dashboard.contracts.openContract')}</span>
                  </button>
                  <button
                    type="button"
                    className={`ct-notify-btn ${lastNotice(c) ? 'is-sent' : ''}`}
                    title={lastNotice(c)
                      ? t('dashboard.contracts.notifiedAtTitle', { time: lastNotice(c)?.time })
                      : t('dashboard.contracts.notifyFactoryTitle')}
                    onClick={() => notifyFactory(c)}
                  >
                    <i className={lastNotice(c) ? 'ri-check-double-line' : 'ri-notification-3-line'} />
                    <span>{lastNotice(c) ? t('dashboard.contracts.notifyFactorySent') : t('dashboard.contracts.notifyFactory')}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="grid c4 mb">
        <Stat icon="ri-file-paper-2-line" num={String(totalCount)} lbl={t('dashboard.contracts.statTotal')} />
        <Stat icon="ri-time-line" num={String(pendingCount)} lbl={t('dashboard.contracts.statPending')} />
        <Stat icon="ri-verified-badge-line" num={String(activeCount)} lbl={t('dashboard.contracts.statActive')} />
        <Stat icon="ri-money-dollar-circle-line" num={contracts[0]?.currency ?? 'SAR'} lbl={t('dashboard.contracts.statValue')} />
      </div>

      <Card
        title={t('dashboard.contracts.listTitle')}
        sub={t('dashboard.contracts.listSub', { count: filtered.length })}
        action={(
          <div className="field" style={{ margin: 0, minWidth: 240 }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('dashboard.contracts.searchPlaceholder')}
              aria-label={t('dashboard.contracts.searchPlaceholder')}
            />
          </div>
        )}
      >
        <div className="row-between wrap mb" style={{ gap: 8 }}>
          <button
            type="button"
            className={`chip ${status === 'all' ? 'is-on' : ''}`}
            onClick={() => setStatus('all')}
          >
            {t('dashboard.contracts.filterAll')}
          </button>
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              className={`chip ${status === s ? 'is-on' : ''}`}
              onClick={() => setStatus(s)}
            >
              {t(`dashboard.contracts.status.${s}`)}
            </button>
          ))}
        </div>

        <div className="ct-bulk-bar mb">
          <span className="small muted">{t('dashboard.contracts.bulkSelectHint')}</span>
          <div className="row-between wrap" style={{ gap: 8 }}>
            <button type="button" className="btn sm ghost" onClick={toggleAll} disabled={!filtered.length}>
              <i className={allChecked ? 'ri-checkbox-multiple-line' : 'ri-checkbox-multiple-blank-line'} /> {t('dashboard.contracts.selectAll')}
            </button>
            {selected.length > 0 && <Pill tone="info">{t('dashboard.contracts.selectedCount', { count: selected.length })}</Pill>}
            <button type="button" className="btn sm ghost" onClick={() => setSelected([])} disabled={!selected.length}>
              <i className="ri-close-circle-line" /> {t('dashboard.contracts.clearSelection')}
            </button>
            <button type="button" className="btn sm primary" onClick={downloadSelected} disabled={!selected.length || pdfBusy}>
              <i className={pdfBusy ? 'ri-loader-4-line' : 'ri-file-pdf-2-line'} /> {t('dashboard.contracts.downloadSelected')}
            </button>
          </div>
        </div>

        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={toggleAll}
                    aria-label={t('dashboard.contracts.selectAll')}
                  />
                </th>
                <th>{t('dashboard.contracts.thRef')}</th>
                <th>{t('dashboard.contracts.thCounterparty')}</th>
                <th>{t('dashboard.contracts.thProduct')}</th>
                <th>{t('dashboard.contracts.thValue')}</th>
                <th>{t('dashboard.contracts.thStatus')}</th>
                <th>{t('dashboard.contracts.thUpdated')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className={`${selected.includes(c.id) ? 'sel' : ''} ${(c.revisions?.length ?? 0) > 0 ? 'is-active' : ''}`}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.includes(c.id)}
                      onChange={() => toggleOne(c.id)}
                      aria-label={`${t('dashboard.contracts.selectAll')} ${c.id}`}
                    />
                  </td>
                  <td className="strong">
                    <div className="ct-ref-cell">
                      <span>{c.id}</span>
                      <button
                        type="button"
                        className={`ct-ver-badge ${(c.revisions?.length ?? 0) > 0 ? 'has' : ''}`}
                        title={t('dashboard.contracts.versionsBadgeTitle')}
                        aria-expanded={verPop?.id === c.id}
                        onClick={(e) => toggleVersions(e, c)}
                      >
                        <i className="ri-history-line" />
                        {t('dashboard.contracts.versionsBadge', { count: c.revisions?.length ?? 0, time: c.updatedAt })}
                      </button>
                    </div>
                  </td>
                  <td>{counterparty(c)}</td>
                  <td className="muted small">{c.product}</td>
                  <td className="strong accent">{c.total}</td>
                  <td><Pill tone={statusTone(c.status)}>{t(`dashboard.contracts.status.${c.status}`)}</Pill></td>
                  <td className="muted small">
                    <div className="ct-upd-cell">
                      <span>{c.updatedAt}</span>
                      {isIdleContract(c) && (
                        <div className="ct-idle-actions">
                          <span className="ct-idle-tag" title={t('dashboard.contracts.idleTagTitle', { days: IDLE_DAYS })}>
                            <i className="ri-hourglass-line" />
                            {t('dashboard.contracts.idleTag', { days: idleDays(c) ?? 0 })}
                          </span>
                          {lastNotice(c) && (
                            <span className="ct-notice-stamp" title={t('dashboard.contracts.notifiedAtTitle', { time: lastNotice(c)?.time })}>
                              <i className="ri-notification-3-line" />
                              {lastNotice(c)?.time}
                            </span>
                          )}
                          <button
                            type="button"
                            className={`ct-idle-notify ${lastNotice(c) ? 'is-sent' : ''}`}
                            title={lastNotice(c)
                              ? t('dashboard.contracts.notifiedAtTitle', { time: lastNotice(c)?.time })
                              : t('dashboard.contracts.notifyFactoryTitle')}
                            aria-label={t('dashboard.contracts.notifyFactoryTitle')}
                            onClick={() => notifyFactory(c)}
                          >
                            <i className={lastNotice(c) ? 'ri-check-double-line' : 'ri-notification-3-line'} />
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="row-between" style={{ gap: 6 }}>
                      <button
                        type="button"
                        className="btn sm ghost"
                        onClick={() => downloadOne(c)}
                        disabled={pdfBusy}
                        aria-label={t('dashboard.contracts.pdfFromList')}
                        title={t('dashboard.contracts.pdfFromList')}
                      >
                        <i className="ri-file-pdf-2-line" />
                      </button>
                      {role === 'factory' ? (
                        <button type="button" className="btn sm primary" onClick={() => onEdit(c)}>
                          <i className="ri-edit-2-line" /> {t('dashboard.contracts.respond')}
                        </button>
                      ) : role === 'buyer' ? (
                        <button type="button" className="btn sm primary" onClick={() => onEdit(c)}>
                          <i className="ri-edit-line" /> {t('dashboard.contracts.edit')}
                        </button>
                      ) : (
                        <button type="button" className="btn sm primary" onClick={() => { onSelect(c); }}>
                          <i className="ri-eye-line" /> {t('dashboard.contracts.view')}
                        </button>
                      )}
                      {role !== 'admin' && (
                        <button type="button" className="btn sm ghost" onClick={() => onSelect(c)} aria-label={t('dashboard.contracts.view')}>
                          <i className="ri-eye-line" />
                        </button>
                      )}
                      {role === 'admin' && (
                        <button type="button" className="btn sm ghost" onClick={() => flash(t('dashboard.contracts.adminArbitrateToast'))}>
                          <i className="ri-scales-3-line" /> {t('dashboard.contracts.adminArbitrate')}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={8} className="muted" style={{ textAlign: 'center', padding: '26px' }}>
                    {t('dashboard.contracts.empty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="ct-pdf-stage" aria-hidden="true">
        {contracts.map((c) => (
          <div
            key={c.id}
            className="ct-pdf-capture"
            ref={(el) => {
              pdfRefs.current[c.id] = el;
            }}
          >
            <ContractPrint contract={c} />
          </div>
        ))}
      </div>

      <Toast message={toast} />

      {verPop && verContract && (
        <>
          <div className="ct-ver-backdrop" onClick={() => { setVerPop(null); setRestoreId(null); }} />
          <div className="ct-ver-pop" style={{ top: verPop.top, left: verPop.left }} role="dialog" aria-label={t('dashboard.contracts.versionsPopTitle')}>
            <div className="ct-ver-head">
              <div>
                <div className="t">{t('dashboard.contracts.versionsPopTitle')}</div>
                <div className="s">{t('dashboard.contracts.versionsPopSub', { count: verContract.revisions?.length ?? 0 })}</div>
              </div>
              <button type="button" className="ct-x" onClick={() => setVerPop(null)} aria-label={t('dashboard.common.close')}>
                <i className="ri-close-line" />
              </button>
            </div>
            {verRevs.length > 0 ? (
              <ul className="ct-ver-list">
                {verRevs.map((r) => (
                  <li key={r.id}>
                    <span className="ct-ver-dot" />
                    <div className="body">
                      <div className="t">{r.time}</div>
                      <div className="s">
                        {t('dashboard.contracts.versionsBy')} {revRole(r.by)}
                        {r.note ? ` · ${r.note}` : ''}
                      </div>
                    </div>
                    {/* Restores this exact version straight from the list. The
                        first click arms it, the second click applies it. */}
                    <button
                      type="button"
                      className={`ct-ver-restore ${restoreId === r.id ? 'is-arm' : ''}`}
                      title={t('dashboard.contracts.versionsRestore')}
                      onClick={() => {
                        if (restoreId !== r.id) {
                          setRestoreId(r.id);
                          return;
                        }
                        setRestoreId(null);
                        setVerPop(null);
                        onRestore(verContract, r);
                      }}
                    >
                      <i className={restoreId === r.id ? 'ri-check-line' : 'ri-arrow-go-back-line'} />
                      {restoreId === r.id
                        ? t('dashboard.contracts.restoreConfirm')
                        : t('dashboard.contracts.restoreShort')}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="small muted" style={{ margin: '4px 0 0' }}>{t('dashboard.contracts.versionsPopEmpty')}</p>
            )}
            <div className="ct-ver-foot">
              <span className="small muted">{verContract.id}</span>
              <button
                type="button"
                className="btn sm ghost"
                onClick={() => {
                  setVerPop(null);
                  onSelect(verContract);
                }}
              >
                <i className="ri-history-line" /> {t('dashboard.contracts.versionsPopAll')}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}