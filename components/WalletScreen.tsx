/**
 * Wallet Component
 * User wallet with balance, transactions, and payment actions
 */

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { paymentService, formatCurrency, getTransactionStatusColor, getProviderForCurrency } from '../services/paymentService';
import type { PaymentTransaction, Wallet } from '../types';
import { useWalletStore } from '../stores/useWalletStore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';

// ============================================
// TRANSACTION ITEM
// ============================================

interface TransactionItemProps {
    transaction: PaymentTransaction;
    currentUserId: string;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, currentUserId }) => {
    const isIncoming = transaction.toUserId === currentUserId;

    const formatTime = (date: Date) => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffHours < 1) return 'Just now';
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${isIncoming ? 'bg-green-100' : 'bg-red-100'
                }`}>
                {isIncoming ? '📥' : '📤'}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">
                        {isIncoming ? 'Received' : 'Sent'}
                    </p>
                    <Badge variant="outline" className={`text-xs ${getTransactionStatusColor(transaction.status)}`}>
                        {transaction.status}
                    </Badge>
                </div>
                <p className="text-xs text-gray-500">{formatTime(transaction.createdAt)}</p>
            </div>

            <p className={`font-bold ${isIncoming ? 'text-green-600' : 'text-gray-900'}`}>
                {isIncoming ? '+' : '-'}{formatCurrency(transaction.amount, transaction.currency)}
            </p>
        </div>
    );
};

// ============================================
// QUICK ACTION BUTTON
// ============================================

interface ActionButtonProps {
    icon: string;
    label: string;
    onClick: () => void;
    color?: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon, label, onClick, color = 'bg-gray-100' }) => (
    <Button
        variant="ghost"
        onClick={onClick}
        className={`flex flex-col items-center gap-2 p-4 h-auto rounded-2xl ${color} transition-transform active:scale-95`}
    >
        <span className="text-2xl">{icon}</span>
        <span className="text-sm font-medium text-gray-700">{label}</span>
    </Button>
);

// ============================================
// CURRENCY OPTIONS
// ============================================

const CURRENCIES = [
    { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', provider: 'Paystack' },
    { code: 'USD', symbol: '$', name: 'US Dollar', provider: 'Stripe' },
    { code: 'EUR', symbol: '€', name: 'Euro', provider: 'Stripe' },
    { code: 'GBP', symbol: '£', name: 'British Pound', provider: 'Stripe' },
];

// ============================================
// ADD FUNDS MODAL
// ============================================

interface AddFundsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const AddFundsModal: React.FC<AddFundsModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { user } = useAuth();
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState('NGN');
    const [isLoading, setIsLoading] = useState(false);

    const quickAmounts: Record<string, number[]> = {
        NGN: [1000, 2000, 5000, 10000],
        USD: [5, 10, 25, 50],
        EUR: [5, 10, 25, 50],
        GBP: [5, 10, 25, 50],
    };

    const selectedCurrency = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];
    const provider = getProviderForCurrency(currency);

    const handleAddFunds = async () => {
        if (!amount || !user?.email) return;

        setIsLoading(true);

        const reference = await paymentService.initializePayment({
            email: user.email,
            amount: parseInt(amount),
            currency,
            bookingId: 'wallet-topup',
            toUserId: user.id,
        });

        // Use unified payment method that auto-selects provider
        paymentService.openPayment({
            email: user.email,
            amount: parseInt(amount),
            currency,
            reference,
            onSuccess: () => {
                paymentService.createTransaction({
                    bookingId: 'wallet-topup',
                    fromUserId: provider,
                    toUserId: user.id,
                    amount: parseInt(amount),
                    currency,
                    provider,
                    providerRef: reference,
                    status: 'completed',
                    completedAt: new Date(),
                });
                setIsLoading(false);
                onSuccess();
                onClose();
            },
            onClose: () => {
                setIsLoading(false);
            },
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold">Add Funds</h3>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Currency Selector */}
                <div>
                    <label className="block text-sm text-gray-600 mb-2">Currency</label>
                    <div className="grid grid-cols-4 gap-2">
                        {CURRENCIES.map((c) => (
                            <button
                                key={c.code}
                                onClick={() => { setCurrency(c.code); setAmount(''); }}
                                className={`py-2 rounded-lg text-sm font-medium transition-colors ${currency === c.code
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {c.symbol} {c.code}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm text-gray-600 mb-2">Amount ({selectedCurrency.symbol})</label>
                    <Input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Enter amount"
                        className="h-14 text-2xl font-bold text-center rounded-xl"
                    />
                </div>

                <div className="grid grid-cols-4 gap-2">
                    {(quickAmounts[currency] || quickAmounts.NGN).map((amt) => (
                        <button
                            key={amt}
                            onClick={() => setAmount(amt.toString())}
                            className={`py-2 rounded-lg text-sm font-medium transition-colors ${amount === amt.toString()
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {selectedCurrency.symbol}{amt.toLocaleString()}
                        </button>
                    ))}
                </div>

                <Button
                    onClick={handleAddFunds}
                    disabled={!amount || isLoading}
                    size="lg"
                    className="w-full py-4 rounded-xl font-semibold"
                >
                    {isLoading ? 'Processing...' : `Add ${formatCurrency(parseInt(amount) || 0, currency)}`}
                </Button>

                <p className="text-xs text-center text-gray-500">
                    Powered by {selectedCurrency.provider} • Secure payment
                </p>
            </div>
        </div>
    );
};

// ============================================
// MAIN COMPONENT
// ============================================

const WalletScreen: React.FC = () => {
    const { user } = useAuth();
    const { wallet, transactions, refreshWallet } = useWalletStore();
    const [showAddFunds, setShowAddFunds] = useState(false);
    const [showWithdraw, setShowWithdraw] = useState(false);

    useEffect(() => {
        refreshWallet();
    }, [refreshWallet]);

    const pendingAmount = transactions
        .filter(t => t.status === 'escrow' && t.toUserId === (user?.id || 'current-user'))
        .reduce((sum, t) => sum + t.amount, 0);

    return (
        <div className="space-y-4 animate-fadeIn pb-24">
            {/* Balance Card */}
            <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 text-white shadow-xl border-0">
                <p className="text-emerald-100 text-sm mb-1">Available Balance</p>
                <h2 className="text-3xl font-bold mb-4">
                    {formatCurrency(wallet?.balance || 0, wallet?.currency || 'NGN')}
                </h2>

                {pendingAmount > 0 && (
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2 inline-flex items-center gap-2">
                        <span className="text-xs">🔒</span>
                        <span className="text-sm">
                            {formatCurrency(pendingAmount, 'NGN')} in escrow
                        </span>
                    </div>
                )}
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-3">
                <ActionButton
                    icon="💳"
                    label="Add Funds"
                    onClick={() => setShowAddFunds(true)}
                    color="bg-indigo-50"
                />
                <ActionButton
                    icon="🏦"
                    label="Withdraw"
                    onClick={() => setShowWithdraw(true)}
                    color="bg-green-50"
                />
                <ActionButton
                    icon="📊"
                    label="History"
                    onClick={() => { }}
                    color="bg-purple-50"
                />
            </div>

            {/* Payment Methods */}
            <Card className="rounded-2xl">
              <CardContent className="p-4">
                <h3 className="font-bold text-gray-900 mb-3">Payment Methods</h3>
                <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center text-lg">
                            🇳🇬
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-gray-900">Paystack</p>
                            <p className="text-xs text-gray-500">Nigeria • Cards, Bank, USSD</p>
                        </div>
                        <Badge variant="success">Active</Badge>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-lg">
                            🌍
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-gray-900">Stripe</p>
                            <p className="text-xs text-gray-500">International • USD, EUR, GBP</p>
                        </div>
                        <Badge variant="success">Active</Badge>
                    </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card className="rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-900">Recent Transactions</h3>
                    <Button variant="link" className="text-sm p-0 h-auto">See All</Button>
                </div>

                <div className="space-y-2">
                    {transactions.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <span className="text-4xl block mb-3">💸</span>
                            <p>No transactions yet</p>
                        </div>
                    ) : (
                        transactions.slice(0, 5).map((transaction) => (
                            <TransactionItem
                                key={transaction.id}
                                transaction={transaction}
                                currentUserId={user?.id || 'current-user'}
                            />
                        ))
                    )}
                </div>
              </CardContent>
            </Card>

            {/* Escrow Info */}
            <Card className="bg-blue-50 rounded-2xl border-0">
              <CardContent className="p-4 flex items-start gap-3">
                <span className="text-2xl">🔐</span>
                <div>
                    <p className="font-medium text-blue-800">Escrow Protection</p>
                    <p className="text-sm text-blue-700">
                        Payments are held securely until the ride is completed, protecting both riders and drivers.
                    </p>
                </div>
              </CardContent>
            </Card>

            {/* Modals */}
            <AddFundsModal
                isOpen={showAddFunds}
                onClose={() => setShowAddFunds(false)}
                onSuccess={refreshWallet}
            />
        </div>
    );
};

export default WalletScreen;
