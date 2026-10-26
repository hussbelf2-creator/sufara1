import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Pill } from '@/pages/dashboard/components/ui';
import { diffContract } from './revisions';
import type { Contract, ContractRevision } from './types';

type Props = {
  contract: Contract;
  onRestore: (rev: ContractRevision) => void;
};

/* The contract's version history: every saved snapshot, a one-click diff
   against the current contract, and a restore button. The newest revision is
   always the current state, so it is marked and cannot be restored. */
export default function ContractVersions({ contract, onRestore }: Props) {
  const { t } = useTranslation();
  const [openId, setOpenId] = useState<string | null>(null);
  const revisions = contract.revisions ?? [];

  const roleLabel = (r: ContractRevision) => {
    if (r.by === 'buyer') return t('dashboard.contracts.roleBuyer');
    if (r.by === 'factory') return t('dashboard.contracts.roleFactory');
    return t('dashboard.contracts.roleAdmin');
  };

  return (
    <Card title={t('dashboard.contracts.versionsTitle')} sub={t('dashboard.contracts.versionsSub')} className="mb">
      {revisions.length ? (
        <ul className="ct-ver-list">
          {revisions.map((r, i) => {
            const diff = diffContract(r.data, contract, t);
            const open = openId === r.id;
            const isCurrent = i === 0;
            return (
              <li className={`ct-ver-item ${open ? 'is-open' : ''}`} key={r.id}>
                <div className="ct-ver-row">
                  <div className="ct-ver-ic"><i className={isCurrent ? 'ri-history-line' : 'ri-git-commit-line'} /></div>
                  <div className="ct-ver-body">
                    <div className="t">
                      {r.time}
                      {isCurrent && <Pill tone="ok">{t('dashboard.contracts.versionsCurrent')}</Pill>}
                    </div>
                    <div className="s">
                      {t('dashboard.contracts.versionsBy')}: {roleLabel(r)}{r.note ? ` · ${r.note}` : ''}
                    </div>
                  </div>
                  <div className="ct-ver-end">
                    <button type="button" className="btn sm ghost" onClick={() => setOpenId(open ? null : r.id)}>
                      <i className="ri-file-list-3-line" /> {open ? t('dashboard.contracts.versionsHide') : t('dashboard.contracts.versionsCompare')}
                    </button>
                    {!isCurrent && (
                      <button type="button" className="btn sm primary" onClick={() => onRestore(r)}>
                        <i className="ri-restart-line" /> {t('dashboard.contracts.versionsRestore')}
                      </button>
                    )}
                  </div>
                </div>
                {open && (
                  <div className="ct-ver-diff">
                    {diff.length ? (
                      <div className="tbl-wrap">
                        <table className="tbl">
                          <thead>
                            <tr>
                              <th>{t('dashboard.contracts.versionsField')}</th>
                              <th>{t('dashboard.contracts.versionsBefore')}</th>
                              <th>{t('dashboard.contracts.versionsAfter')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {diff.map((d, di) => (
                              <tr key={di}>
                                <td className="strong">{d.label}</td>
                                <td className="muted">{d.before}</td>
                                <td className="accent">{d.after}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="small muted">{t('dashboard.contracts.versionsNoDiff')}</p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="small muted">{t('dashboard.contracts.versionsEmpty')}</p>
      )}
    </Card>
  );
}