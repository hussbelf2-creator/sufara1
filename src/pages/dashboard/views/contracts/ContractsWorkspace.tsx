import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDashboard } from '@/hooks/useDashboard';
import { Toast } from '@/pages/dashboard/components/ui';
import ContractsList from './ContractsList';
import ContractDetail from './ContractDetail';
import ContractEditor from './ContractEditor';
import { takeContractIntent } from './intent';
import { makeBlankContract } from './editorData';
import { cloneContract } from './types';
import { buildRevision } from './revisions';
import type { Contract, ContractRevision, ContractRole } from './types';

type Screen = 'list' | 'detail' | 'editor';

/* One self-contained workspace reused by the buyer, factory and admin views.
   It owns its internal list state and swaps between the list, a read-only
   detail and the full editor — so each dashboard role gets the whole contract
   flow from a single navigation entry. */
export default function ContractsWorkspace({ role }: { role: ContractRole }) {
  const { t } = useTranslation();
  const d = useDashboard();
  const [list, setList] = useState<Contract[]>(() => (d.contracts as Contract[]).map(cloneContract));
  const [screen, setScreen] = useState<Screen>('list');
  const [active, setActive] = useState<Contract | null>(null);
  const [toast, setToast] = useState('');

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 2600);
  };

  /* Consume a "create contract" intent fired from a wholesale deal. */
  useEffect(() => {
    const intent = takeContractIntent(role);
    if (intent) {
      setActive(makeBlankContract({ factory: intent.factory, buyer: intent.buyer, product: intent.product }));
      setScreen('editor');
      flash(t('dashboard.contracts.dealNote', { name: intent.factory || intent.buyer || '' }));
    }
  }, [role, t]);

  const persist = (c: Contract) => {
    setList((prev) => (prev.some((x) => x.id === c.id) ? prev.map((x) => (x.id === c.id ? c : x)) : [c, ...prev]));
  };

  /* Saves a contract AND records a restorable version of it. Every meaningful
     save (editor save, signature, stage move, status change, restore) goes
     through here, so the version history always mirrors what really happened.
     The history is capped so it can never grow without bound. */
  const commit = (c: Contract, note?: string) => {
    const stamped: Contract = { ...c, updatedAt: t('dashboard.common.now') };
    const revision = buildRevision(stamped, role, note ?? t('dashboard.contracts.versionsSavedNote'));
    const next: Contract = { ...stamped, revisions: [revision, ...(stamped.revisions ?? [])].slice(0, 40) };
    persist(next);
    setActive(next);
    return next;
  };

  /* Restores a version straight from the list's version popover: the snapshot
     comes back, the full history is kept, and the restore itself is recorded as
     a new version so the action stays auditable. */
  const restoreFromList = (c: Contract, rev: ContractRevision) => {
    const next = cloneContract(rev.data);
    next.revisions = c.revisions ?? [];
    commit(next, t('dashboard.contracts.versionsRestoredNote'));
    flash(t('dashboard.contracts.versionsRestoredToast'));
  };

  /* Sends a reminder to the factory and RECORDS it on the contract: the send
     time is stored in the contract's own notice log and a version is pushed to
     the revision history, so the action is visible in both places. */
  const notifyFactory = (c: Contract) => {
    const stamp = t('dashboard.common.now');
    const next = cloneContract(c);
    next.notices = [
      {
        id: `NT-${Date.now().toString().slice(-7)}`,
        time: stamp,
        by: role,
        note: t('dashboard.contracts.noticeSentNote'),
      },
      ...(next.notices ?? []),
    ].slice(0, 20);
    commit(next, t('dashboard.contracts.noticeRevisionNote', { time: stamp }));
    flash(t('dashboard.contracts.notifyFactoryToastAt', {
      id: c.id,
      factory: c.factory || c.buyerCompany,
      time: stamp,
    }));
  };

  const startNew = () => {
    setActive(makeBlankContract());
    setScreen('editor');
  };

  const startEdit = (c: Contract) => {
    setActive(cloneContract(c));
    setScreen('editor');
  };

  const openDetail = (c: Contract) => {
    setActive(c);
    setScreen('detail');
  };

  /* Load an imported contract (from a .json file, or a scanned document that is
     attached to a fresh contract) straight into the editor for review. */
  const importContract = (c: Contract, attached?: boolean) => {
    setActive(c);
    setScreen('editor');
    flash(attached ? t('dashboard.contracts.importAttachedToast') : t('dashboard.contracts.importToast'));
  };

  const handleSave = (c: Contract, action: 'saved' | 'submitted' | 'signed') => {
    commit(c, action === 'saved' ? t('dashboard.contracts.versionsSavedNote') : t('dashboard.contracts.submittedToast'));
    setScreen('detail');
    if (action === 'saved') flash(t('dashboard.contracts.savedToast'));
    else if (action === 'submitted') flash(t('dashboard.contracts.submittedToast'));
    else flash(t('dashboard.contracts.signToast'));
  };

  const handleUpdate = (c: Contract) => {
    persist(c);
    setActive(c);
  };

  /* Structural changes (sign, status, stage, restore) record a version; plain
     comment additions use handleUpdate above and do not create versions. */
  const handleCommit = (c: Contract, note?: string) => {
    commit(c, note);
  };

  return (
    <>
      {screen === 'list' && (
        <ContractsList
          role={role}
          contracts={list}
          onSelect={openDetail}
          onEdit={startEdit}
          onNew={startNew}
          onImport={importContract}
          onRestore={restoreFromList}
          onNotify={notifyFactory}
        />
      )}

      {screen === 'detail' && active && (
        <ContractDetail
          role={role}
          contract={active}
          onBack={() => setScreen('list')}
          onEdit={() => startEdit(active)}
          onUpdate={handleUpdate}
          onCommit={handleCommit}
        />
      )}

      {screen === 'editor' && active && (
        <ContractEditor
          role={role}
          initial={active}
          onSave={handleSave}
          onCancel={() => setScreen('list')}
        />
      )}

      <Toast message={toast} />
    </>
  );
}