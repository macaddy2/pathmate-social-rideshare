/**
 * Wallet screen.
 * Balances remain view-only until a server-side payment processor exists.
 */

import React, { useEffect } from 'react';
import { ArrowUpFromLine, CreditCard, History, LockKeyhole } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, getTransactionStatusColor } from '../services/paymentService';
import { formatRelativeTime } from '../lib/formatters';
import type { PaymentTransaction } from '../types';
import { useWalletStore } from '../stores/useWalletStore';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';

const PAYMENTS_UNAVAILABLE_COPY =
    'Payments and payouts are unavailable until secure server-side Paystack processing is available.';

interface TransactionItemProps {
    transaction: PaymentTransaction;
    currentUserId: string;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, currentUserId }) => {
    const isIncoming = transaction.toUserId === currentUserId;

    return (
        <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full text-lg ${isIncoming ? 'bg-green-100' : 'bg-red-100'}`}>
                {isIncoming ? '📥' : '📤'}
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{isIncoming ? 'Received' : 'Sent'}</p>
                    <Badge variant="outline" className={`text-xs ${getTransactionStatusColor(transaction.status)}`}>
                        {transaction.status}
                    </Badge>
                </div>
                <p className="text-xs text-gray-500">{formatRelativeTime(transaction.createdAt)}</p>
            </div>
            <p className={`font-bold ${isIncoming ? 'text-green-600' : 'text-gray-900'}`}>
                {isIncoming ? '+' : '-'}{formatCurrency(transaction.amount, transaction.currency)}
            </p>
        </div>
    );
};

interface ActionButtonProps {
    icon: React.ReactNode;
    label: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon, label }) => (
    <Button
        variant="ghost"
        disabled
        title={PAYMENTS_UNAVAILABLE_COPY}
        className="flex h-auto flex-col items-center gap-2 rounded-2xl bg-gray-100 p-4 opacity-70"
    >
        <span className="text-blue-700">{icon}</span>
        <span className="text-sm font-medium text-gray-700">{label}</span>
    </Button>
);

const WalletScreen: React.FC = () => {
    const { user } = useAuth();
    const { wallet, transactions, refreshWallet } = useWalletStore();

    useEffect(() => {
        refreshWallet();
    }, [refreshWallet]);

    const pendingAmount = transactions
        .filter((transaction) => transaction.status === 'escrow' && transaction.toUserId === (user?.id || 'current-user'))
        .reduce((sum, transaction) => sum + transaction.amount, 0);

    return (
        <div className="space-y-4 animate-fadeIn pb-24">
            <Card className="rounded-3xl border-0 bg-[#102a43] p-6 text-white shadow-xl">
                <p className="mb-1 text-sm text-blue-100">Wallet balance</p>
                <h2 className="mb-4 text-3xl font-bold">
                    {formatCurrency(wallet?.balance || 0, wallet?.currency || 'NGN')}
                </h2>
                {pendingAmount > 0 ? (
                    <div className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-3 py-2 backdrop-blur-sm">
                        <LockKeyhole className="h-4 w-4" />
                        <span className="text-sm">{formatCurrency(pendingAmount, 'NGN')} recorded in escrow</span>
                    </div>
                ) : null}
            </Card>

            <Card className="rounded-2xl border-amber-200 bg-amber-50">
                <CardContent className="flex items-start gap-3 p-4">
                    <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                    <div>
                        <p className="font-semibold text-amber-900">Payments are not available yet</p>
                        <p className="mt-1 text-sm text-amber-800">{PAYMENTS_UNAVAILABLE_COPY}</p>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-3 gap-3">
                <ActionButton icon={<CreditCard className="h-5 w-5" />} label="Add funds" />
                <ActionButton icon={<ArrowUpFromLine className="h-5 w-5" />} label="Withdraw" />
                <ActionButton icon={<History className="h-5 w-5" />} label="History" />
            </div>

            <Card className="rounded-2xl">
                <CardContent className="p-4">
                    <h3 className="mb-3 font-bold text-gray-900">Payment methods</h3>
                    <div className="space-y-2">
                        {['Paystack — cards, bank, and USSD', 'Stripe — international cards'].map((method) => (
                            <div key={method} className="flex items-center justify-between rounded-xl bg-gray-50 p-3">
                                <p className="text-sm font-medium text-gray-800">{method}</p>
                                <Badge variant="outline">Unavailable</Badge>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card className="rounded-2xl">
                <CardContent className="p-4">
                    <h3 className="mb-3 font-bold text-gray-900">Recent transactions</h3>
                    {transactions.length === 0 ? (
                        <div className="py-8 text-center text-gray-500">
                            <span className="mb-3 block text-4xl">💸</span>
                            <p>No verified transactions yet</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {transactions.slice(0, 5).map((transaction) => (
                                <TransactionItem key={transaction.id} transaction={transaction} currentUserId={user?.id || 'current-user'} />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="rounded-2xl border-0 bg-blue-50">
                <CardContent className="flex items-start gap-3 p-4">
                    <span className="text-2xl">🔐</span>
                    <div>
                        <p className="font-medium text-blue-800">Server verification required</p>
                        <p className="text-sm text-blue-700">Wallet balances and payment status will only change after a secure server verifies a provider webhook.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default WalletScreen;
