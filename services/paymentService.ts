/**
 * Payment Service
 * Handles Paystack (Nigeria) and Stripe (International) payment integrations
 */

import type { PaymentTransaction, Wallet, PaymentProvider } from '../types';
import {
    fetchWallet,
    fetchTransactions,
    createPaymentTransaction,
    updateTransactionStatus,
    updateWalletBalance,
} from './dataService';

// ============================================
// PAYMENT PROVIDER CONFIGURATION
// ============================================

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_xxxxx';
const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_xxxxx';

// Currency to provider mapping
const CURRENCY_PROVIDER_MAP: Record<string, PaymentProvider> = {
    NGN: 'paystack',  // Nigeria - Paystack
    GHS: 'paystack',  // Ghana - Paystack
    KES: 'paystack',  // Kenya - Paystack
    ZAR: 'paystack',  // South Africa - Paystack
    USD: 'stripe',    // US Dollar - Stripe
    EUR: 'stripe',    // Euro - Stripe
    GBP: 'stripe',    // British Pound - Stripe
};

// Get provider for currency (defaults to Stripe for international)
export const getProviderForCurrency = (currency: string): PaymentProvider => {
    return CURRENCY_PROVIDER_MAP[currency] || 'stripe';
};

// ============================================
// PAYMENT SERVICE CLASS
// ============================================

interface PaystackPopupOptions {
    email: string;
    amount: number; // in kobo
    currency: string;
    ref: string;
    metadata: Record<string, any>;
    callback: (response: { reference: string }) => void;
    onClose: () => void;
}

interface StripeCheckoutOptions {
    lineItems: Array<{ price: string; quantity: number }>;
    mode: 'payment' | 'subscription';
    successUrl: string;
    cancelUrl: string;
}

declare global {
    interface Window {
        PaystackPop?: {
            setup: (options: any) => { openIframe: () => void };
        };
        Stripe?: (key: string) => {
            redirectToCheckout: (options: any) => Promise<{ error?: { message: string } }>;
        };
    }
}

class PaymentService {
    private transactions: PaymentTransaction[] = [];
    private wallet: Wallet = {
        userId: 'current-user',
        balance: 0,
        currency: 'NGN',
        lastUpdated: new Date(),
    };
    private initialized = false;

    // Initialize with data from Supabase (or mock fallback)
    async init(userId: string): Promise<void> {
        if (this.initialized) return;
        this.wallet = await fetchWallet(userId);
        this.transactions = await fetchTransactions(userId);
        this.initialized = true;
    }

    // Get wallet balance
    getWallet(): Wallet {
        return { ...this.wallet };
    }

    // Get all transactions
    getTransactions(): PaymentTransaction[] {
        return [...this.transactions].sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
        );
    }

    // Get transaction by ID
    getTransaction(id: string): PaymentTransaction | undefined {
        return this.transactions.find(t => t.id === id);
    }

    // Initialize payment
    async initializePayment(options: {
        email: string;
        amount: number;
        currency: string;
        bookingId: string;
        toUserId: string;
    }): Promise<string> {
        // Generate unique reference
        const reference = `PM_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        // In production, this would call the appropriate payment API
        console.log('Initializing payment:', { ...options, reference });

        return reference;
    }

    // Open payment popup - auto-selects provider based on currency
    openPayment(options: {
        email: string;
        amount: number;
        currency: string;
        reference: string;
        onSuccess: (ref: string) => void;
        onClose: () => void;
        metadata?: Record<string, any>;
    }): void {
        const provider = getProviderForCurrency(options.currency);

        if (provider === 'paystack') {
            this.openPaystackPopup(options);
        } else {
            this.openStripeCheckout(options);
        }
    }

    // Open Paystack popup (Nigeria, Ghana, Kenya, South Africa)
    openPaystackPopup(options: {
        email: string;
        amount: number;
        currency: string;
        reference: string;
        onSuccess: (ref: string) => void;
        onClose: () => void;
        metadata?: Record<string, any>;
    }): void {
        if (!window.PaystackPop) {
            // Fallback for when Paystack script isn't loaded
            console.log('Paystack popup would open with:', options);
            // Simulate success for demo
            setTimeout(() => {
                options.onSuccess(options.reference);
            }, 2000);
            return;
        }

        const handler = window.PaystackPop.setup({
            key: PAYSTACK_PUBLIC_KEY,
            email: options.email,
            amount: options.amount * 100, // Convert to kobo
            currency: options.currency,
            ref: options.reference,
            metadata: options.metadata || {},
            callback: (response: { reference: string }) => {
                options.onSuccess(response.reference);
            },
            onClose: options.onClose,
        });

        handler.openIframe();
    }

    // Open Stripe checkout (International - USD, EUR, GBP, etc.)
    async openStripeCheckout(options: {
        email: string;
        amount: number;
        currency: string;
        reference: string;
        onSuccess: (ref: string) => void;
        onClose: () => void;
        metadata?: Record<string, any>;
    }): Promise<void> {
        if (!window.Stripe) {
            // Fallback for when Stripe script isn't loaded
            console.log('Stripe checkout would open with:', options);
            // Simulate success for demo
            setTimeout(() => {
                options.onSuccess(options.reference);
            }, 2000);
            return;
        }

        const stripe = window.Stripe(STRIPE_PUBLIC_KEY);

        // In production, you would create a Checkout Session on the server
        // and use the session ID here. This is a simplified demo.
        const result = await stripe.redirectToCheckout({
            lineItems: [{
                price_data: {
                    currency: options.currency.toLowerCase(),
                    product_data: {
                        name: 'PathMate Ride Payment',
                    },
                    unit_amount: options.amount * 100, // Convert to cents
                },
                quantity: 1,
            }],
            mode: 'payment',
            successUrl: `${window.location.origin}/payment-success?ref=${options.reference}`,
            cancelUrl: `${window.location.origin}/payment-cancelled`,
            customer_email: options.email,
        });

        if (result.error) {
            console.error('Stripe error:', result.error.message);
            options.onClose();
        }
    }

    // Verify payment (mock)
    async verifyPayment(reference: string): Promise<boolean> {
        // In production, verify with Paystack API
        console.log('Verifying payment:', reference);
        return true;
    }

    // Create transaction record
    createTransaction(transaction: Omit<PaymentTransaction, 'id' | 'createdAt'>): PaymentTransaction {
        const newTransaction: PaymentTransaction = {
            ...transaction,
            id: `txn-${Date.now()}`,
            createdAt: new Date(),
        };
        this.transactions.unshift(newTransaction);

        // Update wallet if receiving funds
        if (transaction.status === 'completed' && transaction.toUserId === this.wallet.userId) {
            this.wallet.balance += transaction.amount;
            this.wallet.lastUpdated = new Date();
        }

        // Persist to Supabase
        createPaymentTransaction(transaction);

        return newTransaction;
    }

    // Complete escrow payment
    completeEscrow(transactionId: string): PaymentTransaction | undefined {
        const transaction = this.transactions.find(t => t.id === transactionId);
        if (transaction && transaction.status === 'escrow') {
            transaction.status = 'completed';
            transaction.completedAt = new Date();

            // Credit driver's wallet
            if (transaction.toUserId === this.wallet.userId) {
                this.wallet.balance += transaction.amount;
                this.wallet.lastUpdated = new Date();
                updateWalletBalance(this.wallet.userId, this.wallet.balance);
            }

            // Persist status change
            updateTransactionStatus(transactionId, 'completed', transaction.completedAt);
        }
        return transaction;
    }

    // Refund payment
    async refundPayment(transactionId: string): Promise<boolean> {
        const transaction = this.transactions.find(t => t.id === transactionId);
        if (transaction && (transaction.status === 'escrow' || transaction.status === 'completed')) {
            const wasCompleted = transaction.status === 'completed';
            transaction.status = 'refunded';

            // Deduct from wallet if already credited
            if (transaction.toUserId === this.wallet.userId && wasCompleted) {
                this.wallet.balance -= transaction.amount;
                this.wallet.lastUpdated = new Date();
                updateWalletBalance(this.wallet.userId, this.wallet.balance);
            }

            // Persist status change
            updateTransactionStatus(transactionId, 'refunded');

            return true;
        }
        return false;
    }

    // Withdraw to bank
    async withdraw(amount: number, bankDetails: { bankCode: string; accountNumber: string }): Promise<boolean> {
        if (amount > this.wallet.balance) {
            return false;
        }

        // In production, call Paystack transfer API
        console.log('Initiating withdrawal:', { amount, bankDetails });

        this.wallet.balance -= amount;
        this.wallet.lastUpdated = new Date();
        updateWalletBalance(this.wallet.userId, this.wallet.balance);

        return true;
    }
}

// Singleton instance
export const paymentService = new PaymentService();

// ============================================
// HELPER FUNCTIONS
// ============================================

export { formatCurrency } from '../lib/formatters';

export const getTransactionStatusColor = (status: PaymentTransaction['status']): string => {
    const colors: Record<PaymentTransaction['status'], string> = {
        pending: 'bg-yellow-100 text-yellow-700',
        escrow: 'bg-blue-100 text-blue-700',
        completed: 'bg-green-100 text-green-700',
        refunded: 'bg-gray-100 text-gray-700',
        failed: 'bg-red-100 text-red-700',
    };
    return colors[status];
};
