import { useState } from 'react';
import type { FunctionComponent } from 'react';
import { useTranslation } from 'react-i18next';
import { useDashboard } from '@/hooks/useDashboard';
import { Card, Stat, Pill, PageHead, Modal, MiniTrend, Ring, Toast } from '@/pages/dashboard/components/ui';
import { QrDownloadModal } from '@/pages/dashboard/components/QrCode';
import { loadJson, saveJson } from '@/pages/dashboard/lib/persist';
import { downloadFile } from '@/pages/dashboard/lib/download';
import { downloadCsv } from '@/pages/dashboard/lib/csv';

type ContentAsset = { name: string; type: string; lang: string; img: string };
type LinkRow = { target: string; url: string; clicks: number; orders: number; rate: string };
type MerchantRow = { name: string; country: string; deal: string; commission: string; expiry: string };

const WITHDRAWALS_KEY = 'sta_amb_withdrawals';

function AmbHome() {
  const { t, i18n } = useTranslation();
  const d = useDashboard();
  const locale = (i18n.resolvedLanguage || i18n.language || 'ar').match(/^(en|ur|id)/) !== null ? 'en-US' : 'ar-EG';
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [period, setPeriod] = useState<'d7' | 'd30' | 'd90'>('d30');
  const [wdOpen, setWdOpen] = useState(false);
  const [wdDone, setWdDone] = useState(false);
  const [wdAmount, setWdAmount] = useState('');
  const [wdMethod, setWdMethod] = useState('0');
  const [wdError, setWdError] = useState('');

  const nf = (n: number, digits = 0) => n.toLocaleString(locale, { maximumFractionDigits: digits });
  const pct = locale.match(/^(en|ur|id)/) !== null ? '%' : '٪';
  const currency = t('dashboard.charts.currency');
  const trend = d.ambTrendPeriods[period];
  const flash = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(''), 2000); };
  const ambSlug = d.ambassadorUser.code.toLowerCase();
  const shareUrl = `https://safeer.sa/r/${ambSlug}`;
  const last = (arr: number[]) => arr[arr.length - 1];

  const copyText = (text: string, msg: string) => {
    navigator.clipboard?.writeText(text).catch(() => undefined);
    flash(msg);
  };
  const copyCode = () => {
    setCopied(true);
    copyText(d.ambassadorUser.code, t('dashboard.common.copied'));
    window.setTimeout(() => setCopied(false), 1600);
  };

  const submitWithdraw = () => {
    const amount = Number(wdAmount.replace(/[^\d.]/g, ''));
    const min = Number(d.ambWallet.minWithdraw.replace(/[^\d.]/g, '')) || 0;
    if (!amount || amount <= 0) { setWdError(t('dashboard.ambWallet.amountRequired')); return; }
    if (min && amount < min) { setWdError(t('dashboard.ambWallet.minAmountError', { min: d.ambWallet.minWithdraw })); return; }
    const list = loadJson<Array<{ amount: number; method: string; date: string }>>(WITHDRAWALS_KEY, []);
    list.unshift({ amount, method: d.ambWallet.methods[Number(wdMethod)] ?? '', date: new Date().toISOString() });
    saveJson(WITHDRAWALS_KEY, list);
    setWdError('');
    setWdDone(true);
  };

  const closeWithdraw = () => {
    setWdOpen(false);
    setWdDone(false);
    setWdAmount('');
    setWdMethod('0');
    setWdError('');
  };

  return (
    <>
      <PageHead
        eyebrow={t('dashboard.ambHome.eyebrow')}
        title={t('dashboard.ambHome.title')}
        sub={t('dashboard.ambHome.sub')}
        actions={<button type="button" className="btn primary" onClick={() => setWdOpen(true)}><i className="ri-money-dollar-box-line" /> {t('dashboard.ambHome.withdraw')}</button>}
      />

      <div className="grid c4 mb">
        {d.ambStats.map((s) => (
          <Stat key={s.lbl} icon={s.icon} num={s.num} lbl={s.lbl} delta={s.delta} up={s.up} />
        ))}
      </div>

      <div className="split mb">
        <Card title={t('dashboard.ambHome.performance')} sub={t('dashboard.ambHome.performanceSub')}>
          <div className="grid c3" style={{ gap: 12 }}>
            <div className="stat" style={{ border: 'none', padding: 0 }}>
              <div className="num">{d.ambSummary.clicks.toLocaleString(locale)}</div><div className="lbl">{t('dashboard.ambHome.clicks')}</div>
            </div>
            <div className="stat" style={{ border: 'none', padding: 0 }}>
              <div className="num">{d.ambSummary.orders}</div><div className="lbl">{t('dashboard.ambHome.attributedOrders')}</div>
            </div>
            <div className="stat" style={{ border: 'none', padding: 0 }}>
              <div className="num">{d.ambSummary.conversion}</div><div className="lbl">{t('dashboard.ambHome.conversion')}</div>
            </div>
          </div>
        </Card>

        <Card title={t('dashboard.ambHome.levelTitle')} sub={`${d.ambSummary.level} → ${d.ambSummary.nextLevel}`}>
          <div className="ring-row mb">
            <Ring
              value={d.ambSummary.progress}
              tone="gold"
              center={`${d.ambSummary.progress}${pct}`}
              sub={t('dashboard.ambHome.ringSub')}
            />
            <div className="ring-side">
              <Pill tone="warn"><i className="ri-medal-line" /> {d.ambSummary.level}</Pill>
              <p className="small muted">{d.ambSummary.toNext}</p>
            </div>
          </div>
          <div className="divider" />
          <div className="code-box">
            <div>
              <div className="small muted">{t('dashboard.ambHome.personalCode')}</div>
              <div className="val">{d.ambassadorUser.code}</div>
            </div>
            <button type="button" className="btn sm ghost" onClick={copyCode}>
              <i className={copied ? 'ri-check-line' : 'ri-file-copy-line'} /> {copied ? t('dashboard.common.copied') : t('dashboard.common.copy')}
            </button>
          </div>
        </Card>
      </div>

      <Card
        title={t('dashboard.ambAnalytics.title')}
        sub={t('dashboard.ambAnalytics.sub')}
        className="mb"
        action={(
          <div className="seg compact">
            <button type="button" className={period === 'd7' ? 'is-on' : ''} onClick={() => setPeriod('d7')}>{t('dashboard.ambAnalytics.period7')}</button>
            <button type="button" className={period === 'd30' ? 'is-on' : ''} onClick={() => setPeriod('d30')}>{t('dashboard.ambAnalytics.period30')}</button>
            <button type="button" className={period === 'd90' ? 'is-on' : ''} onClick={() => setPeriod('d90')}>{t('dashboard.ambAnalytics.period90')}</button>
          </div>
        )}
      >
        <div className="grid c3">
          <MiniTrend
            title={t('dashboard.ambAnalytics.clicksTitle')}
            values={trend.clicks.values}
            labels={trend.labels}
            total={nf(last(trend.clicks.values))}
            delta={trend.clicks.delta}
            tone="accent"
            format={(n) => nf(n)}
          />
          <MiniTrend
            title={t('dashboard.ambAnalytics.ordersTitle')}
            values={trend.orders.values}
            labels={trend.labels}
            total={nf(last(trend.orders.values))}
            delta={trend.orders.delta}
            tone="ink"
            format={(n) => nf(n)}
          />
          <MiniTrend
            title={t('dashboard.ambAnalytics.commissionsTitle')}
            values={trend.commissions.values}
            labels={trend.labels}
            total={`${nf(last(trend.commissions.values))} ${currency}`}
            delta={trend.commissions.delta}
            tone="gold"
            format={(n) => `${nf(n)} ${currency}`}
          />
        </div>
      </Card>

      <Card title={t('dashboard.ambHome.quickShare')} sub={t('dashboard.ambHome.quickShareSub')}>
        <div className="grid c3">
          <div className="card tight">
            <div className="t strong mb">{t('dashboard.ambHome.card1Title')}</div>
            <div className="s small muted mb">{t('dashboard.ambHome.card1Text')}</div>
            <button type="button" className="btn sm block ghost" onClick={() => copyText(shareUrl, t('dashboard.common.copied'))}><i className="ri-link" /> {t('dashboard.ambHome.card1Btn')}</button>
          </div>
          <div className="card tight">
            <div className="t strong mb">{t('dashboard.ambHome.card2Title')}</div>
            <div className="s small muted mb">{t('dashboard.ambHome.card2Text')}</div>
            <button type="button" className="btn sm block ghost" onClick={() => setQrOpen(true)}><i className="ri-qr-code-line" /> {t('dashboard.ambHome.card2Btn')}</button>
          </div>
          <div className="card tight">
            <div className="t strong mb">{t('dashboard.ambHome.card3Title')}</div>
            <div className="s small muted mb">{t('dashboard.ambHome.card3Text')}</div>
            <button type="button" className="btn sm block ghost" onClick={() => copyText(shareUrl, t('dashboard.ambContent.shareToast'))}><i className="ri-share-line" /> {t('dashboard.ambHome.card3Btn')}</button>
          </div>
        </div>
      </Card>

      <Modal open={wdOpen} onClose={closeWithdraw} title={t('dashboard.ambWallet.modalTitle')} sub={t('dashboard.ambWallet.modalSub', { avail: d.ambWallet.available, fee: d.ambWallet.fee })}>
        {wdDone ? (
          <>
            <div className="note"><i className="ri-checkbox-circle-line" /> {t('dashboard.ambWallet.doneNote')}</div>
            <div className="modal-actions"><button type="button" className="btn primary" onClick={closeWithdraw}>{t('dashboard.ambWallet.done')}</button></div>
          </>
        ) : (
          <>
            <div className="field">
              <label htmlFor="amb-wd-amount">{t('dashboard.ambWallet.amountLabel')}</label>
              <input id="amb-wd-amount" type="text" value={wdAmount} onChange={(e) => setWdAmount(e.target.value)} placeholder={t('dashboard.ambWallet.amountPlaceholder')} />
            </div>
            <div className="field">
              <label htmlFor="amb-wd-method">{t('dashboard.ambWallet.methodLabel')}</label>
              <select id="amb-wd-method" value={wdMethod} onChange={(e) => setWdMethod(e.target.value)}>
                {d.ambWallet.methods.map((m, i) => <option key={m} value={String(i)}>{m}</option>)}
              </select>
            </div>
            {wdError && (
              <div className="note" style={{ marginTop: 14 }}>
                <i className="ri-error-warning-line" style={{ color: '#b3261e' }} />
                <span style={{ color: '#b3261e' }}>{wdError}</span>
              </div>
            )}
            <div className="modal-actions">
              <button type="button" className="btn primary" onClick={submitWithdraw}>{t('dashboard.ambWallet.confirm')}</button>
              <button type="button" className="btn ghost" onClick={closeWithdraw}>{t('dashboard.common.cancel')}</button>
            </div>
          </>
        )}
      </Modal>

      <QrDownloadModal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        value={`safeer.sa/r/${d.ambassadorUser.code.toLowerCase()}`}
        target={t('dashboard.ambLinks.publicLink')}
        onDownload={() => { setQrOpen(false); flash(t('dashboard.qr.downloadToast')); }}
      />
      <Toast message={toast} />
    </>
  );
}

function AmbLinks() {
  const { t, i18n } = useTranslation();
  const d = useDashboard();
  const locale = (i18n.resolvedLanguage || i18n.language || 'ar').match(/^(en|ur|id)/) !== null ? 'en-US' : 'ar-EG';
  const [custom, setCustom] = useState<LinkRow[]>(() => loadJson<LinkRow[]>('sta_amb_links', []));
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('0');
  const [name, setName] = useState('');
  const [qrOpen, setQrOpen] = useState(false);
  const [qrValue, setQrValue] = useState('');
  const [qrTarget, setQrTarget] = useState('');
  const [toast, setToast] = useState('');
  const flash = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(''), 2000); };
  const publicUrl = `safeer.sa/r/${d.ambassadorUser.code.toLowerCase()}`;
  const links: LinkRow[] = [...custom, ...d.ambLinks];
  const typeLabels = [
    t('dashboard.ambLinks.typeProduct'),
    t('dashboard.ambLinks.typeCategory'),
    t('dashboard.ambLinks.typeFactory'),
    t('dashboard.ambLinks.typeCampaign'),
  ];

  const copyText = (text: string, msg: string) => {
    navigator.clipboard?.writeText(text).catch(() => undefined);
    flash(msg);
  };
  const openQr = (value: string, target: string) => { setQrValue(value); setQrTarget(target); setQrOpen(true); };

  const createLink = () => {
    if (!name.trim()) { flash(t('dashboard.ambLinks.linkRequired')); return; }
    const row: LinkRow = {
      target: `${typeLabels[Number(type)]} — ${name.trim()}`,
      url: `safeer.sa/r/${d.ambassadorUser.code.toLowerCase()}-${Date.now().toString(36)}`,
      clicks: 0,
      orders: 0,
      rate: '0%',
    };
    const next = [row, ...custom];
    setCustom(next);
    saveJson('sta_amb_links', next);
    setOpen(false);
    setName('');
    setType('0');
    flash(t('dashboard.ambLinks.createdLinkToast'));
  };

  return (
    <>
      <PageHead
        eyebrow={t('dashboard.ambLinks.eyebrow')}
        title={t('dashboard.ambLinks.title')}
        sub={t('dashboard.ambLinks.sub')}
        actions={<button type="button" className="btn primary" onClick={() => setOpen(true)}><i className="ri-add-line" /> {t('dashboard.ambLinks.createLink')}</button>}
      />

      <div className="grid c2 mb">
        <div className="code-box">
          <div>
            <div className="small muted">{t('dashboard.ambLinks.personalCode')}</div>
            <div className="val">{d.ambassadorUser.code}</div>
          </div>
          <button type="button" className="btn sm ghost" onClick={() => copyText(d.ambassadorUser.code, t('dashboard.common.copied'))}><i className="ri-file-copy-line" /> {t('dashboard.common.copy')}</button>
        </div>
        <div className="code-box">
          <div>
            <div className="small muted">{t('dashboard.ambLinks.publicLink')}</div>
            <div className="val">{publicUrl}</div>
          </div>
          <button type="button" className="btn sm primary" onClick={() => openQr(publicUrl, t('dashboard.ambLinks.publicLink'))}><i className="ri-qr-code-line" /> QR</button>
        </div>
      </div>

      <Card title={t('dashboard.ambLinks.performance')} sub={t('dashboard.ambLinks.activeCount', { count: links.length })}>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>{t('dashboard.ambLinks.thTarget')}</th>
                <th>{t('dashboard.ambLinks.thUrl')}</th>
                <th>{t('dashboard.ambLinks.thClicks')}</th>
                <th>{t('dashboard.ambLinks.thOrders')}</th>
                <th>{t('dashboard.ambLinks.thRate')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {links.map((l, i) => (
                <tr key={`${l.url}-${i}`}>
                  <td className="tbl-name"><div className="t">{l.target}</div></td>
                  <td className="muted small">{l.url}</td>
                  <td className="strong">{l.clicks.toLocaleString(locale)}</td>
                  <td className="strong accent">{l.orders}</td>
                  <td><Pill tone="info">{l.rate}</Pill></td>
                  <td>
                    <div className="row-between" style={{ gap: 6 }}>
                      <button type="button" className="btn sm ghost" aria-label={t('dashboard.ambLinks.copyAria')} onClick={() => copyText(l.url, t('dashboard.common.copied'))}><i className="ri-file-copy-line" /></button>
                      <button type="button" className="btn sm ghost" aria-label={t('dashboard.ambLinks.qrAria')} onClick={() => openQr(l.url, l.target)}><i className="ri-qr-code-line" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={t('dashboard.ambLinks.modalTitle')} sub={t('dashboard.ambLinks.modalSub')}>
        <div className="field">
          <label htmlFor="lk-type">{t('dashboard.ambLinks.typeLabel')}</label>
          <select id="lk-type" value={type} onChange={(e) => setType(e.target.value)}>
            {typeLabels.map((label, i) => <option key={label} value={String(i)}>{label}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="lk-target">{t('dashboard.ambLinks.nameLabel')}</label>
          <input id="lk-target" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('dashboard.ambLinks.namePlaceholder')} />
        </div>
        <div className="modal-actions">
          <button type="button" className="btn primary" onClick={createLink}>{t('dashboard.common.create')}</button>
          <button type="button" className="btn ghost" onClick={() => setOpen(false)}>{t('dashboard.common.cancel')}</button>
        </div>
      </Modal>

      <QrDownloadModal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        value={qrValue}
        target={qrTarget}
        onDownload={() => { setQrOpen(false); flash(t('dashboard.qr.downloadToast')); }}
      />
      <Toast message={toast} />
    </>
  );
}

function AmbMyPage() {
  const { t } = useTranslation();
  const d = useDashboard();
  const [bio, setBio] = useState(() => loadJson<string>('sta_amb_page_bio', t('dashboard.ambPage.bioDefault')));
  const [published, setPublished] = useState(() => loadJson<boolean>('sta_amb_page_published', false));
  const [toast, setToast] = useState('');
  const flash = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(''), 2000); };

  const publish = () => {
    if (!bio.trim()) { flash(t('dashboard.ambPage.bioRequired')); return; }
    saveJson('sta_amb_page_bio', bio);
    saveJson('sta_amb_page_published', true);
    setPublished(true);
    flash(t('dashboard.ambPage.publishToast'));
  };

  return (
    <>
      <PageHead
        eyebrow={t('dashboard.ambPage.eyebrow')}
        title={t('dashboard.ambPage.title')}
        sub={t('dashboard.ambPage.sub')}
        actions={published ? <Pill tone="ok"><i className="ri-checkbox-circle-line" /> {t('dashboard.ambPage.publishedBadge')}</Pill> : undefined}
      />
      <div className="split wide">
        <Card title={t('dashboard.ambPage.preview')} sub={`safeer.sa/ahmad-jo · ${d.ambassadorUser.country}`}>
          <div className="card" style={{ background: 'var(--surface)' }}>
            <div className="row-between mb">
              <div className="dash-profile" style={{ margin: 0, background: 'var(--panel)' }}>
                <div className="av">{d.ambassadorUser.initials}</div>
                <div>
                  <div className="who-name">{d.ambassadorUser.name}</div>
                  <div className="who-sub">{t('dashboard.ambPage.ambassadorBadge', { country: d.ambassadorUser.country })}</div>
                </div>
              </div>
              <Pill tone="ok"><i className="ri-verified-badge-line" /> {t('dashboard.ambPage.verified')}</Pill>
            </div>
            <p className="small mb">{bio}</p>
            <div className="media">
              {d.ambContent.slice(0, 3).map((c) => (
                <div className="tile" key={c.name}>
                  <img className="thumb" src={c.img} alt={c.name} />
                  <div className="meta"><div className="t">{c.name}</div></div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card title={t('dashboard.ambPage.edit')}>
          <div className="field">
            <label htmlFor="bio">{t('dashboard.ambPage.bioLabel')}</label>
            <textarea id="bio" maxLength={500} value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="pick">{t('dashboard.ambPage.pickLabel')}</label>
            <select id="pick">
              {d.favoriteProducts.map((p) => <option key={p.name}>{p.name}</option>)}
            </select>
          </div>
          <button type="button" className="btn primary block" onClick={publish}><i className="ri-save-3-line" /> {t('dashboard.ambPage.savePublish')}</button>
        </Card>
      </div>
      <Toast message={toast} />
    </>
  );
}

function AmbContent() {
  const { t } = useTranslation();
  const d = useDashboard();
  const [preview, setPreview] = useState<ContentAsset | null>(null);
  const [toast, setToast] = useState('');
  const flash = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(''), 2000); };

  const shareLink = `https://safeer.sa/r/${d.ambassadorUser.code.toLowerCase()}`;
  const share = () => {
    navigator.clipboard?.writeText(shareLink).catch(() => undefined);
    flash(t('dashboard.ambContent.shareToast'));
  };
  const download = (asset: ContentAsset) => {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${asset.name}</title></head><body style="font-family:sans-serif;padding:24px"><h2>${asset.name}</h2><p>${asset.type} · ${asset.lang}</p><img src="${asset.img}" alt="${asset.name}" style="max-width:100%;border-radius:8px" /><p>${shareLink}</p></body></html>`;
    downloadFile(`${asset.name}.html`, html, 'text/html');
    flash(t('dashboard.ambContent.downloadToast'));
  };

  return (
    <>
      <PageHead
        eyebrow={t('dashboard.ambContent.eyebrow')}
        title={t('dashboard.ambContent.title')}
        sub={t('dashboard.ambContent.sub')}
      />
      <div className="media">
        {d.ambContent.map((c) => (
          <div className="tile clickable" key={c.name} onClick={() => setPreview(c)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') setPreview(c); }}>
            <img className="thumb" src={c.img} alt={c.name} />
            <div className="meta">
              <div className="row-between mb" style={{ marginBottom: 8 }}>
                <div>
                  <div className="t">{c.name}</div>
                  <div className="s">{c.type} · {c.lang}</div>
                </div>
              </div>
              <div className="row-between" style={{ gap: 8 }}>
                <button type="button" className="btn sm ghost" onClick={(e) => { e.stopPropagation(); download(c); }}><i className="ri-download-2-line" /> {t('dashboard.common.download')}</button>
                <button type="button" className="btn sm primary" onClick={(e) => { e.stopPropagation(); share(); }}><i className="ri-share-line" /> {t('dashboard.common.share')}</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={!!preview}
        onClose={() => setPreview(null)}
        title={preview?.name ?? ''}
        sub={preview ? t('dashboard.ambContent.previewSub', { type: preview.type, lang: preview.lang }) : ''}
      >
        {preview && (
          <>
            <div className="preview-media">
              <img src={preview.img} alt={preview.name} />
            </div>
            <p className="small muted" style={{ marginTop: 14 }}>{t('dashboard.ambContent.previewNote')}</p>
            <div className="modal-actions">
              <button type="button" className="btn primary" onClick={() => download(preview)}><i className="ri-download-2-line" /> {t('dashboard.common.download')}</button>
              <button type="button" className="btn ghost" onClick={share}><i className="ri-share-line" /> {t('dashboard.common.share')}</button>
              <button type="button" className="btn ghost" onClick={() => setPreview(null)}>{t('dashboard.common.close')}</button>
            </div>
          </>
        )}
      </Modal>
      <Toast message={toast} />
    </>
  );
}

function AmbAttributed() {
  const { t } = useTranslation();
  const d = useDashboard();
  const [toast, setToast] = useState('');
  const flash = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(''), 2000); };

  const exportCsv = () => {
    downloadCsv(
      'attributed-orders.csv',
      [t('dashboard.ambAttr.thDate'), t('dashboard.ambAttr.thCountry'), t('dashboard.ambAttr.thValue'), t('dashboard.ambAttr.thCommission'), t('dashboard.ambAttr.thStatus')],
      d.ambOrders.map((o) => [o.date, o.country, o.value, o.commission, o.status]),
    );
    flash(t('dashboard.ambAttr.exportToast'));
  };

  return (
    <>
      <PageHead
        eyebrow={t('dashboard.ambAttr.eyebrow')}
        title={t('dashboard.ambAttr.title')}
        sub={t('dashboard.ambAttr.sub')}
        actions={<button type="button" className="btn ghost" onClick={exportCsv}><i className="ri-download-2-line" /> {t('dashboard.common.export')}</button>}
      />
      <div className="note mb">
        <i className="ri-shield-user-line" />
        <span>{t('dashboard.ambAttr.privacy')}</span>
      </div>
      <Card title={t('dashboard.ambAttr.ledger')} sub={t('dashboard.ambAttr.ledgerSub', { count: d.ambOrders.length })}>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>{t('dashboard.ambAttr.thDate')}</th>
                <th>{t('dashboard.ambAttr.thCountry')}</th>
                <th>{t('dashboard.ambAttr.thValue')}</th>
                <th>{t('dashboard.ambAttr.thCommission')}</th>
                <th>{t('dashboard.ambAttr.thStatus')}</th>
              </tr>
            </thead>
            <tbody>
              {d.ambOrders.map((o, i) => (
                <tr key={i}>
                  <td className="muted">{o.date}</td>
                  <td>{o.country}</td>
                  <td className="strong">{o.value}</td>
                  <td className="strong accent">{o.commission}</td>
                  <td><Pill tone={o.tone}>{o.status}</Pill></td>
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

function AmbMerchants() {
  const { t } = useTranslation();
  const d = useDashboard();
  const [referred, setReferred] = useState<MerchantRow[]>(() => loadJson<MerchantRow[]>('sta_amb_merchants', []));
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const flash = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(''), 2000); };
  const merchants: MerchantRow[] = [...d.ambMerchants, ...referred];

  const submit = () => {
    if (!name.trim() || !country.trim()) { setError(t('dashboard.ambMerchants.referralRequired')); return; }
    const row: MerchantRow = { name: name.trim(), country: country.trim(), deal: '—', commission: '—', expiry: '—' };
    const next = [row, ...referred];
    setReferred(next);
    saveJson('sta_amb_merchants', next);
    setOpen(false);
    setName('');
    setCountry('');
    setError('');
    flash(t('dashboard.ambMerchants.referralSentToast'));
  };

  return (
    <>
      <PageHead
        eyebrow={t('dashboard.ambMerchants.eyebrow')}
        title={t('dashboard.ambMerchants.title')}
        sub={t('dashboard.ambMerchants.sub')}
        actions={<button type="button" className="btn primary" onClick={() => setOpen(true)}><i className="ri-add-line" /> {t('dashboard.ambMerchants.referNew')}</button>}
      />
      <div className="grid c3">
        {merchants.map((m, i) => (
          <Card key={`${m.name}-${i}`} className="tight">
            <div className="card-head">
              <div>
                <h3>{m.name}</h3>
                <div className="sub">{m.country}</div>
              </div>
              <i className="ri-store-2-line accent" style={{ fontSize: 20 }} />
            </div>
            <div className="list">
              <div className="list-row"><div className="body"><div className="s">{t('dashboard.ambMerchants.dealValue')}</div><div className="t strong">{m.deal}</div></div></div>
              <div className="list-row"><div className="body"><div className="s">{t('dashboard.ambMerchants.yourCommission')}</div><div className="t strong accent">{m.commission}</div></div></div>
              <div className="list-row"><div className="body"><div className="s">{t('dashboard.ambMerchants.linkedUntil')}</div><div className="t small">{m.expiry}</div></div></div>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={t('dashboard.ambMerchants.referModalTitle')} sub={t('dashboard.ambMerchants.referModalSub')}>
        <div className="field">
          <label htmlFor="mr-name">{t('dashboard.ambMerchants.merchantNameLabel')}</label>
          <input id="mr-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('dashboard.ambMerchants.merchantNamePlaceholder')} />
        </div>
        <div className="field">
          <label htmlFor="mr-country">{t('dashboard.ambMerchants.merchantCountryLabel')}</label>
          <input id="mr-country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder={t('dashboard.ambMerchants.merchantCountryPlaceholder')} />
        </div>
        {error && (
          <div className="note" style={{ marginTop: 14 }}>
            <i className="ri-error-warning-line" style={{ color: '#b3261e' }} />
            <span style={{ color: '#b3261e' }}>{error}</span>
          </div>
        )}
        <div className="modal-actions">
          <button type="button" className="btn primary" onClick={submit}>{t('dashboard.ambMerchants.sendReferral')}</button>
          <button type="button" className="btn ghost" onClick={() => setOpen(false)}>{t('dashboard.common.cancel')}</button>
        </div>
      </Modal>
      <Toast message={toast} />
    </>
  );
}

export const ambCoreViews: Record<string, FunctionComponent> = {
  'amb-home': AmbHome,
  links: AmbLinks,
  mypage: AmbMyPage,
  content: AmbContent,
  attributed: AmbAttributed,
  merchants: AmbMerchants,
};