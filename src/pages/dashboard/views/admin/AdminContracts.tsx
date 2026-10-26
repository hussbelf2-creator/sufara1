import type { FunctionComponent } from 'react';
import ContractsWorkspace from '@/pages/dashboard/views/contracts/ContractsWorkspace';

function AdminContracts() {
  return <ContractsWorkspace role="admin" />;
}

export const adminContractsViews: Record<string, FunctionComponent> = {
  'admin-contracts': AdminContracts,
};