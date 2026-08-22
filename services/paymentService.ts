/**
 * Payment service boundary.
 *
 * Client code must never create, verify, settle, refund, or withdraw money.
 * Those operations require an authenticated server-side Paystack integration
 * and webhook-verified state. Until that exists, this service is read-only.
 */

import type { PaymentTransaction, Wallet, PaymentProvider } from '../types';

const PAYMENTS_UNAVAILABLE_MESSAGE =
    'Payments and payouts are unavailable until secure server-side Paystack processing is available.';

const CURRENCY_PROVIDER_MAP: Record<string, PaymentProvider> = {
    NGN: 'paystack',
    GHS: 'paystack',
    KES: 'paystack',
    ZAR: 'paystack',
    USD: 'stripe',
    EUR: 'stripe',
    GBP: 'stripe',
};

export const getProviderForCurrency = (currency: string): PaymentProvider =>
    CURRENCY_PROVIDER_MAP[currency] || 'stripe';

export class PaymentServiceUnavailableError extends Error {
    constructor() {
        super(PAYMENTS_UNAVAILABLE_MESSAGE);
        this.name = 'PaymentServiceUnavailableError';
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

    async init(userId: string): Promise<void> {
        this.wallet = {
            userId,
            balance: 0,
            currency: 'NGN',
            lastUpdated: new Date(),
        };
        this.transactions = [];
    }

    getWallet(): Wallet {
        return { ...this.wallet };
    }

    getTransactions(): PaymentTransaction[] {
        return [...this.transactions];
    }

    getTransaction(id: string): PaymentTransaction | undefined {
        return this.transactions.find((transaction) => transaction.id === id);
    }

    isAvailable(): boolean {
        return false;
    }

    getUnavailableMessage(): string {
        return PAYMENTS_UNAVAILABLE_MESSAGE;
    }

    async initializePayment(): Promise<never> {
        throw new PaymentServiceUnavailableError();
    }

    openPayment(): never {
        throw new PaymentServiceUnavailableError();
    }

    async verifyPayment(): Promise<boolean> {
        return false;
    }

    createTransaction(): never {
        throw new PaymentServiceUnavailableError();
    }

    completeEscrow(): undefined {
        return undefined;
    }

    async refundPayment(): Promise<boolean> {
        return false;
    }

    async withdraw(): Promise<boolean> {
        return false;
    }
}

export const paymentService = new PaymentService();

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
