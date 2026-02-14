import prisma from '../config/prisma';
import { Prisma } from '@prisma/client';
import { BalanceService } from './balance.service';

export class LedgerService {
    /**
     * Executes a transfer between two wallets.
     * This is atomic and follows double-entry principles.
     */
    static async transfer(
        fromWalletId: string,
        toWalletId: string,
        amount: number | Prisma.Decimal,
        description: string,
        metadata?: any
    ) {
        const transferAmount = new Prisma.Decimal(amount);

        if (transferAmount.isNegative() || transferAmount.isZero()) {
            throw new Error('Transfer amount must be positive');
        }

        // ACID Transaction with Pessimistic Locking
        return await prisma.$transaction(async (tx: any) => {
            // 1. Lock Sender Wallet row to prevent concurrent double-spend
            // This is critical for financial integrity.
            const [sender]: any = await tx.$queryRaw`
                SELECT * FROM "Wallet" WHERE id = ${fromWalletId} FOR UPDATE
            `;

            if (!sender) {
                throw new Error('Sender wallet not found');
            }

            // 2. Validate current balance (derived from the locked record)
            if (sender.balance.lessThan(transferAmount)) {
                throw new Error('Insufficient funds');
            }

            // 3. Create high-level Transaction record
            const transaction = await tx.transaction.create({
                data: {
                    description,
                },
            });

            // 4. Create Ledger Entries (The Immutable Audit Trail)
            // Debit Sender
            await tx.ledgerEntry.create({
                data: {
                    walletId: fromWalletId,
                    transactionId: transaction.id,
                    amount: transferAmount.negated(),
                    metadata,
                },
            });

            // Credit Receiver
            await tx.ledgerEntry.create({
                data: {
                    walletId: toWalletId,
                    transactionId: transaction.id,
                    amount: transferAmount,
                    metadata,
                },
            });

            // 5. Update Materialized Balances (Atomic Performance Optimization)
            await tx.wallet.update({
                where: { id: fromWalletId },
                data: { balance: { decrement: transferAmount } }
            });

            await tx.wallet.update({
                where: { id: toWalletId },
                data: { balance: { increment: transferAmount } }
            });

            return transaction;
        });
    }
}
