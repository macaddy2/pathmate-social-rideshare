import { create } from 'zustand';
import type { PaymentTransaction, Wallet } from '../types';
import { paymentService } from '../services/paymentService';

interface WalletStore {
  wallet: Wallet | null;
  transactions: PaymentTransaction[];
  setWallet: (wallet: Wallet | null) => void;
  setTransactions: (transactions: PaymentTransaction[]) => void;
  addTransaction: (transaction: PaymentTransaction) => void;
  refreshWallet: () => void;
}

export const useWalletStore = create<WalletStore>((set) => ({
  wallet: null,
  transactions: [],
  setWallet: (wallet) => set({ wallet }),
  setTransactions: (transactions) => set({ transactions }),
  addTransaction: (transaction) =>
    set((state) => ({ transactions: [transaction, ...state.transactions] })),
  refreshWallet: () => {
    set({
      wallet: paymentService.getWallet(),
      transactions: paymentService.getTransactions(),
    });
  },
}));
