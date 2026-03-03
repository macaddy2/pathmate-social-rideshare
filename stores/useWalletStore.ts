import { create } from 'zustand';
import type { PaymentTransaction, Wallet } from '../types';
import { paymentService } from '../services/paymentService';
import { fetchWallet, fetchTransactions } from '../services/dataService';

interface WalletStore {
  wallet: Wallet | null;
  transactions: PaymentTransaction[];
  setWallet: (wallet: Wallet | null) => void;
  setTransactions: (transactions: PaymentTransaction[]) => void;
  addTransaction: (transaction: PaymentTransaction) => void;
  refreshWallet: (userId?: string) => void | Promise<void>;
}

export const useWalletStore = create<WalletStore>((set) => ({
  wallet: null,
  transactions: [],
  setWallet: (wallet) => set({ wallet }),
  setTransactions: (transactions) => set({ transactions }),
  addTransaction: (transaction) =>
    set((state) => ({ transactions: [transaction, ...state.transactions] })),
  refreshWallet: async (userId?: string) => {
    if (userId) {
      const [wallet, transactions] = await Promise.all([
        fetchWallet(userId),
        fetchTransactions(userId),
      ]);
      set({ wallet, transactions });
    } else {
      set({
        wallet: paymentService.getWallet(),
        transactions: paymentService.getTransactions(),
      });
    }
  },
}));
