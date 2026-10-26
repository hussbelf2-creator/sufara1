import { useState } from 'react';
import type { FunctionComponent } from 'react';
import { useTranslation } from 'react-i18next';
import { useDashboard } from '@/hooks/useDashboard';
import { useAdminOps } from '@/pages/dashboard/lib/adminStore';
import { downloadFile } from '@/pages/dashboard/lib/download';
import { Card, Stat, Pill, PageHead, Bar, MiniTrend, HBars, Toast } from '@/pages/dashboard/components/ui';

/* ---------------------------------------------------------------- overview */
function AdminHome() {
  const { t, i18n } = useTranslation();
  const d = useDashboard();
  const L = d.adminLabels;
  const locale = (i18n.resolvedLanguage || i18n.language || 'ar').match(/^(en|ur|id)/) !== null ? 'en-US' : 'ar-EG';
  const pct = locale.match(/^(en|ur|id)/) !== null ? '%' : '٪';
  const nf = (n: number, digits = 0) => n.toLocaleString(locale, { maximumFractionDigits: digits });
  const currency = t('dashboard.charts.currency');
  const million = t('dashboard.charts.million');
  const thousand = t('dashboard.charts.thousand');
  const last = (arr: number[]) => arr[arr.length - 1];

  return (
    <>
      <PageHead
        eyebrow={L.meta.eyebrow}
        title={L.meta.title}
        sub={L.home.sub}
        actions={(
          <>
            <button type="button" className="btn ghost"><i className="ri-filter-3-line" /> {L.home.period}</button>
            <button type="button" className="btn primary"><i className="ri-download-2-line" /> {L.common.exportExcel}</button>
          </>
        )}
      />

      <div className="grid c4 mb">
        {d.adminStats.map((s) => (
          <Stat key={s.lbl} icon={s.icon} num={s.num} lbl={s.lbl} delta={s.delta} up={s.up} />
        ))}
      </div>

      <Card title={t('dashboard.adminAnalytics.title')} sub={t('dashboard.adminAnalytics.sub')} className="mb">
        <div className="grid c3">
          <MiniTrend
            title={t('dashboard.adminAnalytics.salesTitle')}
            values={d.adminTrend.sales.values}
            labels={d.adminTrend.labels}
            total={`${nf(last(d.adminTrend.sales.values), 2)} ${million} ${currency}`}
            delta={d.adminTrend.sales.delta}
            tone="accent"
            format={(n) => `${nf(n, 2)} ${million} ${currency}`}
          />
          <MiniTrend
            title={t('dashboard.adminAnalytics.ordersTitle')}
            values={d.adminTrend.orders.values}
            labels={d.adminTrend.labels}
            total={nf(last(d.adminTrend.orders.values))}
            delta={d.adminTrend.orders.delta}
            tone="ink"
            format={(n) => nf(n)}
          />
          <MiniTrend
            title={t('dashboard.adminAnalytics.revenueTitle')}
            values={d.adminTrend.revenue.values}
            labels={d.adminTrend.labels}
            total={`${nf(last(d.adminTrend.revenue.values), 1)} ${thousand} ${currency}`}
            delta={d.adminTrend.revenue.delta}
            tone="gold"
            format={(n) => `${nf(n, 1)} ${thousand} ${currency}`}
          />
        </div>
      </Card>

      <div className="split mb">
        <Card title={L.home.alerts} sub={L.home.alertsSub}>
          <div className="list">
            {d.adminAlerts.map((a) => (
              <div className="list-row" key={a.t}>
                <div className="ic"><i className={a.icon} /></div>
                <div className="body">
                  <div className="t">{a.t}</div>
                  <div className="s">{a.s}</div>
                </div>
                <div className="end">
                  <Pill tone={a.tone}>{a.time}</Pill>
                </div>
              </div>
            ))}
          </div>
          <div className="divider" />
          <div className="row-between wrap" style={{ gap: 8 }}>
            <button type="button" className="btn sm primary"><i className="ri-user-add-line" /> {L.common.assign}</button>
            <button type="button" className="btn sm ghost"><i className="ri-checkbox-circle-line" /> {L.common.resolve}</button>
            <button type="button" className="btn sm ghost"><i className="ri-close-circle-line" /> {L.common.close}</button>
          </div>
        </Card>

        <Card title={L.home.sales} sub={L.home.salesSub}>
          <HBars items={d.adminSalesByCountry.map((c) => ({ label: c.country, value: c.pct, display: `${c.value} · ${c.pct}${pct}` }))} />
        </Card>
      </div>

      <Card title={L.home.topFactories} sub={L.home.topFactoriesSub}>
        <HBars tone="gold" items={d.adminTopFactories.map((f) => ({ label: f.name, value: f.score, display: `${f.sales} · ${L.home.ready} ${f.score}%` }))} />
      </Card>
    </>
  );
}

/* --------------------------------------------------------------- factories */
function AdminFactories() {
  const d = useDashboard();
  const L = d.adminLabels;
  const ops = useAdminOps();
  const [toast, setToast] = useState('');
  const flash = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(''), 2200); };

  const requestDocs = () => {
    const lines = [
      `${L.common.requestDocs} — Safeer`,
      '',
      `${L.factories.thFacility}: ____________________`,
      `${L.factories.thCr}: ____________________`,
      `${L.factories.thCity}: ____________________`,
      '',
      `${L.common.docs}:`,
      '  - CR / Commercial registration',
      '  - Industrial license',
      '  - Product list & HS codes',
      '  - Bank account (IBAN)',
      '',
      'Please send the documents to onboarding@safeer.sa',
    ];
    downloadFile('factory-docs-request.txt', lines.join('\n'));
    flash(L.ops.docsRequested);
  };

  return (
    <>
      <PageHead
        eyebrow={L.meta.eyebrow}
        title={d.adminNav[1].label}
        sub={L.factories.sub}
        actions={<button type="button" className="btn ghost"><i className="ri-download-2-line" /> {L.common.exportExcel}</button>}
      />

      <Card className="mb" title={L.factories.pending} sub={L.factories.pendingSub}>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>{L.factories.thFacility}</th>
                <th>{L.factories.thCr}</th>
                <th>{L.factories.thCity}</th>
                <th>{L.common.category}</th>
                <th>{L.common.status}</th>
                <th>{L.common.actions}</th>
              </tr>
            </thead>
            <tbody>
              {d.adminPendingFactories.map((f) => {
                const decision = ops.factoryApprovals[f.cr];
                const status = decision?.status ?? f.status;
                const tone = decision?.tone ?? f.tone;
                return (
                  <tr key={f.cr}>
                    <td className="strong">{f.name}</td>
                    <td className="muted">{f.cr}</td>
                    <td>{f.city}</td>
                    <td>{f.category}</td>
                    <td><Pill tone={tone}>{status}</Pill></td>
                    <td>
                      <div className="row-between wrap" style={{ gap: 6 }}>
                        <button
                          type="button"
                          className="btn sm primary"
                          disabled={decision?.tone === 'ok'}
                          onClick={() => { ops.setFactoryApproval(f.cr, { status: L.ops.statusApproved, tone: 'ok' }, { who: d.adminUser.name, what: `${L.audit.factoryApprove} · ${f.name}`, cat: 'factory', before: status, after: L.ops.statusApproved }); flash(L.ops.factoryApproved); }}
                        >
                          <i className="ri-check-line" /> {L.common.approve}
                        </button>
                        <button
                          type="button"
                          className="btn sm ghost"
                          disabled={decision?.tone === 'danger'}
                          onClick={() => { ops.setFactoryApproval(f.cr, { status: L.ops.statusRejected, tone: 'danger' }, { who: d.adminUser.name, what: `${L.audit.factoryReject} · ${f.name}`, cat: 'factory', before: status, after: L.ops.statusRejected }); flash(L.ops.factoryRejected); }}
                        >
                          <i className="ri-close-line" /> {L.common.reject}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="divider" />
        <button type="button" className="btn sm ghost" onClick={requestDocs}><i className="ri-file-add-line" /> {L.common.requestDocs}</button>
      </Card>

      <Card title={L.factories.list} sub={`${d.adminFactoriesList.length} ${L.factories.listSub}`}>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>{L.common.name}</th>
                <th>{L.common.plan}</th>
                <th>{L.common.products}</th>
                <th>{L.common.sales}</th>
                <th>{L.common.rating}</th>
                <th>{L.common.onTime}</th>
                <th>{L.common.returnsCol}</th>
              </tr>
            </thead>
            <tbody>
              {d.adminFactoriesList.map((f) => (
                <tr key={f.name}>
                  <td className="strong">{f.name}</td>
                  <td><Pill tone="info">{f.plan}</Pill></td>
                  <td>{f.products}</td>
                  <td className="strong">{f.sales}</td>
                  <td><i className="ri-star-fill accent" /> {f.rating}</td>
                  <td>{f.onTime}%</td>
                  <td>{f.returns}%</td>
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

/* ---------------------------------------------------------------- products */
function AdminProducts() {
  const d = useDashboard();
  const L = d.adminLabels;
  const ops = useAdminOps();
  const [toast, setToast] = useState('');
  const flash = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(''), 2200); };

  return (
    <>
      <PageHead
        eyebrow={L.meta.eyebrow}
        title={d.adminNav[2].label}
        sub={L.products.sub}
        actions={<button type="button" className="btn ghost"><i className="ri-node-tree" /> {L.common.category}</button>}
      />

      <Card className="mb" title={L.products.reviewTitle} sub={L.products.reviewSub}>
        <div className="grid c3">
          {d.adminProductReview.map((p) => {
            const decision = ops.productApprovals[p.name];
            return (
              <article className="pcard" key={p.name}>
                <img className="thumb" src={p.img} alt={p.name} />
                <div className="body">
                  <div className="t">{p.name}</div>
                  <div className="s">{p.factory} · {L.products.thHs} {p.hs}</div>
                  <div className="s">{L.products.thAllowed}: {p.countries}</div>
                  {decision && (
                    <div style={{ marginTop: 6 }}><Pill tone={decision.tone}>{decision.status}</Pill></div>
                  )}
                  <div className="row-between" style={{ gap: 8, marginTop: 4 }}>
                    <button
                      type="button"
                      className="btn sm primary"
                      disabled={decision?.tone === 'ok'}
                      onClick={() => { ops.setProductApproval(p.name, { status: L.ops.statusApproved, tone: 'ok' }, { who: d.adminUser.name, what: `${L.audit.productApprove} · ${p.name}`, cat: 'product', before: L.common.review, after: L.ops.statusApproved }); flash(L.ops.productApproved); }}
                    >
                      <i className="ri-check-line" /> {L.common.approve}
                    </button>
                    <button type="button" className="btn sm ghost" onClick={() => flash(L.ops.productEdit)}><i className="ri-pencil-line" /> {L.common.edit}</button>
                    <button
                      type="button"
                      className="btn sm ghost"
                      disabled={decision?.tone === 'danger'}
                      onClick={() => { ops.setProductApproval(p.name, { status: L.ops.statusRejected, tone: 'danger' }, { who: d.adminUser.name, what: `${L.audit.productReject} · ${p.name}`, cat: 'product', before: L.common.review, after: L.ops.statusRejected }); flash(L.ops.productRejected); }}
                    >
                      <i className="ri-close-line" /> {L.common.reject}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </Card>

      <Card title={L.products.allTitle} sub={L.products.allSub}>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>{L.products.thProduct}</th>
                <th>{L.common.factory}</th>
                <th>{L.common.status}</th>
                <th>{L.common.price}</th>
                <th>{L.common.stock}</th>
                <th>{L.common.sales}</th>
                <th>{L.common.translation}</th>
              </tr>
            </thead>
            <tbody>
              {d.adminProductsList.map((p) => (
                <tr key={p.name}>
                  <td className="strong">{p.name}</td>
                  <td>{p.factory}</td>
                  <td><Pill tone={p.tone}>{p.status}</Pill></td>
                  <td className="strong">{p.price}</td>
                  <td>{p.stock}</td>
                  <td>{p.sales}</td>
                  <td>{p.translation}%</td>
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

/* ------------------------------------------------------------------ orders */
function AdminOrders() {
  const d = useDashboard();
  const L = d.adminLabels;
  const ops = useAdminOps();
  const [toast, setToast] = useState('');
  const flash = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(''), 2200); };

  return (
    <>
      <PageHead
        eyebrow={L.meta.eyebrow}
        title={d.adminNav[3].label}
        sub={L.orders.sub}
        actions={<button type="button" className="btn ghost"><i className="ri-download-2-line" /> {L.common.exportExcel}</button>}
      />

      <Card className="mb" title={L.orders.retail} sub={L.orders.retailSub}>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>{L.common.order}</th>
                <th>{L.common.buyer}</th>
                <th>{L.common.country}</th>
                <th>{L.common.value}</th>
                <th>{L.common.payment}</th>
                <th>{L.common.shipping}</th>
                <th>{L.common.ambassador}</th>
              </tr>
            </thead>
            <tbody>
              {d.adminOrders.map((o) => (
                <tr key={o.id}>
                  <td className="strong">{o.id}</td>
                  <td>{o.buyer}</td>
                  <td className="muted">{o.country}</td>
                  <td className="strong">{o.value}</td>
                  <td><Pill tone={o.payTone}>{o.pay}</Pill></td>
                  <td><Pill tone={o.shipTone}>{o.ship}</Pill></td>
                  <td className="muted small">{o.ambassador}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="split mb">
        <Card title={L.orders.rfq} sub={L.orders.rfqSub}>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>{L.common.buyer}</th>
                  <th>{L.common.order}</th>
                  <th>{L.common.country}</th>
                  <th>{L.orders.thDelivery}</th>
                  <th>{L.orders.thOffers}</th>
                </tr>
              </thead>
              <tbody>
                {d.adminRfq.map((r) => (
                  <tr key={r.buyer}>
                    <td className="strong">{r.buyer}</td>
                    <td className="muted">{r.product}</td>
                    <td>{r.country}</td>
                    <td>{r.delivery}</td>
                    <td><Pill tone="info">{r.offers}</Pill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title={L.orders.wholesale} sub={L.orders.wholesaleSub}>
          <div className="stack" style={{ gap: 14 }}>
            {d.adminWholesaleDeals.map((w) => (
              <div key={w.factory}>
                <div className="row-between small mb" style={{ marginBottom: 6 }}>
                  <span className="strong">{w.factory}</span>
                  <span className="muted">{w.buyer} · {w.value}</span>
                </div>
                <div className="row-between small mb" style={{ marginBottom: 6 }}>
                  <span className="muted">{L.orders.thStage}: {w.stage} · {w.terms}</span>
                  <span className="strong">{w.progress}%</span>
                </div>
                <Bar value={w.progress} slim />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title={L.orders.returnsTitle} sub={L.orders.returnsSub}>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>{L.common.order}</th>
                <th>{L.common.factory}</th>
                <th>{L.orders.thReason}</th>
                <th>{L.common.amount}</th>
                <th>{L.common.deadline}</th>
                <th>{L.orders.thDecision}</th>
                <th>{L.common.actions}</th>
              </tr>
            </thead>
            <tbody>
              {d.adminReturns.map((r) => {
                const decision = ops.returnDecisions[r.id];
                const finalDecision = decision?.status ?? r.decision;
                const finalTone = decision?.tone ?? r.tone;
                return (
                  <tr key={r.id}>
                    <td className="strong">{r.order}<div className="s muted small">{r.id}</div></td>
                    <td>{r.item}</td>
                    <td className="muted">{r.reason}</td>
                    <td className="strong">{r.amount}</td>
                    <td>{r.deadline}</td>
                    <td><Pill tone={finalTone}>{finalDecision}</Pill></td>
                    <td>
                      <div className="row-between wrap" style={{ gap: 6 }}>
                        <button
                          type="button"
                          className="btn sm primary"
                          disabled={!!decision}
                          onClick={() => { ops.setReturnDecision(r.id, { status: L.ops.statusArbitrated, tone: 'ok' }, { who: d.adminUser.name, what: `${L.audit.returnArbitrate} · ${r.order}`, cat: 'return', before: finalDecision, after: L.ops.statusArbitrated }); flash(L.ops.returnArbitrated); }}
                        >
                          <i className="ri-scales-3-line" /> {L.common.arbitrate}
                        </button>
                        <button
                          type="button"
                          className="btn sm ghost"
                          disabled={!!decision}
                          onClick={() => { ops.setReturnDecision(r.id, { status: L.ops.statusRefunded, tone: 'ok' }, { who: d.adminUser.name, what: `${L.audit.returnRefund} · ${r.order}`, cat: 'return', before: finalDecision, after: L.ops.statusRefunded }); flash(L.ops.returnRefunded); }}
                        >
                          <i className="ri-arrow-go-back-line" /> {L.common.refund}
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

/* ------------------------------------------------------------ ambassadors */
function AdminAmbassadors() {
  const d = useDashboard();
  const L = d.adminLabels;

  return (
    <>
      <PageHead
        eyebrow={L.meta.eyebrow}
        title={d.adminNav[4].label}
        sub={L.ambassadors.sub}
        actions={<button type="button" className="btn ghost"><i className="ri-download-2-line" /> {L.common.exportExcel}</button>}
      />

      <Card title={d.adminNav[4].label} sub={`${d.adminAmbassadors.length} ${L.common.orders}`}>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>{L.common.name}</th>
                <th>{L.common.country}</th>
                <th>{L.common.level}</th>
                <th>{L.common.source}</th>
                <th>{L.common.clicks}</th>
                <th>{L.common.orders}</th>
                <th>{L.common.sales}</th>
                <th>{L.common.commission}</th>
                <th>{L.common.status}</th>
                <th>{L.common.actions}</th>
              </tr>
            </thead>
            <tbody>
              {d.adminAmbassadors.map((a) => (
                <tr key={a.name}>
                  <td className="strong">{a.name}</td>
                  <td className="muted">{a.country}</td>
                  <td><Pill tone="info">{a.level}</Pill></td>
                  <td className="muted small">{a.source}</td>
                  <td>{a.clicks}</td>
                  <td>{a.orders}</td>
                  <td className="strong">{a.sales}</td>
                  <td className="accent strong">{a.commission}</td>
                  <td><Pill tone={a.tone}>{a.status}</Pill></td>
                  <td>
                    <div className="row-between wrap" style={{ gap: 6 }}>
                      <button type="button" className="btn sm primary"><i className="ri-arrow-up-line" /> {L.common.promote}</button>
                      <button type="button" className="btn sm ghost" aria-label={L.common.message}><i className="ri-chat-3-line" /></button>
                      <button type="button" className="btn sm ghost" aria-label={L.common.suspend}><i className="ri-lock-line" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

export const adminCoreViews: Record<string, FunctionComponent> = {
  'admin-home': AdminHome,
  'admin-factories': AdminFactories,
  'admin-products': AdminProducts,
  'admin-orders': AdminOrders,
  'admin-ambassadors': AdminAmbassadors,
};