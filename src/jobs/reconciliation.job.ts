import prisma from '../config/prisma';
import { Prisma } from '@prisma/client';

/**
 * Nightly Reconciliation Job
 * Verifies ledger integrity and balance consistency
 */
export class ReconciliationJob {
    /**
     * Run full reconciliation check
     */
    static async run(): Promise<void> {
        console.log('[Reconciliation] Starting nightly reconciliation...');

        const startTime = Date.now();
        let errors = 0;

        try {
            // 1. Verify global ledger integrity
            await this.verifyGlobalLedgerIntegrity();

            // 2. Verify per-wallet balance consistency
            await this.verifyWalletBalances();

            // 3. Verify per-transaction integrity
            await this.verifyTransactionIntegrity();

            const duration = Date.now() - startTime;
            console.log(`[Reconciliation] Complete. Duration: ${duration}ms, Errors: ${errors}`);
        } catch (error: any) {
            console.error('[Reconciliation] Fatal error:', error.message);
            await this.alertOps('CRITICAL: Reconciliation job failed', {
                error: error.message,
                stack: error.stack
            });
        }
    }

    /**
     * Verify that all ledger entries sum to zero (double-entry principle)
     */
    private static async verifyGlobalLedgerIntegrity(): Promise<void> {
        const globalSum = await prisma.ledgerEntry.aggregate({
            _sum: { amount: true }
        });

        const sum = globalSum._sum.amount || new Prisma.Decimal(0);

        if (!sum.isZero()) {
            await this.alertOps('CRITICAL: Global ledger imbalance detected!', {
                sum: sum.toString(),
                severity: 'CRITICAL'
            });
            throw new Error(`Global ledger imbalance: ${sum.toString()}`);
        }

        console.log('[Reconciliation] ✅ Global ledger integrity verified (sum = 0)');
    }

    /**
     * Verify that materialized wallet balances match ledger sums
     */
    private static async verifyWalletBalances(): Promise<void> {
        const wallets = await prisma.wallet.findMany();
        let driftCount = 0;

        for (const wallet of wallets) {
            const ledgerSum = await prisma.ledgerEntry.aggregate({
                where: { walletId: wallet.id },
                _sum: { amount: true }
            });

            const ledgerBalance = ledgerSum._sum.amount || new Prisma.Decimal(0);

            if (!wallet.balance.equals(ledgerBalance)) {
                driftCount++;
                const drift = wallet.balance.minus(ledgerBalance);

                await this.alertOps(`Balance drift detected for wallet ${wallet.id}`, {
                    walletId: wallet.id,
                    userId: wallet.userId,
                    materialized: wallet.balance.toString(),
                    ledger: ledgerBalance.toString(),
                    drift: drift.toString(),
                    severity: drift.abs().greaterThan(new Prisma.Decimal('0.01')) ? 'HIGH' : 'LOW'
                });
            }
        }

        if (driftCount === 0) {
            console.log(`[Reconciliation] ✅ All ${wallets.length} wallet balances verified`);
        } else {
            console.error(`[Reconciliation] ❌ ${driftCount} wallets have balance drift`);
        }
    }

    /**
     * Verify that each transaction's ledger entries sum to zero
     */
    private static async verifyTransactionIntegrity(): Promise<void> {
        const transactions = await prisma.transaction.findMany({
            include: {
                ledgerEntries: true
            },
            take: 1000, // Sample recent transactions
            orderBy: { createdAt: 'desc' }
        });

        let invalidCount = 0;

        for (const transaction of transactions) {
            const sum = transaction.ledgerEntries.reduce(
                (acc, entry) => acc.plus(entry.amount),
                new Prisma.Decimal(0)
            );

            if (!sum.isZero()) {
                invalidCount++;
                await this.alertOps(`Transaction integrity violation`, {
                    transactionId: transaction.id,
                    description: transaction.description,
                    sum: sum.toString(),
                    entryCount: transaction.ledgerEntries.length,
                    severity: 'HIGH'
                });
            }
        }

        if (invalidCount === 0) {
            console.log(`[Reconciliation] ✅ All ${transactions.length} sampled transactions verified`);
        } else {
            console.error(`[Reconciliation] ❌ ${invalidCount} transactions have integrity violations`);
        }
    }

    /**
     * Send alert to operations team
     */
    private static async alertOps(message: string, data: any): Promise<void> {
        // In production, integrate with monitoring systems:
        // - PagerDuty: await pagerduty.trigger({ message, data });
        // - Datadog: await datadog.event({ title: message, text: JSON.stringify(data) });
        // - Slack: await slack.send({ channel: '#alerts', text: message });

        console.error(`[ALERT] ${message}`, JSON.stringify(data, null, 2));

        // Store alert in database for audit trail
        try {
            await prisma.auditLog.create({
                data: {
                    adminId: 'SYSTEM',
                    action: 'RECONCILIATION_ALERT',
                    metadata: {
                        message,
                        ...data,
                        timestamp: new Date().toISOString()
                    }
                }
            });
        } catch (error) {
            console.error('[Reconciliation] Failed to log alert:', error);
        }
    }
}

// Utility function to verify ledger integrity on-demand
export async function verifyLedgerIntegrity(): Promise<boolean> {
    const sum = await prisma.ledgerEntry.aggregate({
        _sum: { amount: true }
    });
    return sum._sum.amount?.isZero() ?? false;
}
