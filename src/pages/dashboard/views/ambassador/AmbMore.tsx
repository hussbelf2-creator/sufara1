import { useState } from 'react';
import type { FunctionComponent } from 'react';
import { useTranslation } from 'react-i18next';
import { useDashboard } from '@/hooks/useDashboard';
import { Card, Pill, PageHead, Modal, Ring, HBars, Stat, Toast } from '@/pages/dashboard/components/ui';
import { QrDownloadModal } from '@/pages/dashboard/components/QrCode';
import { loadJson, saveJson } from '@/pages/dashboard/lib/persist';
import { usePlatformConfig } from '@/config/store';

type MemberRow = { name: string; items: string; share: string };

function AmbGroup() {
  const { t } = useTranslation();
  const d = useDashboard();
  const [invited, setInvited] = useState<MemberRow[]>(() => loadJson<MemberRow[]>('sta_amb_group_members', []));
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(() => loadJson<boolean>('sta_amb_group_confirmed', false));
  const [toast, setToast] = useState('');
  const flash = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(''), 2000); };
  const members: MemberRow[] = [...d.ambGroupMembers, ...invited];

  const invite = () => {
    if (!name.trim() || !contact.trim()) { setError(t('dashboard.ambGroup.inviteRequired')); return; }
    const row: MemberRow = { name: name.trim(), items: '—', share: '—' };
    const next = [row, ...invited];
    setInvited(next);
    saveJson('sta_amb_group_members', next);
    setOpen(false);
    setName('');
    setContact('');
    setError('');
    flash(t('dashboard.ambGroup.invitedToast'));
  };

  const confirmOrder = () => {
    saveJson('sta_amb_group_confirmed', true);
    setConfirmed(true);
    flash(t('dashboard.ambGroup.confirmToast'));
  };

  return (
    <>
      <PageHead
        eyebrow={t('dashboard.ambGroup.eyebrow')}
        title={t('dashboard.ambGroup.title')}
        sub={t('dashboard.ambGroup.sub')}
        actions={<button type="button" className="btn primary" onClick={() => setOpen(true)}><i className="ri-user-add-line" /> {t('dashboard.ambGroup.invite')}</button>}
      />
      <div className="split">
        <Card title={t('dashboard.ambGroup.members')} sub={t('dashboard.ambGroup.membersSub', { count: members.length })}>
          <div className="list">
            {members.map((m, i) => (
              <div className="list-row" key={`${m.name}-${i}`}>
                <div className="ic"><i className="ri-user-3-line" /></div>
                <div className="body">
                  <div className="t">{m.name}</div>
                  <div className="s">{m.items}</div>
                </div>
                <div className="end strong">{m.share}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card title={t('dashboard.ambGroup.summary')}>
          <div className="stat" style={{ border: 'none', padding: 0 }}>
            <div className="num accent">٨٩٦ ر.س</div>
            <div className="lbl">{t('dashboard.ambGroup.total')}</div>
          </div>
          <div className="divider" />
          <div className="list">
            <div className="list-row"><div className="body"><div className="s">{t('dashboard.ambGroup.shippingSaving')}</div><div className="t strong">{t('dashboard.ambGroup.shippingSavingValue')}</div></div></div>
            <div className="list-row"><div className="body"><div className="s">{t('dashboard.ambGroup.deliveryAddress')}</div><div className="t small">{t('dashboard.ambGroup.deliveryAddressValue')}</div></div></div>
          </div>
          {confirmed ? (
            <Pill tone="ok"><i className="ri-checkbox-circle-line" /> {t('dashboard.ambGroup.joined')}</Pill>
          ) : (
            <button type="button" className="btn block primary" style={{ marginTop: 12 }} onClick={confirmOrder}><i className="ri-shopping-bag-3-line" /> {t('dashboard.ambGroup.confirm')}</button>
          )}
        </Card>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={t('dashboard.ambGroup.inviteModalTitle')} sub={t('dashboard.ambGroup.inviteModalSub')}>
        <div className="field">
          <label htmlFor="gr-name">{t('dashboard.ambGroup.inviteNameLabel')}</label>
          <input id="gr-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('dashboard.ambGroup.inviteNamePlaceholder')} />
        </div>
        <div className="field">
          <label htmlFor="gr-contact">{t('dashboard.ambGroup.inviteContactLabel')}</label>
          <input id="gr-contact" value={contact} onChange={(e) => setContact(e.target.value)} placeholder={t('dashboard.ambGroup.inviteContactPlaceholder')} />
        </div>
        {error && (
          <div className="note" style={{ marginTop: 14 }}>
            <i className="ri-error-warning-line" style={{ color: '#b3261e' }} />
            <span style={{ color: '#b3261e' }}>{error}</span>
          </div>
        )}
        <div className="modal-actions">
          <button type="button" className="btn primary" onClick={invite}>{t('dashboard.ambGroup.inviteSend')}</button>
          <button type="button" className="btn ghost" onClick={() => setOpen(false)}>{t('dashboard.common.cancel')}</button>
        </div>
      </Modal>
      <Toast message={toast} />
    </>
  );
}

function AmbWallet() {
  const { t } = useTranslation();
  const d = useDashboard();
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('0');
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const flash = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(''), 2200); };

  const close = () => { setOpen(false); setDone(false); setAmount(''); setMethod('0'); setError(''); };
  const submit = () => {
    const value = Number(amount.replace(/[^\d.]/g, ''));
    const min = Number(d.ambWallet.minWithdraw.replace(/[^\d.]/g, '')) || 0;
    if (!value || value <= 0) { setError(t('dashboard.ambWallet.amountRequired')); return; }
    if (min && value < min) { setError(t('dashboard.ambWallet.minAmountError', { min: d.ambWallet.minWithdraw })); return; }
    const list = loadJson<Array<{ amount: number; method: string; date: string }>>('sta_amb_withdrawals', []);
    list.unshift({ amount: value, method: d.ambWallet.methods[Number(method)] ?? '', date: new Date().toISOString() });
    saveJson('sta_amb_withdrawals', list);
    setError('');
    setDone(true);
    flash(t('dashboard.ambWallet.withdrewToast'));
  };

  return (
    <>
      <PageHead
        eyebrow={t('dashboard.ambWallet.eyebrow')}
        title={t('dashboard.ambWallet.title')}
        sub={t('dashboard.ambWallet.sub')}
        actions={<button type="button" className="btn primary" onClick={() => setOpen(true)}><i className="ri-bank-card-line" /> {t('dashboard.ambWallet.withdrawRequest')}</button>}
      />
      <div className="grid c3 mb">
        <Stat icon="ri-wallet-3-line" num={d.ambWallet.available} lbl={t('dashboard.ambWallet.available')} />
        <Stat icon="ri-time-line" num={d.ambWallet.pending} lbl={t('dashboard.ambWallet.pending')} />
        <Stat icon="ri-percent-line" num={d.ambWallet.fee} lbl={t('dashboard.ambWallet.feeLabel', { min: d.ambWallet.minWithdraw })} />
      </div>

      <div className="split mb">
        <Card title={t('dashboard.ambWallet.movements')} sub={t('dashboard.ambWallet.movementsSub')}>
          <div className="list">
            {d.ambWallet.movements.map((m, i) => (
              <div className="list-row" key={i}>
                <div className="ic"><i className={m.tone === 'in' ? 'ri-arrow-down-line' : 'ri-arrow-up-line'} /></div>
                <div className="body"><div className="t">{m.label}</div><div className="s">{m.date}</div></div>
                <div className="end strong" style={{ color: m.tone === 'in' ? '#2f7d32' : 'var(--text)' }}>{m.amount}</div>
              </div>
            ))}
          </div>
        </Card>
        <div className="stack">
          <Card title={t('dashboard.ambWallet.sources')} sub={t('dashboard.ambWallet.sourcesSub')}>
            <HBars items={d.ambWallet.sources} tone="gold" />
          </Card>
          <Card title={t('dashboard.ambWallet.methods')} sub={t('dashboard.ambWallet.methodsSub')}>
            <div className="list">
              {d.ambWallet.methods.map((m) => (
                <div className="list-row" key={m}>
                  <div className="ic"><i className="ri-bank-line" /></div>
                  <div className="body"><div className="t small">{m}</div></div>
                  <div className="end"><i className="ri-arrow-left-s-line muted" /></div>
                </div>
              ))}
            </div>
            <div className="note" style={{ marginTop: 12 }}><i className="ri-information-line" /> {t('dashboard.ambWallet.note')}</div>
          </Card>
        </div>
      </div>

      <Modal open={open} onClose={close} title={t('dashboard.ambWallet.modalTitle')} sub={t('dashboard.ambWallet.modalSub', { avail: d.ambWallet.available, fee: d.ambWallet.fee })}>
        {done ? (
          <>
            <div className="note"><i className="ri-checkbox-circle-line" /> {t('dashboard.ambWallet.doneNote')}</div>
            <div className="modal-actions"><button type="button" className="btn primary" onClick={close}>{t('dashboard.ambWallet.done')}</button></div>
          </>
        ) : (
          <>
            <div className="field">
              <label htmlFor="wd-amount">{t('dashboard.ambWallet.amountLabel')}</label>
              <input id="wd-amount" type="text" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={t('dashboard.ambWallet.amountPlaceholder')} />
            </div>
            <div className="field">
              <label htmlFor="wd-method">{t('dashboard.ambWallet.methodLabel')}</label>
              <select id="wd-method" value={method} onChange={(e) => setMethod(e.target.value)}>
                {d.ambWallet.methods.map((m, i) => <option key={m} value={String(i)}>{m}</option>)}
              </select>
            </div>
            {error && (
              <div className="note" style={{ marginTop: 14 }}>
                <i className="ri-error-warning-line" style={{ color: '#b3261e' }} />
                <span style={{ color: '#b3261e' }}>{error}</span>
              </div>
            )}
            <div className="modal-actions">
              <button type="button" className="btn primary" onClick={submit}>{t('dashboard.ambWallet.confirm')}</button>
              <button type="button" className="btn ghost" onClick={close}>{t('dashboard.common.cancel')}</button>
            </div>
          </>
        )}
      </Modal>
      <Toast message={toast} />
    </>
  );
}

function AmbLevels() {
  /* The commission rates come from the active platform settings, so this
     table can never drift from what the server actually pays. */
  const cfg = usePlatformConfig();
  const { i18n: levI18n } = useTranslation();
  const levAr = (levI18n.resolvedLanguage || levI18n.language || 'ar').startsWith('ar');
  const pctx = (n: number) => `${(n * 100).toLocaleString(levAr ? 'ar-EG' : 'en-US', { maximumFractionDigits: 1 })}${levAr ? '٪' : '%'}`;
  const dAll = useDashboard();
  const levelRows = [
    ...cfg.ambassador.retailTiers.map((tr, idx) => ({
      name: levAr ? tr.labelAr : tr.labelEn,
      retail: pctx(tr.rate),
      wholesale: `${pctx(cfg.ambassador.wholesale.value)} · ${levAr ? `متكررة ${cfg.ambassador.wholesaleRecurringMonths} شهرًا` : `recurring ${cfg.ambassador.wholesaleRecurringMonths} months`}`,
      reach: tr.minOrders === 0
        ? (levAr ? 'عند الاعتماد' : 'On approval')
        : (levAr ? `${tr.minOrders} طلبًا مسلّمًا خلال ${cfg.ambassador.tierWindowDays} يومًا` : `${tr.minOrders} delivered orders in ${cfg.ambassador.tierWindowDays} days`),
      perks: dAll.ambLevels[idx]?.perks ?? '',
      tone: '',
    })),
    {
      name: levAr ? 'سفير قائد (دور)' : 'Leader ambassador (role)',
      retail: levAr ? 'حسب مستواه' : 'By own tier',
      wholesale: levAr ? `+ ${pctx(cfg.ambassador.leaderBonus)} على الفريق المباشر` : `+ ${pctx(cfg.ambassador.leaderBonus)} on the direct team`,
      reach: levAr ? 'تعيين من الإدارة (وكلاء العمرة والحج)' : 'Appointed by admin (Umrah & Hajj agents)',
      perks: levAr ? 'فريق بمستوى واحد، ودفعات بطاقات QR، وتقارير' : 'One-level team, QR card batches, reports',
      tone: 'ok',
    },
  ];
  const { t, i18n } = useTranslation();
  const d = useDashboard();
  const pct = (i18n.resolvedLanguage || i18n.language || 'ar').match(/^(en|ur|id)/) !== null ? '%' : '٪';
  const [joined, setJoined] = useState<string[]>(() => loadJson<string[]>('sta_amb_joined_challenges', []));
  const [toast, setToast] = useState('');
  const flash = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(''), 2000); };

  const join = (name: string) => {
    if (joined.includes(name)) return;
    const next = [...joined, name];
    setJoined(next);
    saveJson('sta_amb_joined_challenges', next);
    flash(t('dashboard.ambLevels.joinedToast'));
  };

  return (
    <>
      <PageHead
        eyebrow={t('dashboard.ambLevels.eyebrow')}
        title={t('dashboard.ambLevels.title')}
        sub={t('dashboard.ambLevels.sub')}
      />
      <Card title={t('dashboard.ambLevels.levelsTitle')} sub={t('dashboard.ambLevels.levelsSub')} className="mb">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>{t('dashboard.ambLevels.thLevel')}</th>
                <th>{t('dashboard.ambLevels.thRetail')}</th>
                <th>{t('dashboard.ambLevels.thWholesale')}</th>
                <th>{t('dashboard.ambLevels.thReach')}</th>
                <th>{t('dashboard.ambLevels.thPerks')}</th>
              </tr>
            </thead>
            <tbody>
              {levelRows.map((l) => (
                <tr key={l.name}>
                  <td>{l.tone === 'ok' ? <Pill tone="ok">{l.name}</Pill> : <span className="strong">{l.name}</span>}</td>
                  <td className="strong accent">{l.retail}</td>
                  <td>{l.wholesale}</td>
                  <td className="small muted">{l.reach}</td>
                  <td className="small">{l.perks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid c3">
        {d.ambChallenges.map((c) => {
          const isJoined = joined.includes(c.name);
          const done = c.progress >= 100;
          return (
            <Card key={c.name} className="tight" title={c.name} sub={c.desc}>
              <div className="ring-row">
                <Ring
                  value={c.progress}
                  size={96}
                  tone={done ? 'accent' : 'gold'}
                  center={`${c.progress}${pct}`}
                  sub={t('dashboard.ambLevels.progress')}
                />
                <div className="ring-side">
                  <Pill tone="warn"><i className="ri-gift-line" /> {c.reward}</Pill>
                  {done ? (
                    <Pill tone="ok"><i className="ri-checkbox-circle-line" /> {t('dashboard.ambLevels.completed')}</Pill>
                  ) : isJoined ? (
                    <Pill tone="info"><i className="ri-checkbox-circle-line" /> {t('dashboard.ambLevels.joined')}</Pill>
                  ) : (
                    <button type="button" className="btn sm ghost" onClick={() => join(c.name)}>{t('dashboard.ambLevels.join')}</button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      <Toast message={toast} />
    </>
  );
}

function AmbTeam() {
  const { t } = useTranslation();
  const d = useDashboard();
  const [qrOpen, setQrOpen] = useState(false);
  const [toast, setToast] = useState('');
  const flash = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(''), 2000); };
  const inviteCode = 'AHMAD-TEAM-2481';
  const copyCode = () => {
    navigator.clipboard?.writeText(inviteCode).catch(() => undefined);
    flash(t('dashboard.common.copied'));
  };
  return (
    <>
      <PageHead
        eyebrow={t('dashboard.ambTeam.eyebrow')}
        title={t('dashboard.ambTeam.title')}
        sub={t('dashboard.ambTeam.sub')}
        actions={<button type="button" className="btn ghost" onClick={() => setQrOpen(true)}><i className="ri-download-2-line" /> {t('dashboard.ambTeam.qrCards')}</button>}
      />
      <div className="split">
        <Card title={t('dashboard.ambTeam.members')} sub={t('dashboard.ambTeam.membersSub', { count: d.ambTeam.length })}>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>{t('dashboard.ambTeam.thAmbassador')}</th>
                  <th>{t('dashboard.ambTeam.thOrders')}</th>
                  <th>{t('dashboard.ambTeam.thSales')}</th>
                  <th>{t('dashboard.ambTeam.thBonus')}</th>
                </tr>
              </thead>
              <tbody>
                {d.ambTeam.map((m) => (
                  <tr key={m.name}>
                    <td className="strong">{m.name}</td>
                    <td>{m.orders}</td>
                    <td>{m.sales}</td>
                    <td className="strong accent">{m.bonus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card title={t('dashboard.ambTeam.bonusTitle')} sub={t('dashboard.ambTeam.bonusSub')}>
          <div className="stat" style={{ border: 'none', padding: 0 }}>
            <div className="num accent">٨٤٫٥ ر.س</div>
            <div className="lbl">{t('dashboard.ambTeam.bonusValue')}</div>
          </div>
          <div className="divider" />
          <div className="code-box">
            <div>
              <div className="small muted">{t('dashboard.ambTeam.inviteCode')}</div>
              <div className="val">{inviteCode}</div>
            </div>
            <button type="button" className="btn sm ghost" onClick={copyCode}><i className="ri-file-copy-line" /> {t('dashboard.common.copy')}</button>
          </div>
          <div className="note" style={{ marginTop: 12 }}>
            <i className="ri-shield-check-line" />
            <span>{t('dashboard.ambTeam.note')}</span>
          </div>
        </Card>
      </div>

      <QrDownloadModal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        value={inviteCode}
        target={t('dashboard.ambTeam.inviteCode')}
        onDownload={() => { setQrOpen(false); flash(t('dashboard.qr.downloadToast')); }}
      />
      <Toast message={toast} />
    </>
  );
}

function AmbKyc() {
  const { t } = useTranslation();
  const d = useDashboard();
  const [open, setOpen] = useState(false);
  const [docType, setDocType] = useState('0');
  const [number, setNumber] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(() => loadJson<boolean>('sta_amb_kyc_submitted', false));
  const [toast, setToast] = useState('');
  const flash = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(''), 2200); };

  const statusItems = submitted
    ? d.ambKyc.map((k, i) => (i === 3 ? { ...k, done: true, s: t('dashboard.ambKyc.uploadedLabel') } : k))
    : d.ambKyc;

  const close = () => { setOpen(false); setError(''); };
  const submit = () => {
    if (!number.trim()) { setError(t('dashboard.ambKyc.numberRequired')); return; }
    if (!file) { setError(t('dashboard.ambKyc.docRequired')); return; }
    setOpen(false);
    setError('');
    saveJson('sta_amb_kyc_submitted', true);
    setSubmitted(true);
    setNumber('');
    setFile(null);
    setDocType('0');
    flash(t('dashboard.ambKyc.submitToast'));
  };

  return (
    <>
      <PageHead
        eyebrow={t('dashboard.ambKyc.eyebrow')}
        title={t('dashboard.ambKyc.title')}
        sub={t('dashboard.ambKyc.sub')}
        actions={<button type="button" className="btn primary" onClick={() => setOpen(true)}><i className="ri-upload-2-line" /> {t('dashboard.ambKyc.upload')}</button>}
      />
      <div className="split">
        <Card title={t('dashboard.ambKyc.statusTitle')} sub={t('dashboard.ambKyc.statusSub')}>
          <div className="tl">
            {statusItems.map((k) => (
              <div className={`tl-item ${k.done ? 'done' : ''}`} key={k.t}>
                <div className="row-between">
                  <div>
                    <div className="t">{k.t}</div>
                    <div className="s">{k.s}</div>
                  </div>
                  {k.done ? <Pill tone="ok">{t('dashboard.ambKyc.done')}</Pill> : <Pill tone="warn">{t('dashboard.ambKyc.required')}</Pill>}
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card title={t('dashboard.ambKyc.uploadTitle')} sub={t('dashboard.ambKyc.uploadSub')}>
          <div className="drop-zone" role="button" tabIndex={0} onClick={() => setOpen(true)} onKeyDown={(e) => { if (e.key === 'Enter') setOpen(true); }}>
            <i className="ri-upload-cloud-2-line" />
            <span className="fname">{t('dashboard.ambKyc.dropText')}</span>
            <span className="small">{t('dashboard.ambKyc.docHint')}</span>
          </div>
          <button type="button" className="btn primary block" style={{ marginTop: 14 }} onClick={() => setOpen(true)}><i className="ri-upload-2-line" /> {t('dashboard.ambKyc.upload')}</button>
        </Card>
      </div>

      <Modal open={open} onClose={close} title={t('dashboard.ambKyc.modalTitle')} sub={t('dashboard.ambKyc.modalSub')}>
        <div className="field">
          <label htmlFor="kyc-type">{t('dashboard.ambKyc.typeLabel')}</label>
          <select id="kyc-type" value={docType} onChange={(e) => setDocType(e.target.value)}>
            <option value="0">{t('dashboard.ambKyc.typeNational')}</option>
            <option value="1">{t('dashboard.ambKyc.typePassport')}</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="kyc-num">{t('dashboard.ambKyc.numberLabel')}</label>
          <input id="kyc-num" value={number} onChange={(e) => setNumber(e.target.value)} placeholder={t('dashboard.ambKyc.numberPlaceholder')} />
        </div>
        <label className={`drop-zone ${file ? 'has-file' : ''}`} htmlFor="kyc-file">
          <input
            id="kyc-file"
            className="file-input-hidden"
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => setFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
          />
          <i className={file ? 'ri-checkbox-circle-line' : 'ri-upload-cloud-2-line'} />
          {file ? (
            <>
              <span className="fname">{file.name}</span>
              <span className="small">{t('dashboard.ambKyc.fileChosen')}</span>
            </>
          ) : (
            <>
              <span className="fname">{t('dashboard.ambKyc.dropText')}</span>
              <span className="small">{t('dashboard.ambKyc.docHint')}</span>
            </>
          )}
        </label>
        {error && (
          <div className="note" style={{ marginTop: 14 }}>
            <i className="ri-error-warning-line" style={{ color: '#b3261e' }} />
            <span style={{ color: '#b3261e' }}>{error}</span>
          </div>
        )}
        <div className="modal-actions">
          <button type="button" className="btn primary" onClick={submit}>{t('dashboard.ambKyc.submit')}</button>
          <button type="button" className="btn ghost" onClick={close}>{t('dashboard.common.cancel')}</button>
        </div>
      </Modal>
      <Toast message={toast} />
    </>
  );
}

function AmbTerms() {
  const { t } = useTranslation();
  const d = useDashboard();
  const [open, setOpen] = useState(0);
  const allowed = t('dashboard.ambTerms.allowedItems', { returnObjects: true }) as unknown as string[];
  const forbidden = t('dashboard.ambTerms.forbiddenItems', { returnObjects: true }) as unknown as string[];
  return (
    <>
      <PageHead
        eyebrow={t('dashboard.ambTerms.eyebrow')}
        title={t('dashboard.ambTerms.title')}
        sub={t('dashboard.ambTerms.sub')}
      />
      <div className="split">
        <Card title={t('dashboard.ambTerms.faqTitle')} sub={t('dashboard.ambTerms.faqSub')}>
          <div className="acc">
            {d.ambTerms.map((item, i) => (
              <div key={item.q} className={`acc-row ${open === i ? 'open' : ''}`}>
                <button type="button" onClick={() => setOpen(open === i ? -1 : i)}>
                  {item.q}
                  <i className={open === i ? 'ri-subtract-line' : 'ri-add-line'} />
                </button>
                <div className="acc-body"><p>{item.a}</p></div>
              </div>
            ))}
          </div>
        </Card>

        <div className="stack">
          <Card title={t('dashboard.ambTerms.allowed')}>
            <div className="list">
              {allowed.map((x) => (
                <div className="list-row" key={x}>
                  <div className="ic"><i className="ri-check-line" /></div>
                  <div className="body"><div className="t small">{x}</div></div>
                </div>
              ))}
            </div>
          </Card>
          <Card title={t('dashboard.ambTerms.forbidden')}>
            <div className="list">
              {forbidden.map((x) => (
                <div className="list-row" key={x}>
                  <div className="ic"><i className="ri-close-line" /></div>
                  <div className="body"><div className="t small">{x}</div></div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

export const ambMoreViews: Record<string, FunctionComponent> = {
  group: AmbGroup,
  wallet: AmbWallet,
  levels: AmbLevels,
  team: AmbTeam,
  kyc: AmbKyc,
  terms: AmbTerms,
};