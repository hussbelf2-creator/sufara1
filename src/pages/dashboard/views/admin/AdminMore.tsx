import { useMemo, useState } from 'react';
import type { FunctionComponent } from 'react';
import { useTranslation } from 'react-i18next';
import { useDashboard } from '@/hooks/useDashboard';
import { useAdminOps } from '@/pages/dashboard/lib/adminStore';
import { downloadCsv } from '@/pages/dashboard/lib/csv';
import { pushShipmentRecord } from '@/hooks/useShipmentFeed';
import { Card, Pill, PageHead, Bar, Toast } from '@/pages/dashboard/components/ui';
import FinanceLedger from './FinanceLedger';
import { usePlatformConfig } from '@/config/store';
import ReturnsLog from './ReturnsLog';

/* ----------------------------------------------------------------- finance */
function AdminFinance() {
  const d = useDashboard();
  const L = d.adminLabels;

  return (
    <>
      <PageHead
        eyebrow={L.meta.eyebrow}
        title={d.adminNav[7].label}
        sub={L.finance.sub}
        actions={<button type="button" className="btn primary"><i className="ri-loop-right-line" /> {L.common.schedule}</button>}
      />

      <FinanceLedger />

      <Card className="mb" title={L.finance.payments} sub={L.finance.paymentsSub}>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>{L.common.order}</th>
                <th>{L.common.gateway}</th>
                <th>{L.common.currency}</th>
                <th>{L.common.amount}</th>
                <th>{L.common.rate}</th>
                <th>{L.common.fee}</th>
                <th>{L.common.status}</th>
              </tr>
            </thead>
            <tbody>
              {d.adminPayments.map((p) => (
                <tr key={p.id}>
                  <td className="strong">{p.id}</td>
                  <td>{p.gateway}</td>
                  <td className="muted">{p.currency}</td>
                  <td className="strong">{p.amount}</td>
                  <td>{p.rate}</td>
                  <td>{p.fee}</td>
                  <td><Pill tone={p.tone}>{p.status}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="mb" title={L.finance.settlements} sub={L.finance.settlementsSub}>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>{L.common.factory}</th>
                <th>{L.common.period}</th>
                <th>{L.common.sales}</th>
                <th>{L.common.commission}</th>
                <th>{L.common.fee}</th>
                <th>{L.common.net}</th>
                <th>{L.common.status}</th>
                <th>{L.common.actions}</th>
              </tr>
            </thead>
            <tbody>
              {d.adminSettlements.map((s) => (
                <tr key={s.factory}>
                  <td className="strong">{s.factory}</td>
                  <td className="muted">{s.period}</td>
                  <td>{s.sales}</td>
                  <td>{s.commission}</td>
                  <td>{s.fee}</td>
                  <td className="strong accent">{s.net}</td>
                  <td><Pill tone={s.tone}>{s.status}</Pill></td>
                  <td><button type="button" className="btn sm primary"><i className="ri-check-line" /> {L.common.approve}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="split mb">
        <Card title={L.finance.payouts} sub={L.finance.payoutsSub}>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>{L.common.name}</th>
                  <th>{L.common.country}</th>
                  <th>{L.common.available}</th>
                  <th>{L.common.method}</th>
                  <th>{L.common.status}</th>
                </tr>
              </thead>
              <tbody>
                {d.adminPayouts.map((p) => (
                  <tr key={p.name}>
                    <td className="strong">{p.name}</td>
                    <td className="muted">{p.country}</td>
                    <td>{p.available}</td>
                    <td>{p.method}</td>
                    <td><Pill tone={p.tone}>{p.status}</Pill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title={L.finance.invoices} sub={L.finance.invoicesSub}>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>{L.finance.thInvoice}</th>
                  <th>{L.common.party}</th>
                  <th>{L.common.amount}</th>
                  <th>{L.finance.thVat}</th>
                  <th>{L.common.status}</th>
                </tr>
              </thead>
              <tbody>
                {d.adminInvoices.map((i) => (
                  <tr key={i.id}>
                    <td className="strong">{i.id}<div className="s muted small">{i.type}</div></td>
                    <td>{i.party}</td>
                    <td className="strong">{i.amount}</td>
                    <td className="muted small">{i.vat}</td>
                    <td><Pill tone={i.tone}>{i.status}</Pill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}

/* --------------------------------------------------------------- logistics */
function AdminLogistics() {
  const d = useDashboard();
  const L = d.adminLabels;
  const ops = useAdminOps();
  const [toast, setToast] = useState('');
  const flash = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(''), 2200); };

  return (
    <>
      <PageHead
        eyebrow={L.meta.eyebrow}
        title={d.adminNav[8].label}
        sub={L.logistics.sub}
        actions={<button type="button" className="btn ghost"><i className="ri-price-tag-3-line" /> {L.logistics.pricing}</button>}
      />

      <div className="split mb">
        <Card title={L.logistics.carriers} sub={L.logistics.carriersSub}>
          <div className="stack" style={{ gap: 14 }}>
            {d.adminCarriers.map((c) => (
              <div key={c.name}>
                <div className="row-between small mb" style={{ marginBottom: 6 }}>
                  <span className="strong">{c.name} <span className="muted small">· {c.service}</span></span>
                  <Pill tone={c.tone}>{c.status}</Pill>
                </div>
                <div className="row-between small mb" style={{ marginBottom: 6 }}>
                  <span className="muted">{c.countries}</span>
                  <span className="strong">{c.performance}%</span>
                </div>
                <Bar value={c.performance} slim />
              </div>
            ))}
          </div>
          <div className="divider" />
          <div className="row-between wrap" style={{ gap: 8 }}>
            <button type="button" className="btn sm ghost"><i className="ri-add-line" /> {L.common.create}</button>
            <button type="button" className="btn sm ghost" disabled><i className="ri-equalizer-line" /> {L.logistics.pricing}</button>
          </div>
        </Card>

        <Card title={L.logistics.warehouse} sub={L.logistics.warehouseSub}>
          <div className="stack" style={{ gap: 14 }}>
            {d.adminWarehouse.map((w) => (
              <div key={w.stage}>
                <div className="row-between small mb" style={{ marginBottom: 6 }}>
                  <span className="strong">{w.stage}</span>
                  <span className="muted">{w.value}</span>
                </div>
                <Bar value={w.pct} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title={L.logistics.shipments} sub={L.logistics.shipmentsSub}>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>{L.logistics.thTracking}</th>
                <th>{L.logistics.thCompany}</th>
                <th>{L.common.status}</th>
                <th>{L.common.last}</th>
                <th>{L.common.delay}</th>
                <th>{L.common.actions}</th>
              </tr>
            </thead>
            <tbody>
              {d.adminShipments.map((s) => {
                const patch = ops.shipmentStatus[s.id];
                const status = patch?.status ?? s.status;
                const tone = patch?.tone ?? s.tone;
                const last = patch?.last ?? s.last;
                const delay = patch?.delay ?? s.delay;
                const delivered = patch?.tone === 'ok';
                return (
                  <tr key={s.id}>
                    <td className="strong">{s.tracking}<div className="s muted small">{s.id}</div></td>
                    <td>{s.carrier}</td>
                    <td><Pill tone={tone}>{status}</Pill></td>
                    <td className="muted">{last}</td>
                    <td>{delay}</td>
                    <td>
                      <div className="row-between wrap" style={{ gap: 6 }}>
                        <button
                          type="button"
                          className="btn sm ghost"
                          disabled={delivered}
                          onClick={() => {
                            ops.setShipment(s.id, { status: L.ops.statusScheduled, tone: 'info', last: L.ops.lastScheduled, delay: s.delay }, { who: d.adminUser.name, what: `${L.audit.shipmentSchedule} · ${s.tracking}`, cat: 'shipment', before: status, after: L.ops.statusScheduled });
                            pushShipmentRecord({ tracking: s.tracking, carrier: s.carrier, statusLabel: L.ops.statusScheduled, orderStatus: 'shipped', event: L.ops.lastScheduled });
                            flash(L.ops.shipmentScheduled);
                          }}
                        >
                          <i className="ri-calendar-schedule-line" /> {L.logistics.schedulePickup}
                        </button>
                        <button
                          type="button"
                          className="btn sm primary"
                          disabled={delivered}
                          onClick={() => {
                            ops.setShipment(s.id, { status: L.ops.statusDelivered, tone: 'ok', last: L.ops.lastDelivered, delay: L.ops.onTime }, { who: d.adminUser.name, what: `${L.audit.shipmentDeliver} · ${s.tracking}`, cat: 'shipment', before: status, after: L.ops.statusDelivered });
                            pushShipmentRecord({ tracking: s.tracking, carrier: s.carrier, statusLabel: L.ops.statusDelivered, orderStatus: 'delivered', event: L.ops.lastDelivered });
                            flash(L.ops.shipmentDelivered);
                          }}
                        >
                          <i className="ri-check-double-line" /> {L.logistics.confirmDelivery}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      <Toast message={toast} />
    </>
  );
}

/* -------------------------------------------------------------- compliance */
function AdminCompliance() {
  const d = useDashboard();
  const L = d.adminLabels;
  const ops = useAdminOps();
  const [toast, setToast] = useState('');

  const gaps = d.adminClearanceGaps;
  const pending = gaps.filter((g) => !ops.clearanceAlerts[g.tracking]).length;

  return (
    <>
      <PageHead
        eyebrow={L.meta.eyebrow}
        title={d.adminNav[9].label}
        sub={L.compliance.sub}
        actions={<button type="button" className="btn primary"><i className="ri-file-add-line" /> {L.common.create}</button>}
      />

      <Card
        className="mb"
        title={L.compliance.gapsTitle}
        sub={L.compliance.gapsSub}
        action={(
          <Pill tone={pending > 0 ? 'warn' : 'ok'}>
            {pending > 0
              ? L.compliance.gapsAlert.replace('{{count}}', String(pending))
              : L.compliance.gapsClear}
          </Pill>
        )}
      >
        {gaps.length === 0 ? (
          <div className="empty">
            <i className="ri-shield-check-line" />
            <div>{L.compliance.gapsClear}</div>
          </div>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>{L.compliance.thTrackingOrder}</th>
                  <th>{L.common.country}</th>
                  <th>{L.compliance.thParty}</th>
                  <th>{L.compliance.thMissing}</th>
                  <th>{L.compliance.thAge}</th>
                  <th>{L.common.status}</th>
                  <th>{L.common.actions}</th>
                </tr>
              </thead>
              <tbody>
                {gaps.map((g) => {
                  const alertedAt = ops.clearanceAlerts[g.tracking];
                  return (
                    <tr key={g.tracking}>
                      <td className="strong">
                        {g.tracking}
                        <div className="s muted small">{g.order} · {g.incoterm}</div>
                      </td>
                      <td>
                        {g.country}
                        <div className="s muted small">{g.hub}</div>
                      </td>
                      <td className="muted">{g.party}</td>
                      <td>
                        <div className="row-between wrap" style={{ gap: 4 }}>
                          {g.missing.map((m) => (
                            <Pill key={m} tone="warn">{m}</Pill>
                          ))}
                        </div>
                      </td>
                      <td className="muted small">{L.compliance.daysLate.replace('{{count}}', String(g.ageDays))}</td>
                      <td>
                        <Pill tone={g.tone}>{L.compliance.missingCount.replace('{{count}}', String(g.missing.length))}</Pill>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={`btn sm ${alertedAt ? 'ghost' : 'primary'}`}
                          disabled={Boolean(alertedAt)}
                          onClick={() => {
                            ops.notifyClearance(g.tracking, {
                              who: d.adminUser.name,
                              what: `${L.compliance.notifyDesk} · ${g.tracking}`,
                              cat: 'shipment',
                              before: L.compliance.pending,
                              after: L.compliance.notifiedBtn,
                            });
                            setToast(L.compliance.notifyDone.replace('{{tracking}}', g.tracking));
                            window.setTimeout(() => setToast(''), 2600);
                          }}
                        >
                          <i className={alertedAt ? 'ri-check-line' : 'ri-notification-3-line'} />
                          {alertedAt ? L.compliance.notifiedBtn : L.compliance.notifyDesk}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="divider" />
        <div className="note">
          <i className="ri-alarm-warning-line" />
          <span>{L.compliance.alertTitle} — {L.compliance.gapsAlert.replace('{{count}}', String(pending))}</span>
        </div>
      </Card>

      <div className="split mb">
        <Card title={L.compliance.docsTitle} sub={L.compliance.docsSub}>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>{L.compliance.thDocs}</th>
                  <th>{L.common.type}</th>
                  <th>{L.common.order}</th>
                  <th>{L.common.status}</th>
                  <th>{L.common.actions}</th>
                </tr>
              </thead>
              <tbody>
                {d.adminExportDocs.map((doc) => (
                  <tr key={doc.type}>
                    <td className="strong">{doc.name}</td>
                    <td className="muted">{doc.type}</td>
                    <td>{doc.order}</td>
                    <td><Pill tone={doc.tone}>{doc.status}</Pill></td>
                    <td><button type="button" className="btn sm ghost"><i className="ri-download-2-line" /> {L.common.upload}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title={L.compliance.rules} sub={L.compliance.rulesSub}>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>{L.common.country}</th>
                  <th>{L.common.threshold}</th>
                  <th>{L.common.restricted}</th>
                  <th>{L.common.fee}</th>
                </tr>
              </thead>
              <tbody>
                {d.adminCountryRules.map((r) => (
                  <tr key={r.country}>
                    <td className="strong">{r.country}</td>
                    <td className="muted">{r.threshold}</td>
                    <td>{r.restricted}</td>
                    <td>{r.fee}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="divider" />
          <button type="button" className="btn sm ghost"><i className="ri-add-line" /> {L.common.addRule}</button>
        </Card>
      </div>

      <Card title={L.compliance.verify} sub={L.compliance.verifySub}>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>{L.compliance.thEntity}</th>
                <th>{L.common.type}</th>
                <th>{L.common.result}</th>
                <th>{L.common.sanctions}</th>
                <th>{L.common.status}</th>
              </tr>
            </thead>
            <tbody>
              {d.adminVerifications.map((v) => (
                <tr key={v.entity}>
                  <td className="strong">{v.entity}</td>
                  <td className="muted">{v.type}</td>
                  <td>{v.result}</td>
                  <td>{v.sanctions}</td>
                  <td><Pill tone={v.tone}>{v.result}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Toast message={toast} />
    </>
  );
}

/* --------------------------------------------------------------- marketing */
function AdminMarketing() {
  const d = useDashboard();
  const L = d.adminLabels;

  return (
    <>
      <PageHead
        eyebrow={L.meta.eyebrow}
        title={d.adminNav[10].label}
        sub={L.marketing.sub}
        actions={<button type="button" className="btn primary"><i className="ri-add-line" /> {L.common.create}</button>}
      />

      <div className="split mb">
        <Card title={L.marketing.campaigns} sub={L.marketing.campaignsSub}>
          <div className="list">
            {d.adminCampaigns.map((c) => (
              <div className="list-row" key={c.name}>
                <div className="ic"><i className="ri-megaphone-line" /></div>
                <div className="body">
                  <div className="t">{c.name}</div>
                  <div className="s">{c.period} · {c.countries} · {L.common.factory} {c.factories}</div>
                </div>
                <div className="end">
                  <Pill tone="info">{c.performance}</Pill>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title={L.marketing.coupons} sub={L.marketing.couponsSub}>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>{L.common.code}</th>
                  <th>{L.common.type}</th>
                  <th>{L.common.limits}</th>
                  <th>{L.common.usage}</th>
                  <th>{L.common.bearer}</th>
                </tr>
              </thead>
              <tbody>
                {d.adminCoupons.map((c) => (
                  <tr key={c.code}>
                    <td className="strong">{c.code}</td>
                    <td>{c.type}</td>
                    <td className="muted">{c.limits}</td>
                    <td>{c.usage}</td>
                    <td><Pill tone="mute">{c.bearer}</Pill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card className="mb" title={L.marketing.content} sub={L.marketing.contentSub}>
        <div className="media">
          {d.adminContentLibrary.map((a) => (
            <div className="tile" key={a.name}>
              <img className="thumb" src={a.img} alt={a.name} />
              <div className="meta">
                <div className="t">{a.name}</div>
                <div className="s">{a.lang} · {a.product} · {L.marketing.thPages} {a.posts}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="split">
        <Card title={L.marketing.notifications} sub={L.marketing.notificationsSub}>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>{L.common.event}</th>
                  <th>{L.common.channels}</th>
                  <th>{L.common.lang}</th>
                  <th>{L.common.status}</th>
                </tr>
              </thead>
              <tbody>
                {d.adminNotifications.map((n) => (
                  <tr key={n.event}>
                    <td className="strong">{n.event}</td>
                    <td className="muted small">{n.channels}</td>
                    <td>{n.langs}</td>
                    <td><Pill tone={n.tone}>{n.status}</Pill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title={L.marketing.translations} sub={L.marketing.translationsSub}>
          <div className="stack" style={{ gap: 14 }}>
            {d.adminTranslations.map((tr) => (
              <div key={tr.lang}>
                <div className="row-between small mb" style={{ marginBottom: 6 }}>
                  <span className="strong">{tr.lang}</span>
                  <span className="muted">{tr.pct}%</span>
                </div>
                <Bar value={tr.pct} slim />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

/* ----------------------------------------------------------------- support */
function AdminSupport() {
  /* Key platform settings, read from the active PlatformConfig version. */
  const pcfg = usePlatformConfig();
  const { i18n: sI18n } = useTranslation();
  const sAr = (sI18n.resolvedLanguage || sI18n.language || 'ar').startsWith('ar');
  const sp = (n: number) => `${Math.round(n * 1000) / 10}%`;
  const settingsRows = [
    { label: sAr ? 'العملة الأساسية' : 'Base currency', value: sAr ? 'الريال السعودي (SAR) — العرض بعملة الزائر' : 'Saudi riyal (SAR) — displayed in the visitor currency' },
    { label: sAr ? 'اللغات المفعّلة' : 'Languages', value: pcfg.locale.languages.join(' · ').toUpperCase() },
    { label: sAr ? 'حصة المنصة' : 'Platform take', value: `${sAr ? 'تجزئة' : 'Retail'} ${sp(pcfg.take.retail.value)} · ${sAr ? 'جملة' : 'Wholesale'} ${sp(pcfg.take.wholesale.value)}` },
    { label: sAr ? 'عمولة السفير' : 'Ambassador commission', value: `${pcfg.ambassador.retailTiers.map((x) => sp(x.rate)).join(' / ')} · ${sAr ? 'جملة' : 'wholesale'} ${sp(pcfg.ambassador.wholesale.value)} · ${sAr ? 'قائد' : 'leader'} +${sp(pcfg.ambassador.leaderBonus)}` },
    { label: sAr ? 'سقف الخصم' : 'Discount cap', value: sp(pcfg.promo.capRate) },
    { label: sAr ? 'قفل العمولة' : 'Commission lock', value: sAr ? 'تسليم مؤكد + نافذة الإرجاع في بلد الوصول' : 'Confirmed delivery + destination return window' },
    { label: sAr ? 'نسخة الإعدادات' : 'Settings version', value: `v${pcfg.version} · ${pcfg.effectiveFrom}` },
  ];

  const d = useDashboard();
  const L = d.adminLabels;
  const ops = useAdminOps();
  const { i18n } = useTranslation();
  const locale = (i18n.resolvedLanguage || i18n.language || 'ar').match(/^(en|ur|id)/) !== null ? 'en-US' : 'ar-EG';
  const fmtWhen = (ts: number) => new Date(ts).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' });

  const catLabel: Record<string, string> = {
    factory: L.audit.catFactory,
    product: L.audit.catProduct,
    return: L.audit.catReturn,
    shipment: L.audit.catShipment,
    other: L.audit.catOther,
  };

  /* One unified audit stream: the real actions recorded in this browser (each
     with an exact timestamp) plus the seeded baseline rows, whose relative
     day/hour is turned into a real timestamp so date filtering and the monthly
     report work on every row. Always newest first. */
  const rows = useMemo(() => {
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    const start = base.getTime();
    const live = ops.audit.map((a) => ({
      key: a.id,
      who: a.who,
      what: a.what,
      cat: String(a.cat ?? 'other'),
      at: a.at,
      device: a.device,
      before: a.before,
      after: a.after,
    }));
    const seeded = d.adminAudit.map((a, i) => ({
      key: `seed-${i}`,
      who: a.who,
      what: a.what,
      cat: String(a.cat ?? 'other'),
      at: start + (a.hour * 60 + a.minute) * 60000 - a.daysAgo * 86400000,
      device: a.device,
      before: a.before,
      after: a.after,
    }));
    return [...live, ...seeded].sort((x, y) => y.at - x.at);
  }, [ops.audit, d.adminAudit]);

  /* Distinct actors for the actor filter. */
  const actors = useMemo(() => Array.from(new Set(rows.map((r) => r.who))), [rows]);

  const [q, setQ] = useState('');
  const [actor, setActor] = useState('all');
  const [cat, setCat] = useState('all');
  const [range, setRange] = useState('all');

  /* Applies the actor, action-type, date-range and free-text filters together. */
  const filtered = useMemo(() => {
    const now = Date.now();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (actor !== 'all' && r.who !== actor) return false;
      if (cat !== 'all' && r.cat !== cat) return false;
      if (range === 'today' && r.at < today.getTime()) return false;
      if (range === 'd7' && r.at < now - 7 * 86400000) return false;
      if (range === 'd30' && r.at < now - 30 * 86400000) return false;
      if (term) {
        const hay = `${r.who} ${r.what} ${r.device} ${r.before} ${r.after}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [rows, q, actor, cat, range]);

  const filtersOn = q.trim() !== '' || actor !== 'all' || cat !== 'all' || range !== 'all';
  const clearFilters = () => { setQ(''); setActor('all'); setCat('all'); setRange('all'); };

  const exportAudit = (list: typeof filtered) => {
    downloadCsv(
      'sta-audit-log.csv',
      [L.common.who, L.common.order, L.common.type, L.common.when, L.common.device, L.common.before, L.common.after],
      list.map((r) => [r.who, r.what, catLabel[r.cat] ?? r.cat, fmtWhen(r.at), r.device, r.before, r.after]),
    );
  };

  /* Months that actually have activity, newest first, for the monthly report. */
  const months = useMemo(() => {
    const seen = new Map<string, number>();
    rows.forEach((r) => {
      const dt = new Date(r.at);
      const key = `${dt.getFullYear()}-${dt.getMonth()}`;
      if (!seen.has(key)) seen.set(key, r.at);
    });
    return Array.from(seen.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([key, at]) => ({ key, label: new Date(at).toLocaleDateString(locale, { month: 'long', year: 'numeric' }) }));
  }, [rows, locale]);

  const [month, setMonth] = useState('');
  const activeMonth = months.some((m) => m.key === month) ? month : (months[0]?.key ?? '');
  const activeMonthLabel = months.find((m) => m.key === activeMonth)?.label ?? '';

  /* Per-staff tally of approvals and arbitrations for the selected month. */
  const report = useMemo(() => {
    const inMonth = rows.filter((r) => {
      const dt = new Date(r.at);
      return `${dt.getFullYear()}-${dt.getMonth()}` === activeMonth;
    });
    const map = new Map<string, { who: string; factory: number; product: number; ret: number; shipment: number; total: number }>();
    inMonth.forEach((r) => {
      const entry = map.get(r.who) ?? { who: r.who, factory: 0, product: 0, ret: 0, shipment: 0, total: 0 };
      if (r.cat === 'factory') entry.factory += 1;
      else if (r.cat === 'product') entry.product += 1;
      else if (r.cat === 'return') entry.ret += 1;
      else if (r.cat === 'shipment') entry.shipment += 1;
      entry.total += 1;
      map.set(r.who, entry);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [rows, activeMonth]);

  const exportReport = () => {
    downloadCsv(
      'sta-audit-report.csv',
      [L.common.period, L.audit.thEmployee, L.audit.thFactory, L.audit.thProduct, L.audit.thReturns, L.audit.thShipments, L.audit.thTotal],
      report.map((r) => [activeMonthLabel, r.who, r.factory, r.product, r.ret, r.shipment, r.total]),
    );
  };

  return (
    <>
      <PageHead
        eyebrow={L.meta.eyebrow}
        title={d.adminNav[11].label}
        sub={L.support.sub}
        actions={(
          <>
            <button type="button" className="btn ghost" onClick={() => exportAudit(filtered)}><i className="ri-download-2-line" /> {L.audit.export}</button>
            <button type="button" className="btn primary"><i className="ri-user-add-line" /> {L.common.create}</button>
          </>
        )}
      />

      <Card className="mb" title={L.support.tickets} sub={L.support.ticketsSub}>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>{L.common.party}</th>
                <th>{L.common.lang}</th>
                <th>{L.common.priority}</th>
                <th>{L.common.agent}</th>
                <th>{L.common.deadline}</th>
                <th>{L.common.status}</th>
                <th>{L.common.actions}</th>
              </tr>
            </thead>
            <tbody>
              {d.adminTickets.map((tk) => (
                <tr key={tk.party}>
                  <td className="strong">{tk.party}</td>
                  <td className="muted">{tk.lang}</td>
                  <td><Pill tone={tk.priorityTone}>{tk.priority}</Pill></td>
                  <td>{tk.agent}</td>
                  <td className="muted">{tk.deadline}</td>
                  <td><Pill tone={tk.tone}>{tk.status}</Pill></td>
                  <td>
                    <div className="row-between wrap" style={{ gap: 6 }}>
                      <button type="button" className="btn sm primary"><i className="ri-user-follow-line" /> {L.common.assign}</button>
                      <button type="button" className="btn sm ghost" aria-label={L.common.message}><i className="ri-chat-3-line" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="split mb">
        <Card title={L.support.staff} sub={L.support.staffSub}>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>{L.common.name}</th>
                  <th>{L.common.role}</th>
                  <th>{L.common.scope}</th>
                  <th>{L.common.twofa}</th>
                </tr>
              </thead>
              <tbody>
                {d.adminStaff.map((s) => (
                  <tr key={s.name}>
                    <td className="strong">{s.name}</td>
                    <td>{s.role}</td>
                    <td className="muted small">{s.scope}</td>
                    <td><Pill tone={s.twofa ? 'ok' : 'mute'}>{s.twofa ? 'ON' : 'OFF'}</Pill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title={L.support.settings} sub={L.support.settingsSub}>
          <div className="list">
            {settingsRows.map((st) => (
              <div className="list-row" key={st.label}>
                <div className="body">
                  <div className="t">{st.label}</div>
                </div>
                <div className="end strong">{st.value}</div>
              </div>
            ))}
          </div>
          <div className="divider" />
          <button type="button" className="btn sm ghost"><i className="ri-settings-3-line" /> {L.common.edit}</button>
        </Card>
      </div>

      <Card className="mb" title={L.support.audit} sub={L.support.auditSub}>
        <div className="audit-bar">
          <label className="fld grow" htmlFor="audit-q">
            <i className="ri-search-line" />
            <input
              id="audit-q"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={L.audit.searchPlaceholder}
            />
          </label>
          <select value={actor} onChange={(e) => setActor(e.target.value)} aria-label={L.common.who}>
            <option value="all">{L.audit.allActors}</option>
            {actors.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={cat} onChange={(e) => setCat(e.target.value)} aria-label={L.common.type}>
            <option value="all">{L.audit.allTypes}</option>
            <option value="factory">{L.audit.catFactory}</option>
            <option value="product">{L.audit.catProduct}</option>
            <option value="return">{L.audit.catReturn}</option>
            <option value="shipment">{L.audit.catShipment}</option>
            <option value="other">{L.audit.catOther}</option>
          </select>
          <select value={range} onChange={(e) => setRange(e.target.value)} aria-label={L.common.when}>
            <option value="all">{L.audit.allDates}</option>
            <option value="today">{L.audit.today}</option>
            <option value="d7">{L.audit.d7}</option>
            <option value="d30">{L.audit.d30}</option>
          </select>
          <span className="muted small audit-count">{`${filtered.length} ${L.audit.results}`}</span>
          {filtersOn && (
            <button type="button" className="btn sm ghost" onClick={clearFilters}>
              <i className="ri-close-line" /> {L.audit.clear}
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="empty">
            <i className="ri-filter-off-line" />
            <div>{L.audit.noResults}</div>
          </div>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>{L.common.who}</th>
                  <th>{L.common.order}</th>
                  <th>{L.common.type}</th>
                  <th>{L.common.when}</th>
                  <th>{L.common.device}</th>
                  <th>{L.common.before}</th>
                  <th>{L.common.after}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.key}>
                    <td className="strong">{r.who}</td>
                    <td>{r.what}</td>
                    <td><Pill tone="mute">{catLabel[r.cat] ?? r.cat}</Pill></td>
                    <td className="muted">{fmtWhen(r.at)}</td>
                    <td className="muted small">{r.device}</td>
                    <td><Pill tone="mute">{r.before}</Pill></td>
                    <td><Pill tone="info">{r.after}</Pill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="divider" />
        <div className="note">
          <i className="ri-shield-keyhole-line" />
          <span>{L.support.auditNote}</span>
        </div>
      </Card>

      <Card
        title={L.audit.report}
        sub={L.audit.reportSub}
        action={(
          <div className="row-between wrap" style={{ gap: 8 }}>
            <select value={activeMonth} onChange={(e) => setMonth(e.target.value)} aria-label={L.common.period} className="month-select">
              {months.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
            </select>
            <button type="button" className="btn sm primary" onClick={exportReport} disabled={report.length === 0}>
              <i className="ri-download-2-line" /> {L.audit.reportExport}
            </button>
          </div>
        )}
      >
        {report.length === 0 ? (
          <div className="empty">
            <i className="ri-file-chart-line" />
            <div>{L.audit.reportEmpty}</div>
          </div>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>{L.audit.thEmployee}</th>
                  <th>{L.audit.thFactory}</th>
                  <th>{L.audit.thProduct}</th>
                  <th>{L.audit.thReturns}</th>
                  <th>{L.audit.thShipments}</th>
                  <th>{L.audit.thTotal}</th>
                </tr>
              </thead>
              <tbody>
                {report.map((r) => (
                  <tr key={r.who}>
                    <td className="strong">{r.who}</td>
                    <td>{r.factory}</td>
                    <td>{r.product}</td>
                    <td>{r.ret}</td>
                    <td>{r.shipment}</td>
                    <td className="strong accent">{r.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="divider" />
        <div className="note">
          <i className="ri-bar-chart-box-line" />
          <span>{L.audit.reportNote}</span>
        </div>
      </Card>
    </>
  );
}

export const adminMoreViews: Record<string, FunctionComponent> = {
  'admin-finance': AdminFinance,
  'admin-returns': ReturnsLog,
  'admin-logistics': AdminLogistics,
  'admin-compliance': AdminCompliance,
  'admin-marketing': AdminMarketing,
  'admin-support': AdminSupport,
};