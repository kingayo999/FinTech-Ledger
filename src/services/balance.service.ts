import prisma from '../config/prisma';
import { Prisma } from '@prisma/client';

export class BalanceService {
    /**
     * Derives the current balance of a wallet by summing all ledger entries.
     * This is the "Historical Truth" of the account.
     */
    static async getBalance(walletId: string): Promise<Prisma.Decimal> {
        const wallet = await prisma.wallet.findUnique({
            where: { id: walletId },
            select: { balance: true }
        });

        if (!wallet) {
            throw new Error('Wallet not found');
        }

        return wallet.balance;
    }
}
