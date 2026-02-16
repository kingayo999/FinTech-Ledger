import prisma from '../config/prisma';
import { Prisma } from '@prisma/client';
import { BalanceService } from './balance.service';

// Security: Maximum transfer amount ($100,000)
const MAX_TRANSFER_AMOUNT = new Prisma.Decimal('100000');

// Security: Maximum funding amount ($10,000)
const MAX_FUNDING_AMOUNT = new Prisma.Decimal(
    process.env.MAX_FUNDING_AMOUNT || '10000'
);

export class LedgerService {
    /**
     * Injects mock funds into a wallet.
     * In a real system, this would be a 'DEPOSIT' from an external bank.
     * Here, we simulate double-entry by using null walletId for system liability.
     */
    static async fund(walletId: string, amount: number | Prisma.Decimal) {
        const fundingAmount = new Prisma.Decimal(amount);

        if (fundingAmount.isNegative() || fundingAmount.isZero()) {
            throw new Error('Funding amount must be positive');
        }

        if (fundingAmount.greaterThan(MAX_FUNDING_AMOUNT)) {
            throw new Error(`Funding amount exceeds maximum limit of ${MAX_FUNDING_AMOUNT}`);
        }

        return await prisma.$transaction(async (tx: any) => {
            // 1. Verify wallet is ACTIVE
            const wallet = await tx.wallet.findUnique({
                where: { id: walletId },
                select: { id: true, status: true }
            });

            if (!wallet) throw new Error('Wallet not found');
            if (wallet.status !== 'ACTIVE') throw new Error(`Cannot fund wallet in ${wallet.status} state`);

            // 2. Create the Transaction
            const transaction = await tx.transaction.create({
                data: {
                    description: 'MOCK_FUNDING_DEPOSIT'
                }
            });

            // 3. Create Double-Entry Ledger Entries
            // Credit user wallet
            await tx.ledgerEntry.create({
                data: {
                    walletId: walletId,
                    transactionId: transaction.id,
                    amount: fundingAmount,
                    metadata: {
                        type: 'FUNDING_INFLOW',
                        source: 'MOCK_SYSTEM_DEPOSIT'
                    }
                }
            });

            // Debit system (null walletId represents external world/system liability)
            // This ensures SUM(all ledger entries) = 0 (double-entry principle)
            await tx.ledgerEntry.create({
                data: {
                    walletId: null,
                    transactionId: transaction.id,
                    amount: fundingAmount.negated(),
                    metadata: {
                        type: 'SYSTEM_LIABILITY',
                        source: 'MOCK_SYSTEM_DEPOSIT'
                    }
                }
            });

            // 4. Update Materialized Balance
            await tx.wallet.update({
                where: { id: walletId },
                data: { balance: { increment: fundingAmount } }
            });

            return transaction;
        });
    }

    /**
     * Executes a transfer between two wallets.
     * This is atomic and follows double-entry principles.
     */
    static async transfer(
        fromWalletId: string,
        toWalletId: string,
        amount: number | Prisma.Decimal,
        description: string,
        referenceId?: string, // For idempotency
        metadata?: any
    ) {
        const transferAmount = new Prisma.Decimal(amount);

        if (transferAmount.isNegative() || transferAmount.isZero()) {
            throw new Error('Transfer amount must be positive');
        }

        if (transferAmount.greaterThan(MAX_TRANSFER_AMOUNT)) {
            throw new Error(`Transfer amount exceeds maximum limit of ${MAX_TRANSFER_AMOUNT}`);
        }

        if (fromWalletId === toWalletId) {
            throw new Error('Cannot transfer to the same wallet');
        }

        // ACID Transaction with Pessimistic Locking
        return await prisma.$transaction(async (tx: any) => {
            // 1. Lock Sender AND Receiver Wallet rows
            // To prevent deadlocks, we lock them in alphabetical order of their IDs.
            const walletIds = [fromWalletId, toWalletId].sort();
            // Use parameterized query to prevent SQL injection
            await tx.$executeRaw`
                SELECT * FROM "Wallet" 
                WHERE id IN (${walletIds[0]}::text, ${walletIds[1]}::text) 
                FOR UPDATE
            `;

            // 2. Idempotency Check (AFTER acquiring locks to prevent race conditions)
            if (referenceId) {
                const existingTx = await tx.transaction.findUnique({
                    where: { referenceId }
                });
                if (existingTx) return existingTx; // Already processed
            }

            // 3. Fetch locked records
            const [sender, receiver] = await Promise.all([
                tx.wallet.findUnique({ where: { id: fromWalletId } }),
                tx.wallet.findUnique({ where: { id: toWalletId } })
            ]);

            if (!sender) throw new Error('Sender wallet not found');
            if (!receiver) throw new Error('Receiver wallet not found');

            // 4. Status & Currency Constraints
            if (sender.status !== 'ACTIVE') throw new Error(`Sender wallet is ${sender.status}`);
            if (receiver.status !== 'ACTIVE') throw new Error(`Receiver wallet is ${receiver.status}`);
            if (sender.currency !== receiver.currency) {
                throw new Error(`Currency mismatch: ${sender.currency} vs ${receiver.currency}`);
            }

            // 5. Validate current balance
            if (sender.balance.lessThan(transferAmount)) {
                throw new Error('Insufficient funds');
            }

            // 6. Create high-level Transaction record
            const transaction = await tx.transaction.create({
                data: {
                    description,
                    referenceId,
                },
            });

            // 6. Create Ledger Entries (The Immutable Audit Trail)
            // Debit Sender
            await tx.ledgerEntry.create({
                data: {
                    walletId: fromWalletId,
                    transactionId: transaction.id,
                    amount: transferAmount.negated(),
                    metadata: { ...metadata, type: 'TRANSFER_OUT' },
                },
            });

            // Credit Receiver
            await tx.ledgerEntry.create({
                data: {
                    walletId: toWalletId,
                    transactionId: transaction.id,
                    amount: transferAmount,
                    metadata: { ...metadata, type: 'TRANSFER_IN' },
                },
            });

            // 7. Update Materialized Balances
            await tx.wallet.update({
                where: { id: fromWalletId },
                data: { balance: { decrement: transferAmount } }
            });

            await tx.wallet.update({
                where: { id: toWalletId },
                data: { balance: { increment: transferAmount } }
            });

            return transaction;
        }, {
            timeout: 10000 // 10s timeout for financial transactions
        });
    }
    /**
     * Retrieves transaction history for a wallet.
     * Returns the ledger entries (which contain amount/metadata) 
     * and includes the parent Transaction details.
     */
    static async getTransactions(walletId: string, limit = 20, offset = 0) {
        // We query LedgerEntry because it links the Wallet to the Transaction
        // and provides the directional Amount (+/-) for that specific wallet.
        const entries = await prisma.ledgerEntry.findMany({
            where: { walletId },
            include: {
                transaction: true
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: limit,
            skip: offset
        });

        // Map to a cleaner format if needed, but returning entries is fine for now.
        // The frontend can parse entry.amount and entry.transaction.description.
        return entries.map(entry => ({
            id: entry.transaction.id,
            amount: entry.amount,
            type: entry.amount.isPositive() ? 'CREDIT' : 'DEBIT',
            description: entry.transaction.description,
            status: 'COMPLETED', // Transactions in ledger are always completed
            createdAt: entry.transaction.createdAt,
            referenceId: entry.transaction.referenceId,
            metadata: entry.metadata
        }));
    }
}
