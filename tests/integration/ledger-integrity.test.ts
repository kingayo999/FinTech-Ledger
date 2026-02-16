import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../../src/config/prisma';
import { LedgerService } from '../../src/services/ledger.service';
import { Prisma } from '@prisma/client';

describe('Ledger Integrity Tests', () => {
    let testWalletId: string;
    let testUserId: string;

    beforeAll(async () => {
        // Clean database
        await prisma.ledgerEntry.deleteMany();
        await prisma.transaction.deleteMany();
        await prisma.wallet.deleteMany();
        await prisma.user.deleteMany();

        // Create test user
        const user = await prisma.user.create({
            data: {
                email: 'ledger-test@example.com',
                passwordHash: 'test-hash',
                role: 'USER'
            }
        });
        testUserId = user.id;

        // Create test wallet
        const wallet = await prisma.wallet.create({
            data: {
                userId: testUserId,
                currency: 'USD'
            }
        });
        testWalletId = wallet.id;
    });

    it('should maintain double-entry integrity after funding', async () => {
        // Fund the wallet
        await LedgerService.fund(testWalletId, 1000);

        // Verify global ledger sums to zero
        const globalSum = await prisma.ledgerEntry.aggregate({
            _sum: { amount: true }
        });

        expect(globalSum._sum.amount?.isZero()).toBe(true);
    });

    it('should maintain double-entry integrity after transfer', async () => {
        // Create second wallet
        const wallet2 = await prisma.wallet.create({
            data: {
                userId: testUserId,
                currency: 'USD'
            }
        });

        // Transfer funds
        await LedgerService.transfer(
            testWalletId,
            wallet2.id,
            250,
            'Test transfer'
        );

        // Verify global ledger still sums to zero
        const globalSum = await prisma.ledgerEntry.aggregate({
            _sum: { amount: true }
        });

        expect(globalSum._sum.amount?.isZero()).toBe(true);
    });

    it('should verify wallet balance matches ledger sum', async () => {
        const wallet = await prisma.wallet.findUnique({
            where: { id: testWalletId }
        });

        const ledgerSum = await prisma.ledgerEntry.aggregate({
            where: { walletId: testWalletId },
            _sum: { amount: true }
        });

        expect(wallet!.balance.equals(ledgerSum._sum.amount!)).toBe(true);
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });
});
