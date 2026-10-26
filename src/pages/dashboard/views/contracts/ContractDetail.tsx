import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Pill, PageHead, Toast } from '@/pages/dashboard/components/ui';
import { cloneContract, statusTone, duesSummary, CONTRACT_STAGES, stageIndex } from './types';
import type { Contract, ContractRevision, ContractRole } from './types';
import { downloadNodeAsPdf } from '@/pages/dashboard/lib/contractPdf';
import { downloadFile } from '@/pages/dashboard/lib/download';
import ContractPrint from './ContractPrint';
import ContractVersions from './ContractVersions';

type Props = {
  role: ContractRole;
  contract: Contract;
  onBack: () => void;
  onEdit: () => void;
  onUpdate: (c: Contract) => void;
  onCommit: (c: Contract, note?: string) => void;
};

export default function ContractDetail({
  role, contract, onBack, onEdit, onUpdate, onCommit,
}: Props) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState('');
  const [toast, setToast] = useState('');
  const [printPreview, setPrintPreview] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);
  const dues = duesSummary(contract);
  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 2400);
  };

  const downloadPdf = async () => {
    if (pdfBusy || !pdfRef.current) return;
    setPdfBusy(true);
    flash(t('dashboard.contracts.pdfGenerating'));
    const ok = await downloadNodeAsPdf(pdfRef.current, `${contract.id}.pdf`);
    setPdfBusy(false);
    if (ok) flash(t('dashboard.contracts.pdfToast'));
    else {
      setPrintPreview(true);
      flash(t('dashboard.contracts.pdfFallback'));
    }
  };

  const exportData = () => {
    downloadFile(`${contract.id}.json`, JSON.stringify(contract, null, 2), 'application/json');
    flash(t('dashboard.contracts.exportDataToast'));
  };

  const canSign = (role === 'buyer' && !contract.signBuyer)
    || (role === 'factory' && !contract.signFactory);

  const sign = () => {
    const next = cloneContract(contract);
    if (role === 'buyer') next.signBuyer = true;
    if (role === 'factory') next.signFactory = true;
    next.status = next.signBuyer && next.signFactory ? 'active' : 'pending';
    if (next.status === 'active' && stageIndex(next.stage) < stageIndex('supply')) {
      next.stage = 'supply';
    }
    onCommit(next, t('dashboard.contracts.signToast'));
    flash(t('dashboard.contracts.signToast'));
  };

  const setStatus = (s: Contract['status'], msg: string) => {
    const next = cloneContract(contract);
    next.status = s;
    onCommit(next, msg);
    flash(msg);
  };

  const current = stageIndex(contract.stage);
  const canAdvance = (role === 'admin' || role === 'factory')
    && current < CONTRACT_STAGES.length - 1;

  const advanceStage = () => {
    const next = cloneContract(contract);
    next.stage = CONTRACT_STAGES[Math.min(current + 1, CONTRACT_STAGES.length - 1)];
    onCommit(next, t('dashboard.contracts.advanceToast'));
    flash(t('dashboard.contracts.advanceToast'));
  };

  /* Restores an earlier version: its fields come back, but the full version
     history is kept so nothing is ever lost — and the restore itself becomes
     a new version via onCommit. */
  const restoreVersion = (rev: ContractRevision) => {
    const next = cloneContract(rev.data);
    next.revisions = contract.revisions ?? [];
    onCommit(next, t('dashboard.contracts.versionsRestoredNote'));
    flash(t('dashboard.contracts.versionsRestoredToast'));
  };

  /* Reminders sent to the factory, newest first, each with its exact send
     time — the log is stored on the contract itself. */
  const notices = contract.notices ?? [];
  const noticeRole = (by: ContractRevision['by']) => (by === 'buyer'
    ? t('dashboard.contracts.roleBuyer')
    : by === 'factory'
      ? t('dashboard.contracts.roleFactory')
      : t('dashboard.contracts.roleAdmin'));

  const sendNotice = () => {
    const stamp = t('dashboard.common.now');
    const next = cloneContract(contract);
    next.notices = [
      {
        id: `NT-${Date.now().toString().slice(-7)}`,
        time: stamp,
        by: role,
        note: t('dashboard.contracts.noticeSentNote'),
      },
      ...(next.notices ?? []),
    ].slice(0, 20);
    onCommit(next, t('dashboard.contracts.noticeRevisionNote', { time: stamp }));
    flash(t('dashboard.contracts.noticeSentToast', { time: stamp }));
  };

  const addComment = () => {
    if (!draft.trim()) return;
    const next = cloneContract(contract);
    next.comments.push({
      by: role,
      name: role === 'buyer' ? t('dashboard.contracts.roleBuyer') : role === 'factory' ? t('dashboard.contracts.roleFactory') : t('dashboard.contracts.roleAdmin'),
      text: draft.trim(),
      time: t('dashboard.common.now'),
    });
    onUpdate(next);
    setDraft('');
    flash(t('dashboard.contracts.commentToast'));
  };

  const sigPill = (signed: boolean) => (
    <Pill tone={signed ? 'ok' : 'mute'}>
      <i className={signed ? 'ri-checkbox-circle-line' : 'ri-checkbox-blank-circle-line'} />
      {signed ? t('dashboard.contracts.signed') : t('dashboard.contracts.notSigned')}
    </Pill>
  );

  return (
    <>
      <PageHead
        eyebrow={t('dashboard.contracts.eyebrow')}
        title={`${t('dashboard.contracts.detailTitle')} · ${contract.id}`}
        sub={contract.product}
        actions={(
          <>
            <button type="button" className="btn ghost" onClick={onBack}>
              <i className="ri-arrow-right-line" /> {t('dashboard.contracts.backToList')}
            </button>
            <button type="button" className="btn ghost" onClick={onEdit}>
              <i className="ri-edit-line" /> {t('dashboard.contracts.edit')}
            </button>
          </>
        )}
      />

      <div className="row-between wrap mb" style={{ gap: 10 }}>
        <div className="row-between wrap" style={{ gap: 8 }}>
          <Pill tone={statusTone(contract.status)}>{t(`dashboard.contracts.status.${contract.status}`)}</Pill>
          <span className="small muted">{t('dashboard.contracts.thUpdated')}: {contract.updatedAt}</span>
        </div>
        <div className="row-between wrap" style={{ gap: 8 }}>
          <span className="small muted">{t('dashboard.contracts.signedByBuyer')}</span>
          {sigPill(contract.signBuyer)}
          <span className="small muted">{t('dashboard.contracts.signedByFactory')}</span>
          {sigPill(contract.signFactory)}
        </div>
      </div>

      <Card
        title={t('dashboard.contracts.timelineTitle')}
        sub={t('dashboard.contracts.timelineSub')}
        className="mb"
        action={canAdvance ? (
          <button type="button" className="btn sm ghost" onClick={advanceStage}>
            <i className="ri-arrow-down-double-line" /> {t('dashboard.contracts.advance')}
          </button>
        ) : undefined}
      >
        <div className="ct-timeline">
          {CONTRACT_STAGES.map((s, i) => {
            const done = i <= current;
            return (
              <div key={s} className={`ct-step ${done ? 'is-done' : ''} ${i === current ? 'is-now' : ''}`}>
                <div className="ct-dot">{done ? <i className="ri-check-line" /> : <span>{i + 1}</span>}</div>
                <div className="ct-step-label">{t(`dashboard.contracts.stage.${s}`)}</div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card
        title={t('dashboard.contracts.noticeLogTitle')}
        sub={t('dashboard.contracts.noticeLogSub', { count: notices.length })}
        className="mb"
        action={(
          <button type="button" className="btn sm primary" onClick={sendNotice}>
            <i className="ri-notification-3-line" /> {t('dashboard.contracts.notifyFactory')}
          </button>
        )}
      >
        {notices.length ? (
          <div className="list">
            {notices.map((n) => (
              <div className="list-row" key={n.id}>
                <div className="ic"><i className="ri-notification-3-line" /></div>
                <div className="body">
                  <div className="t small">{n.note}</div>
                  <div className="s">{t('dashboard.contracts.noticeSentAt')}: {n.time}</div>
                </div>
                <div className="end"><Pill tone="info">{noticeRole(n.by)}</Pill></div>
              </div>
            ))}
          </div>
        ) : <p className="small muted" style={{ margin: 0 }}>{t('dashboard.contracts.noticeLogEmpty')}</p>}
      </Card>

      <div className="split wide mb">
        <div className="stack">
          <Card title={t('dashboard.contracts.sectionParties')}>
            <div className="list">
              <div className="list-row">
                <div className="ic"><i className="ri-user-3-line" /></div>
                <div className="body">
                  <div className="t">{contract.buyerCompany || contract.buyer}</div>
                  <div className="s">{contract.buyerCountry}</div>
                </div>
                <div className="end"><Pill tone="info">{t('dashboard.contracts.roleBuyer')}</Pill></div>
              </div>
              <div className="list-row">
                <div className="ic"><i className="ri-building-2-line" /></div>
                <div className="body">
                  <div className="t">{contract.factory}</div>
                  <div className="s">{contract.factoryCity}</div>
                </div>
                <div className="end"><Pill tone="info">{t('dashboard.contracts.roleFactory')}</Pill></div>
              </div>
            </div>
          </Card>

          <Card title={t('dashboard.contracts.sectionProduct')}>
            <div className="grid c2" style={{ gap: 12 }}>
              <div><div className="small muted">{t('dashboard.contracts.productLabel')}</div><div className="strong">{contract.product}</div></div>
              <div><div className="small muted">{t('dashboard.contracts.quantityLabel')}</div><div className="strong">{contract.quantity}</div></div>
              <div><div className="small muted">{t('dashboard.contracts.unitPriceLabel')}</div><div className="strong">{contract.unitPrice}</div></div>
              <div><div className="small muted">{t('dashboard.contracts.totalLabel')}</div><div className="strong accent">{contract.total}</div></div>
              <div style={{ gridColumn: '1 / -1' }}><div className="small muted">{t('dashboard.contracts.paymentLabel')}</div><div className="strong">{contract.payment}</div></div>
            </div>
          </Card>

          <Card title={t('dashboard.contracts.sectionSpecs')}>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr><th>{t('dashboard.contracts.specLabel')}</th><th>{t('dashboard.contracts.specValue')}</th></tr>
                </thead>
                <tbody>
                  {contract.specs.map((s, i) => (
                    <tr key={`${s.label}-${i}`}>
                      <td className="strong">{s.label}</td>
                      <td>{s.value}</td>
                    </tr>
                  ))}
                  {!contract.specs.length && (
                    <tr><td colSpan={2} className="muted" style={{ textAlign: 'center', padding: 18 }}>—</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="stack">
          <Card title={t('dashboard.contracts.sectionDelivery')}>
            <div className="grid c2" style={{ gap: 12 }}>
              <div><div className="small muted">{t('dashboard.contracts.incotermLabel')}</div><div className="strong">{contract.incoterm}</div></div>
              <div><div className="small muted">{t('dashboard.contracts.portLabel')}</div><div className="strong">{contract.port || '—'}</div></div>
              <div><div className="small muted">{t('dashboard.contracts.leadLabel')}</div><div className="strong">{contract.leadDays || '—'}</div></div>
              <div><div className="small muted">{t('dashboard.contracts.deliveryDateLabel')}</div><div className="strong">{contract.deliveryDate || '—'}</div></div>
            </div>
          </Card>

          <Card title={t('dashboard.contracts.sectionClauses')}>
            {contract.clauses.length ? (
              <ul className="ct-clauses">
                {contract.clauses.map((c, i) => (
                  <li key={i}><i className="ri-checkbox-circle-line" /> <span>{c}</span></li>
                ))}
              </ul>
            ) : <p className="small muted">—</p>}
          </Card>

          <Card title={t('dashboard.contracts.sectionMedia')}>
            {contract.images.length ? (
              <div className="media mb">
                {contract.images.map((img, i) => (
                  <div className="tile" key={i}><img className="thumb" src={img} alt={`${contract.product} ${i + 1}`} /></div>
                ))}
              </div>
            ) : <p className="small muted mb">{t('dashboard.contracts.noImages')}</p>}
            {contract.attachments.length ? (
              <div className="list">
                {contract.attachments.map((a) => (
                  <div className="list-row" key={a.name}>
                    <div className="ic"><i className="ri-file-text-line" /></div>
                    <div className="body"><div className="t small">{a.name}</div><div className="s">{a.size}</div></div>
                    <div className="end">
                      <button type="button" className="btn sm ghost" aria-label={t('dashboard.contracts.download')} onClick={() => flash(t('dashboard.contracts.downloadToast'))}>
                        <i className="ri-download-2-line" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="small muted">{t('dashboard.contracts.noAttachments')}</p>}
          </Card>
        </div>
      </div>

      <div className="split wide mb">
        <div className="stack">
          <Card title={t('dashboard.contracts.sectionPeriod')}>
            <div className="grid c2" style={{ gap: 12 }}>
              <div><div className="small muted">{t('dashboard.contracts.startDateLabel')}</div><div className="strong">{contract.startDate || '—'}</div></div>
              <div><div className="small muted">{t('dashboard.contracts.endDateLabel')}</div><div className="strong">{contract.endDate || '—'}</div></div>
              <div><div className="small muted">{t('dashboard.contracts.durationLabel')}</div><div className="strong">{contract.duration || '—'}</div></div>
              <div><div className="small muted">{t('dashboard.contracts.autoRenewLabel')}</div><div className="strong">{contract.autoRenew ? t('dashboard.contracts.autoRenewOn') : t('dashboard.contracts.autoRenewOff')}</div></div>
            </div>
          </Card>

          <Card title={t('dashboard.contracts.sectionObligations')}>
            {contract.obligations.length ? (
              <ul className="ct-clauses">
                {contract.obligations.map((o, i) => (
                  <li key={i}>
                    <i className="ri-checkbox-circle-line" />
                    <span>
                      <Pill tone={o.party === 'buyer' ? 'info' : 'ok'}>
                        {o.party === 'buyer' ? t('dashboard.contracts.obPartyBuyer') : t('dashboard.contracts.obPartyFactory')}
                      </Pill>{' '}
                      {o.text}
                    </span>
                  </li>
                ))}
              </ul>
            ) : <p className="small muted">—</p>}
          </Card>
        </div>

        <div className="stack">
          <Card title={t('dashboard.contracts.sectionDues')} sub={t('dashboard.contracts.duesHint')}>
            {contract.payments.length ? (
              <div className="tbl-wrap mb">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>{t('dashboard.contracts.duesLabel')}</th>
                      <th>{t('dashboard.contracts.duesDate')}</th>
                      <th>{t('dashboard.contracts.duesAmount')}</th>
                      <th>{t('dashboard.contracts.duesStatus')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contract.payments.map((r, i) => (
                      <tr key={i}>
                        <td className="strong">{r.label || '—'}</td>
                        <td className="muted small">{r.date || '—'}</td>
                        <td className="strong">{(Number(r.amount) || 0).toLocaleString()} {contract.currency}</td>
                        <td>
                          <Pill tone={r.status === 'paid' ? 'ok' : r.status === 'due' ? 'warn' : 'mute'}>
                            {t(`dashboard.contracts.duesStatus${r.status === 'paid' ? 'Paid' : r.status === 'due' ? 'Due' : 'Scheduled'}`)}
                          </Pill>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="small muted mb">—</p>}
            <div className="ct-dues-sum">
              <div className="cell"><span className="k">{t('dashboard.contracts.duesPaid')}</span><span className="v">{dues.paid.toLocaleString()} {contract.currency}</span></div>
              <div className="cell"><span className="k">{t('dashboard.contracts.duesRemaining')}</span><span className="v accent">{dues.remaining.toLocaleString()} {contract.currency}</span></div>
            </div>
          </Card>

          <Card title={t('dashboard.contracts.sectionExtra')}>
            <div className="grid" style={{ gap: 12 }}>
              <div><div className="small muted">{t('dashboard.contracts.penaltyLabel')}</div><div className="strong">{contract.penalty || '—'}</div></div>
              <div><div className="small muted">{t('dashboard.contracts.notesLabel')}</div><div>{contract.notes || '—'}</div></div>
            </div>
          </Card>
        </div>
      </div>

      <ContractVersions contract={contract} onRestore={restoreVersion} />

      <Card title={t('dashboard.contracts.commentsTitle')} sub={t('dashboard.contracts.commentsSub', { count: contract.comments.length })} className="mb">
        {contract.comments.length ? (
          <div className="stack" style={{ gap: 10, marginBottom: 14 }}>
            {contract.comments.map((m, i) => (
              <div className="note" key={i} style={{ justifyContent: m.by === role ? 'flex-start' : 'flex-end' }}>
                <i className="ri-chat-3-line" />
                <span>
                  <span className="strong">{m.name}</span> — {m.text}
                  <span className="muted small"> · {m.time}</span>
                </span>
              </div>
            ))}
          </div>
        ) : <p className="small muted mb">—</p>}
        <div className="row-between" style={{ gap: 8 }}>
          <div className="field" style={{ margin: 0, flex: 1 }}>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addComment(); }}
              placeholder={t('dashboard.contracts.commentPlaceholder')}
              aria-label={t('dashboard.contracts.commentPlaceholder')}
            />
          </div>
          <button type="button" className="btn primary" onClick={addComment}>
            <i className="ri-send-plane-2-line" /> {t('dashboard.contracts.sendComment')}
          </button>
        </div>
      </Card>

      <Card title={t('dashboard.contracts.sectionSign')}>
        <div className="row-between wrap" style={{ gap: 10 }}>
          <div className="row-between wrap" style={{ gap: 8 }}>
            <button type="button" className="btn ghost" onClick={downloadPdf} disabled={pdfBusy}>
              <i className={pdfBusy ? 'ri-loader-4-line' : 'ri-file-pdf-2-line'} /> {t('dashboard.contracts.download')}
            </button>
            <button type="button" className="btn ghost" onClick={exportData}>
              <i className="ri-download-cloud-2-line" /> {t('dashboard.contracts.exportData')}
            </button>
            <button type="button" className="btn ghost" onClick={() => flash(t('dashboard.contracts.shareToast'))}>
              <i className="ri-share-line" /> {t('dashboard.contracts.shareLink')}
            </button>
            <button type="button" className="btn ghost" onClick={() => setPrintPreview(true)}>
              <i className="ri-printer-line" /> {t('dashboard.contracts.print')}
            </button>
          </div>
          <div className="row-between wrap" style={{ gap: 8 }}>
            {canSign && (
              <button type="button" className="btn primary" onClick={sign}>
                <i className="ri-quill-pen-line" /> {t('dashboard.contracts.signNow')}
              </button>
            )}
            {role === 'admin' && (
              <>
                <button type="button" className="btn primary" onClick={() => setStatus('active', t('dashboard.contracts.approveToast'))}>
                  <i className="ri-check-double-line" /> {t('dashboard.contracts.approve')}
                </button>
                <button type="button" className="btn ghost" onClick={() => setStatus('pending', t('dashboard.contracts.requestChangesToast'))}>
                  <i className="ri-edit-2-line" /> {t('dashboard.contracts.requestChanges')}
                </button>
                <button type="button" className="btn ghost" onClick={() => setStatus('rejected', t('dashboard.contracts.rejectToast'))}>
                  <i className="ri-close-line" /> {t('dashboard.contracts.reject')}
                </button>
              </>
            )}
          </div>
        </div>
      </Card>

      {printPreview && (
        <div className="ct-print-overlay">
          <div className="ct-print-toolbar">
            <button type="button" className="btn ghost" onClick={() => setPrintPreview(false)}>
              <i className="ri-arrow-right-line" /> {t('dashboard.contracts.printClose')}
            </button>
            <button type="button" className="btn primary" onClick={() => window.print()}>
              <i className="ri-printer-line" /> {t('dashboard.contracts.printSave')}
            </button>
          </div>
          <div className="ct-print-hint no-print">{t('dashboard.contracts.printHint')}</div>
          <ContractPrint contract={contract} />
        </div>
      )}

      <div className="ct-pdf-stage" aria-hidden="true">
        <div ref={pdfRef} className="ct-pdf-capture">
          <ContractPrint contract={contract} />
        </div>
      </div>

      <Toast message={toast} />
    </>
  );
}