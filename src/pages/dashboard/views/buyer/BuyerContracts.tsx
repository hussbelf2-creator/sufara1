import type { FunctionComponent } from 'react';
import ContractsWorkspace from '@/pages/dashboard/views/contracts/ContractsWorkspace';

function BuyerContracts() {
  return <ContractsWorkspace role="buyer" />;
}

export const buyerContractsViews: Record<string, FunctionComponent> = {
  contracts: BuyerContracts,
};