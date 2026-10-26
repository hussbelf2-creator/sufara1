import { useState } from 'react';
import type { FunctionComponent } from 'react';
import { useTranslation } from 'react-i18next';
import { useDashboard } from '@/hooks/useDashboard';
import { useFactoryLayout } from '@/hooks/useFactoryLayout';
import type { FactoryCardKey } from '@/hooks/useFactoryLayout';
import { useDashboardNav } from '@/pages/dashboard/components/DashboardNav';
import { downloadFile } from '@/pages/dashboard/lib/download';
import { useFactoryOps, orderTone, formatWhen } from '@/pages/dashboard/lib/factoryStore';
import { exportAllFactoryData } from './exportAll';
import { factoryCatalogViews } from './FactoryCatalog';
import {
  Card, Stat, Pill, PageHead, Modal, Ring, HBars, Toast,
} from '@/pages/dashboard/components/ui';

/* ------------------------------------------------------------------ home */

function FactoryHome() {
  const { t } = useTranslation();
  const d = useDashboard();
  const ops = useFactoryOps();
  const { order, visible } = useFactoryLayout();
  const { go } = useDashboardNav();
  const [toast, setToast] = useState('');
  const flash = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(''), 2000); };

  /* Builds a real printable label file for an order and downloads it. */
  const printLabel = (o: { id: string; product: string; qty: string; ship: string }) => {
    downloadFile(`label-${o.id}.txt`, [
      `${t('dashboard.factory.orders.thOrder')}: ${o.id}`,
      `${t('dashboard.factory.orders.thProduct')}: ${o.product}`,
      `${t('dashboard.factory.orders.thQty')}: ${o.qty}`,
      `${t('dashboard.factory.orders.thShip')}: ${o.ship}`,
      d.factoryUser.factory,
    ].join('\n'));
    flash(t('dashboard.factory.home.labelToast'));
  };

  const stageOf = (id: string) => ops.orders[id]?.stage ?? 'awaiting';
  const flow = { awaiting: 0, ready: 0, transit: 0, delivered: 0 };
  d.factoryOrders.forEach((o) => {
    const s = stageOf(o.id);
    if (s === 'ready') flow.ready += 1;
    else if (s === 'shipped') flow.transit += 1;
    else if (s === 'delivered') flow.delivered += 1;
    else if (s !== 'cancelled') flow.awaiting += 1;
  });
  const lowStock = d.factoryInventory.filter((row) => {
    const p = ops.stock[row.sku];
    return row.alert || (p ? p.available.trim() === '0' : false);
  }).length;
  const docsPending = d.factoryDocsList.filter((doc) => doc.tone === 'warn' && !(ops.docs[doc.id]?.files?.length)).length;
  const overdueOrders = d.factoryOrders.filter((o) => /منتهية|expired/i.test(String(o.due))).length;

  const orderedVisible = order.filter((k) => visible.includes(k));

  const onExportAll = () => {
    const file = exportAllFactoryData(t, d);
    flash(t('dashboard.common.exportedFile', { file }));
  };

  const renderCard = (key: FactoryCardKey) => {
    switch (key) {
      case 'stats':
        return (
          <div className="grid c4" key={key}>
            {d.factoryStats.map((s) => (
              <Stat key={s.lbl} icon={s.icon} num={s.num} lbl={s.lbl} delta={s.delta} up={s.up} />
            ))}
          </div>
        );
      case 'alerts': {
        const alerts: { icon: string; text: string; cta: string; target: string }[] = [];
        if (lowStock) alerts.push({ icon: 'ri-stack-line', text: t('dashboard.factory.home.alertLowStock', { count: lowStock }), cta: t('dashboard.factory.home.alertManageStock'), target: 'f-inventory' });
        if (docsPending) alerts.push({ icon: 'ri-file-shield-2-line', text: t('dashboard.factory.home.alertDocs', { count: docsPending }), cta: t('dashboard.factory.home.alertManageDocs'), target: 'f-join' });
        if (overdueOrders) alerts.push({ icon: 'ri-error-warning-line', text: t('dashboard.factory.home.alertOverdue', { count: overdueOrders }), cta: t('dashboard.factory.home.alertManageOrders'), target: 'f-orders' });
        return (
          <Card key={key} title={t('dashboard.factory.home.alertsTitle')} sub={t('dashboard.factory.home.alertsSub')}>
            {alerts.length === 0 ? (
              <div className="note"><i className="ri-checkbox-circle-line" /><span>{t('dashboard.factory.home.alertNone')}</span></div>
            ) : (
              <div className="list">
                {alerts.map((a) => (
                  <div className="list-row" key={a.text}>
                    <div className="ic warn-ic"><i className={a.icon} /></div>
                    <div className="body"><div className="t small">{a.text}</div></div>
                    <div className="end">
                      <button type="button" className="btn sm ghost" onClick={() => go(a.target)}>
                        <i className="ri-arrow-left-line" /> {a.cta}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        );
      }
      case 'todayOrders':
        return (
          <Card key={key} title={t('dashboard.factory.home.todayTitle')} sub={t('dashboard.factory.home.todaySub')}>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>{t('dashboard.factory.home.thProduct')}</th>
                    <th>{t('dashboard.factory.home.thQty')}</th>
                    <th>{t('dashboard.factory.home.thDue')}</th>
                    <th>{t('dashboard.factory.home.thShip')}</th>
                    <th>{t('dashboard.factory.home.thStatus')}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {d.factoryTodayOrders.map((o) => {
                    const key = ops.orderStatus[o.id];
                    const status = key ? t(`dashboard.factory.status.${key}`) : o.status;
                    const tone = key ? orderTone(key) : o.tone;
                    return (
                      <tr key={o.id}>
                        <td className="tbl-name"><div><div className="t">{o.product}</div><div className="s">{o.id}</div></div></td>
                        <td className="strong">{o.qty}</td>
                        <td className="muted small">{o.due}</td>
                        <td className="muted small">{o.ship}</td>
                        <td><Pill tone={tone}>{status}</Pill></td>
                        <td>
                          <div className="row-between" style={{ gap: 6 }}>
                            <button type="button" className="btn sm ghost" aria-label={t('dashboard.factory.home.process')} onClick={() => { ops.setOrderStatus(o.id, 'processing'); flash(t('dashboard.factory.home.doneToast')); }}><i className="ri-check-double-line" /></button>
                            <button type="button" className="btn sm ghost" aria-label={t('dashboard.factory.home.printLabel')} onClick={() => printLabel(o)}><i className="ri-printer-line" /></button>
                            <button type="button" className="btn sm ghost" aria-label={t('dashboard.factory.home.requestPickup')} onClick={() => { ops.setOrderStatus(o.id, 'ready'); flash(t('dashboard.factory.home.pickupToast')); }}><i className="ri-truck-line" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        );
      case 'readiness':
        return (
          <Card key={key} title={t('dashboard.factory.home.readinessTitle')} sub={t('dashboard.factory.home.readinessSub')}>
            <div className="ring-row">
              <Ring value={d.factoryReadiness.value} tone="gold" center={`${d.factoryReadiness.value}%`} sub={t('dashboard.factory.home.readinessTitle')} />
              <div className="ring-side">
                <p className="small muted">{d.factoryReadiness.pending}</p>
                <div className="list">
                  {d.factoryReadiness.checklist.map((c) => (
                    <div className="list-row" key={c.t} style={{ padding: '8px 0' }}>
                      <i className={c.done ? 'ri-checkbox-circle-fill accent' : 'ri-checkbox-blank-circle-line muted'} style={{ fontSize: 18 }} />
                      <div className="body"><div className="t small">{c.t}</div></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        );
      case 'countries':
        return (
          <Card key={key} title={t('dashboard.factory.home.countriesTitle')} sub={t('dashboard.factory.home.countriesSub')}>
            <HBars items={d.factoryTopCountries} tone="gold" />
          </Card>
        );
      case 'rfq':
        return (
          <Card key={key} title={t('dashboard.factory.home.rfqTitle')} sub={t('dashboard.factory.home.rfqSub')}>
            <div className="list">
              {d.factoryRfqPending.map((r) => (
                <div className="list-row" key={r.buyer}>
                  <div className="ic"><i className="ri-price-tag-3-line" /></div>
                  <div className="body">
                    <div className="t">{r.buyer} · {r.qty}</div>
                    <div className="s">{r.country} · {r.delivery} · {r.deadline}</div>
                  </div>
                  <div className="end">
                    <button type="button" className="btn sm primary" onClick={() => go('f-rfq')}>
                      <i className="ri-send-plane-line" /> {t('dashboard.factory.home.replyQuote')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <PageHead
        eyebrow={t('dashboard.factory.eyebrow')}
        title={t('dashboard.factory.home.title')}
        sub={t('dashboard.factory.home.sub')}
        actions={(
          <>
            <button type="button" className="btn ghost" onClick={onExportAll}>
              <i className="ri-download-2-line" /> {t('dashboard.factory.home.exportAll')}
            </button>
            <button type="button" className="btn ghost" onClick={() => go('f-custom')}>
              <i className="ri-equalizer-line" /> {t('dashboard.factory.home.customize')}
            </button>
            <button type="button" className="btn primary" onClick={() => go('f-inventory')}>
              <i className="ri-refresh-line" /> {t('dashboard.factory.home.updateStock')}
            </button>
          </>
        )}
      />

      <div className="grid c6 mb">
        <Stat icon="ri-inbox-archive-line" num={String(flow.awaiting)} lbl={t('dashboard.factory.home.kpi.awaiting')} />
        <Stat icon="ri-archive-2-line" num={String(flow.ready)} lbl={t('dashboard.factory.home.kpi.ready')} />
        <Stat icon="ri-truck-line" num={String(flow.transit)} lbl={t('dashboard.factory.home.kpi.transit')} />
        <Stat icon="ri-checkbox-circle-line" num={String(flow.delivered)} lbl={t('dashboard.factory.home.kpi.delivered')} />
        <Stat icon="ri-alert-line" num={String(lowStock)} lbl={t('dashboard.factory.home.kpi.lowStock')} />
        <Stat icon="ri-file-shield-2-line" num={String(docsPending)} lbl={t('dashboard.factory.home.kpi.docsPending')} />
      </div>

      {visible.length === 0 && (
        <div className="note mb">
          <i className="ri-information-line" />
          <span>{t('dashboard.factory.custom.empty')}</span>
        </div>
      )}

      {orderedVisible.length > 0 && (
        <div className="stack">
          {orderedVisible.map(renderCard)}
        </div>
      )}

      <Toast message={toast} />
    </>
  );
}

/* ------------------------------------------------------------ join / verify */

function FactoryJoin() {
  const { t, i18n } = useTranslation();
  const d = useDashboard();
  const ops = useFactoryOps();
  const [open, setOpen] = useState(false);
  const [docId, setDocId] = useState(d.factoryDocsList[0]?.id ?? '');
  const [number, setNumber] = useState('');
  const [file, setFile] = useState('');
  const [signed, setSigned] = useState(false);
  const [details, setDetails] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const flash = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(''), 2000); };

  const openUpload = (id?: string) => {
    if (id) setDocId(id);
    setOpen(true);
  };

  const submit = () => {
    if (!file) { flash(t('dashboard.factory.join.needFile')); return; }
    ops.addDocFile(docId, { name: file, ref: number.trim() || '—', at: Date.now() });
    setOpen(false);
    setFile('');
    setNumber('');
    flash(t('dashboard.factory.join.uploadToast'));
  };

  const allFiles = d.factoryDocsList.flatMap((doc) => (
    (ops.docs[doc.id]?.files ?? []).map((f) => ({ ...f, doc: doc.name }))
  ));
  const detailDoc = details ? d.factoryDocsList.find((x) => x.id === details) : null;
  const detailFiles = details ? (ops.docs[details]?.files ?? []) : [];

  return (
    <>
      <PageHead
        eyebrow={t('dashboard.factory.eyebrow')}
        title={t('dashboard.factory.join.title')}
        sub={t('dashboard.factory.join.sub')}
        actions={<button type="button" className="btn primary" onClick={() => openUpload()}><i className="ri-upload-2-line" /> {t('dashboard.factory.join.upload')}</button>}
      />

      <div className="split mb">
        <Card title={t('dashboard.factory.join.stepsTitle')} sub={t('dashboard.factory.join.stepsSub')}>
          <div className="tl">
            {d.factoryJoinSteps.map((s) => (
              <div key={s.t} className={`tl-item ${s.done ? 'done' : ''}`}>
                <div className="row-between">
                  <div className="t">{s.t}</div>
                  <Pill tone={s.done ? 'ok' : 'warn'}>{s.done ? t('dashboard.factory.join.done') : t('dashboard.factory.join.todo')}</Pill>
                </div>
                <div className="s">{s.s}</div>
              </div>
            ))}
          </div>
        </Card>

        <div className="stack">
          <Card title={t('dashboard.factory.join.docsTitle')} sub={t('dashboard.factory.join.docsSub')}>
            <div className="list">
              {d.factoryDocsList.map((doc) => {
                const files = ops.docs[doc.id]?.files ?? [];
                const uploaded = files.length > 0;
                return (
                  <div className="list-row" key={doc.id}>
                    <div className="ic"><i className={uploaded ? 'ri-file-check-line' : 'ri-file-text-line'} /></div>
                    <div className="body">
                      <div className="t small">{doc.name}</div>
                      {uploaded && <div className="s">{t('dashboard.factory.join.fileCount', { count: files.length })}</div>}
                    </div>
                    <div className="end wrap" style={{ gap: 6 }}>
                      <Pill tone={uploaded ? 'info' : doc.tone}>{uploaded ? t('dashboard.factory.join.statusUploaded') : doc.status}</Pill>
                      {uploaded && <button type="button" className="btn sm ghost" onClick={() => setDetails(doc.id)}><i className="ri-eye-line" /> {t('dashboard.factory.join.viewDetails')}</button>}
                      <button type="button" className="btn sm ghost" onClick={() => openUpload(doc.id)}><i className="ri-upload-2-line" /> {t('dashboard.factory.join.perDocUpload')}</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card title={t('dashboard.factory.join.agreementTitle')}>
            <p className="small muted mb">{t('dashboard.factory.join.agreementText')}</p>
            {signed ? (
              <Pill tone="ok"><i className="ri-checkbox-circle-line" /> {t('dashboard.factory.join.signedToast')}</Pill>
            ) : (
              <button type="button" className="btn primary block" onClick={() => { setSigned(true); flash(t('dashboard.factory.join.signedToast')); }}>
                <i className="ri-edit-2-line" /> {t('dashboard.factory.join.signNow')}
              </button>
            )}
          </Card>
        </div>
      </div>

      <Card title={t('dashboard.factory.join.uploadedFilesTitle')} sub={t('dashboard.factory.join.uploadedFilesSub')} className="mb">
        {allFiles.length === 0 ? (
          <div className="note"><i className="ri-folder-open-line" /><span>{t('dashboard.factory.join.noFiles')}</span></div>
        ) : (
          <div className="list">
            {allFiles.map((f, i) => (
              <div className="list-row" key={`${f.name}-${i}`}>
                <div className="ic"><i className="ri-file-paper-2-line" /></div>
                <div className="body">
                  <div className="t small">{f.name}</div>
                  <div className="s">{f.doc} · {f.ref} · {formatWhen(f.at, i18n.language)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={t('dashboard.factory.join.uploadTitle')} sub={t('dashboard.factory.join.uploadSub')}>
        <div className="field">
          <label htmlFor="doc-type">{t('dashboard.factory.join.docsTitle')}</label>
          <select id="doc-type" value={docId} onChange={(e) => setDocId(e.target.value)}>
            {d.factoryDocsList.map((doc) => <option key={doc.id} value={doc.id}>{doc.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="doc-num">{t('dashboard.factory.join.numberLabel')}</label>
          <input id="doc-num" value={number} onChange={(e) => setNumber(e.target.value)} placeholder={t('dashboard.factory.join.numberPlaceholder')} />
        </div>
        <label className={`drop-zone ${file ? 'has-file' : ''}`} htmlFor="doc-file">
          <i className={file ? 'ri-file-check-line' : 'ri-upload-cloud-2-line'} />
          <span>{file ? t('dashboard.factory.join.fileChosen') : t('dashboard.factory.join.chooseFile')}</span>
          {file && <span className="fname">{file}</span>}
        </label>
        <input id="doc-file" className="file-input-hidden" type="file" accept="image/*,.pdf" onChange={(e) => setFile(e.target.files?.[0]?.name ?? '')} />
        <div className="modal-actions">
          <button type="button" className="btn primary" onClick={submit}>{t('dashboard.factory.join.submit')}</button>
          <button type="button" className="btn ghost" onClick={() => setOpen(false)}>{t('dashboard.common.close')}</button>
        </div>
      </Modal>

      <Modal open={!!details} onClose={() => setDetails(null)} title={t('dashboard.factory.join.docDetailsTitle')} sub={detailDoc?.name}>
        {detailFiles.length === 0 ? (
          <div className="note"><i className="ri-information-line" /><span>{t('dashboard.factory.join.noFiles')}</span></div>
        ) : (
          <div className="list">
            {detailFiles.map((f, i) => (
              <div className="list-row" key={`${f.name}-${i}`}>
                <div className="ic"><i className="ri-file-check-line" /></div>
                <div className="body">
                  <div className="t small">{f.name}</div>
                  <div className="s">{t('dashboard.factory.join.docRefLabel')}: {f.ref}</div>
                  <div className="s">{t('dashboard.factory.join.docUploadedAtLabel')}: {formatWhen(f.at, i18n.language)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
      <Toast message={toast} />
    </>
  );
}

/* ---------------------------------------------------------------- profile */

function FactoryProfile() {
  const { t } = useTranslation();
  const d = useDashboard();
  const p = d.factoryProfile;
  const [bio, setBio] = useState(p.bio);
  const [notes, setNotes] = useState('');
  const [toast, setToast] = useState('');
  const flash = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(''), 2000); };

  return (
    <>
      <PageHead
        eyebrow={t('dashboard.factory.eyebrow')}
        title={t('dashboard.factory.profile.title')}
        sub={t('dashboard.factory.profile.sub')}
        actions={<button type="button" className="btn ghost" onClick={() => flash(t('dashboard.factory.profile.previewToast'))}><i className="ri-eye-line" /> {t('dashboard.factory.profile.preview')}</button>}
      />

      <div className="split wide">
        <Card title={t('dashboard.factory.profile.title')}>
          <div className="row-between mb">
            <div className="tbl-name">
              <img className="mini" src={p.logo} alt={d.factoryUser.factory} style={{ width: 48, height: 48, borderRadius: 12 }} />
              <div>
                <div className="t">{d.factoryUser.factory}</div>
                <div className="s">{p.city} · {d.factoryUser.role}</div>
              </div>
            </div>
            <Pill tone="ok"><i className="ri-verified-badge-line" /> {t('dashboard.factory.join.done')}</Pill>
          </div>
          <p className="small mb">{bio}</p>
          <div className="row-between wrap mb" style={{ gap: 8 }}>
            <div className="small muted">{t('dashboard.factory.profile.capacityLabel')}: <span className="strong">{p.capacity}</span></div>
          </div>
          <div className="mb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {p.certs.map((c) => <span className="pill ok" key={c}><i className="ri-shield-check-line" /> {c}</span>)}
          </div>
          <div className="divider" />
          <div className="media">
            {p.images.map((img, i) => (
              <div className="tile" key={i}>
                <img className="thumb" src={img} alt={`${d.factoryUser.factory} ${i + 1}`} />
              </div>
            ))}
          </div>
        </Card>

        <Card title={t('dashboard.factory.profile.edit')}>
          <div className="field">
            <label htmlFor="f-bio">{t('dashboard.factory.profile.bioLabel')}</label>
            <textarea id="f-bio" maxLength={500} value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="f-notes">{t('dashboard.factory.profile.notesLabel')}</label>
            <textarea id="f-notes" maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('dashboard.factory.profile.notesPlaceholder')} />
          </div>
          <div className="row-between wrap mb" style={{ gap: 8 }}>
            <div className="small muted">{t('dashboard.factory.profile.langsLabel')}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {p.langs.map((l) => <span className="pill info" key={l}>{l}</span>)}
            </div>
          </div>
          <button type="button" className="btn primary block" onClick={() => flash(t('dashboard.factory.profile.savedToast'))}>
            <i className="ri-save-3-line" /> {t('dashboard.common.save')}
          </button>
        </Card>
      </div>
      <Toast message={toast} />
    </>
  );
}

export const factoryCoreViews: Record<string, FunctionComponent> = {
  'f-home': FactoryHome,
  'f-join': FactoryJoin,
  'f-profile': FactoryProfile,
  ...factoryCatalogViews,
};