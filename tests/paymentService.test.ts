import { beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
    PaymentServiceUnavailableError,
    formatCurrency,
    getProviderForCurrency,
    getTransactionStatusColor,
    paymentService,
} from '../services/paymentService';
import { BookingStatus, PaymentStatus } from '../types';

describe('PaymentService safety boundary', () => {
    beforeEach(async () => {
        await paymentService.init('test-user');
});
    it('exposes an empty, read-only wallet state', () => {
        expect(paymentService.getWallet()).toMatchObject({ userId: 'test-user', balance: 0, currency: 'NGN' });
        expect(paymentService.getTransactions()).toEqual([]);
        expect(paymentService.isAvailable()).toBe(false);
    });

    it('does not initialize a client-side payment', async () => {
        await expect(paymentService.initializePayment()).rejects.toBeInstanceOf(PaymentServiceUnavailableError);
    });

    it('does not claim client-side verification or withdrawals succeeded', async () => {
        expect(await paymentService.verifyPayment()).toBe(false);
        expect(await paymentService.withdraw()).toBe(false);
        expect(await paymentService.refundPayment()).toBe(false);
    });
});
describe('payment display helpers', () => {
    it('maps supported currencies to a provider label', () => {
        expect(getProviderForCurrency('NGN')).toBe('paystack');
        expect(getProviderForCurrency('GBP')).toBe('stripe');
    });

    it('formats amounts and status colours', () => {
        expect(formatCurrency(1000, 'NGN')).toBe('₦1,000');
        expect(getTransactionStatusColor('completed')).toContain('green');
    });
});

describe('server-controlled booking and payment schema contract', () => {
    const baselineMigration = readFileSync(
        resolve(process.cwd(), 'supabase/migrations/20260822120000_initial_schema.sql'),
        'utf8'
    );
    const hardeningMigration = readFileSync(
        resolve(process.cwd(), 'supabase/migrations/20260822130000_bucket_a_security_hardening.sql'),
        'utf8'
    );

    it('matches the database booking and payment-status domains exactly', () => {
        expect(Object.values(BookingStatus)).toEqual([
            'pending', 'accepted', 'driver_arrived', 'picked_up', 'completed', 'cancelled',
        ]);
        expect(Object.values(PaymentStatus)).toEqual([
            'pending', 'rider_confirmed', 'driver_confirmed', 'completed', 'disputed',
        ]);
        expect(baselineMigration).toContain(
            "status TEXT CHECK (status IN ('pending', 'accepted', 'driver_arrived', 'picked_up', 'completed', 'cancelled'))"
        );
        expect(baselineMigration).toContain(
            "payment_status TEXT CHECK (payment_status IN ('pending', 'rider_confirmed', 'driver_confirmed', 'completed', 'disputed'))"
        );
    });

    it('keeps booking state and payment records server-controlled after the hardening migration', () => {
        expect(hardeningMigration).toContain(
            'REVOKE INSERT, UPDATE, DELETE ON public.bookings FROM anon, authenticated;'
        );
        expect(hardeningMigration).toContain(
            'REVOKE INSERT, UPDATE, DELETE ON public.payments FROM anon, authenticated;'
        );
        expect(hardeningMigration).toContain(
            'REVOKE INSERT, UPDATE, DELETE ON public.wallets FROM anon, authenticated;'
        );
    });
});
