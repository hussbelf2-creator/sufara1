import type { FunctionComponent } from 'react';
import ContractsWorkspace from '@/pages/dashboard/views/contracts/ContractsWorkspace';

function FactoryContracts() {
  return <ContractsWorkspace role="factory" />;
}

export const factoryContractsViews: Record<string, FunctionComponent> = {
  'f-contracts': FactoryContracts,
};