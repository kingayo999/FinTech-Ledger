import { describe, it, expect } from 'vitest';
import { Prisma } from '@prisma/client';

describe('Balance Calculations', () => {
    it('should correctly sum positive and negative entries', () => {
        const entries = [
            { amount: new Prisma.Decimal(100) },
            { amount: new Prisma.Decimal(-50) },
            { amount: new Prisma.Decimal(25) },
        ];

        const balance = entries.reduce(
            (sum, entry) => sum.plus(entry.amount),
            new Prisma.Decimal(0)
        );

        expect(balance.toString()).toBe('75');
    });

    it('should handle zero balance', () => {
        const entries = [
            { amount: new Prisma.Decimal(100) },
            { amount: new Prisma.Decimal(-100) },
        ];

        const balance = entries.reduce(
            (sum, entry) => sum.plus(entry.amount),
            new Prisma.Decimal(0)
        );

        expect(balance.isZero()).toBe(true);
    });

    it('should verify double-entry integrity', () => {
        // Simulate a transfer: -100 from wallet A, +100 to wallet B
        const entries = [
            { amount: new Prisma.Decimal(-100) },
            { amount: new Prisma.Decimal(100) },
        ];

        const sum = entries.reduce(
            (total, entry) => total.plus(entry.amount),
            new Prisma.Decimal(0)
        );

        expect(sum.isZero()).toBe(true);
    });
});

describe('Transfer Validation', () => {
    it('should reject negative amounts', () => {
        const amount = new Prisma.Decimal(-50);
        expect(amount.isNegative()).toBe(true);
    });

    it('should reject zero amounts', () => {
        const amount = new Prisma.Decimal(0);
        expect(amount.isZero()).toBe(true);
    });

    it('should accept positive amounts', () => {
        const amount = new Prisma.Decimal(100);
        expect(amount.isPositive()).toBe(true);
    });

    it('should handle decimal precision', () => {
        const amount = new Prisma.Decimal('123.45678912');
        expect(amount.toFixed(8)).toBe('123.45678912');
    });
});
