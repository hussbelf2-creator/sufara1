import type { ContractRole } from './types';

/* A tiny module-level channel that lets a "Create contract" button inside a
   wholesale deal open the contracts workspace with a fresh (prefilled) editor.
   The workspace consumes the intent on mount; the value never survives a read. */
export type ContractIntent = {
  role: ContractRole;
  factory?: string;
  buyer?: string;
  product?: string;
};

let pending: ContractIntent | null = null;

export const setContractIntent = (intent: ContractIntent) => {
  pending = intent;
};

export const takeContractIntent = (role: ContractRole): ContractIntent | null => {
  if (pending && pending.role === role) {
    const p = pending;
    pending = null;
    return p;
  }
  return null;
};