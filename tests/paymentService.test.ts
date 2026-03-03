import { describe, it, expect, beforeAll } from 'vitest';
import { paymentService, formatCurrency, getTransactionStatusColor, getProviderForCurrency } from '../services/paymentService';

// Initialize the service with mock data before all tests
beforeAll(async () => {
    await paymentService.init('test-user');
});

describe('PaymentService', () => {
    it('should return wallet with balance', () => {
        const wallet = paymentService.getWallet();
        expect(wallet).toBeDefined();
        expect(wallet.balance).toBeGreaterThanOrEqual(0);
        expect(wallet.currency).toBe('NGN');
        expect(wallet.userId).toBeDefined();
        expect(wallet.lastUpdated).toBeInstanceOf(Date);
    });

    it('should return a copy of wallet (not a reference)', () => {
        const wallet1 = paymentService.getWallet();
        const wallet2 = paymentService.getWallet();
        expect(wallet1).not.toBe(wallet2);
        expect(wallet1).toEqual(wallet2);
    });

    it('should return transactions', () => {
        const transactions = paymentService.getTransactions();
        expect(Array.isArray(transactions)).toBe(true);
        expect(transactions.length).toBeGreaterThan(0);
    });

    it('should return transactions sorted by date (newest first)', () => {
        const transactions = paymentService.getTransactions();
        for (let i = 0; i < transactions.length - 1; i++) {
            expect(transactions[i].createdAt.getTime()).toBeGreaterThanOrEqual(
                transactions[i + 1].createdAt.getTime()
            );
        }
    });

    it('should get transaction by ID', () => {
        const transactions = paymentService.getTransactions();
        const first = transactions[0];
        const found = paymentService.getTransaction(first.id);
        expect(found).toBeDefined();
        expect(found!.id).toBe(first.id);
    });

    it('should return undefined for non-existent transaction', () => {
        const found = paymentService.getTransaction('non-existent');
        expect(found).toBeUndefined();
    });

    it('should generate payment reference', async () => {
        const reference = await paymentService.initializePayment({
            email: 'test@example.com',
            amount: 1000,
            currency: 'NGN',
            bookingId: 'test-booking',
            toUserId: 'test-user',
        });

        expect(reference).toBeDefined();
        expect(reference.startsWith('PM_')).toBe(true);
    });

    it('should create a transaction record', () => {
        const initialCount = paymentService.getTransactions().length;
        const txn = paymentService.createTransaction({
            bookingId: 'booking-new',
            fromUserId: 'rider-new',
            toUserId: 'driver-new',
            amount: 5000,
            currency: 'NGN',
            provider: 'paystack',
            providerRef: 'PAY_new',
            status: 'pending',
        });

        expect(txn.id).toBeDefined();
        expect(txn.createdAt).toBeInstanceOf(Date);
        expect(txn.amount).toBe(5000);
        expect(paymentService.getTransactions().length).toBe(initialCount + 1);
    });

    it('should complete an escrow payment', () => {
        const transactions = paymentService.getTransactions();
        const escrowTxn = transactions.find(t => t.status === 'escrow');

        if (escrowTxn) {
            const result = paymentService.completeEscrow(escrowTxn.id);
            expect(result).toBeDefined();
            expect(result!.status).toBe('completed');
            expect(result!.completedAt).toBeInstanceOf(Date);
        }
    });

    it('should verify payment (mock always returns true)', async () => {
        const result = await paymentService.verifyPayment('any-reference');
        expect(result).toBe(true);
    });

    it('should reject withdrawal exceeding balance', async () => {
        const wallet = paymentService.getWallet();
        const result = await paymentService.withdraw(
            wallet.balance + 10000,
            { bankCode: '011', accountNumber: '1234567890' }
        );
        expect(result).toBe(false);
    });
});

describe('getProviderForCurrency', () => {
    it('should return paystack for African currencies', () => {
        expect(getProviderForCurrency('NGN')).toBe('paystack');
        expect(getProviderForCurrency('GHS')).toBe('paystack');
        expect(getProviderForCurrency('KES')).toBe('paystack');
        expect(getProviderForCurrency('ZAR')).toBe('paystack');
    });

    it('should return stripe for international currencies', () => {
        expect(getProviderForCurrency('USD')).toBe('stripe');
        expect(getProviderForCurrency('EUR')).toBe('stripe');
        expect(getProviderForCurrency('GBP')).toBe('stripe');
    });

    it('should default to stripe for unknown currencies', () => {
        expect(getProviderForCurrency('XYZ')).toBe('stripe');
        expect(getProviderForCurrency('JPY')).toBe('stripe');
    });
});

describe('formatCurrency', () => {
    it('should format NGN correctly', () => {
        expect(formatCurrency(1000, 'NGN')).toBe('₦1,000');
        expect(formatCurrency(2500, 'NGN')).toBe('₦2,500');
    });

    it('should format USD correctly', () => {
        expect(formatCurrency(100, 'USD')).toBe('$100');
    });

    it('should format EUR correctly', () => {
        expect(formatCurrency(50, 'EUR')).toBe('€50');
    });

    it('should format GBP correctly', () => {
        expect(formatCurrency(75, 'GBP')).toBe('£75');
    });

    it('should handle unknown currencies', () => {
        expect(formatCurrency(100, 'XYZ')).toBe('XYZ100');
    });
});

describe('getTransactionStatusColor', () => {
    it('should return correct colors for statuses', () => {
        expect(getTransactionStatusColor('pending')).toContain('yellow');
        expect(getTransactionStatusColor('completed')).toContain('green');
        expect(getTransactionStatusColor('failed')).toContain('red');
        expect(getTransactionStatusColor('escrow')).toContain('blue');
        expect(getTransactionStatusColor('refunded')).toContain('gray');
    });
});
