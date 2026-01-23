import { describe, it, expect } from 'vitest';
import { paymentService, formatCurrency, getTransactionStatusColor } from '../services/paymentService';

describe('PaymentService', () => {
    it('should return wallet with balance', () => {
        const wallet = paymentService.getWallet();
        expect(wallet).toBeDefined();
        expect(wallet.balance).toBeGreaterThanOrEqual(0);
        expect(wallet.currency).toBe('NGN');
    });

    it('should return transactions', () => {
        const transactions = paymentService.getTransactions();
        expect(Array.isArray(transactions)).toBe(true);
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
});

describe('formatCurrency', () => {
    it('should format NGN correctly', () => {
        expect(formatCurrency(1000, 'NGN')).toBe('₦1,000');
        expect(formatCurrency(2500, 'NGN')).toBe('₦2,500');
    });

    it('should format USD correctly', () => {
        expect(formatCurrency(100, 'USD')).toBe('$100');
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
    });
});
