import prisma from '../config/prisma';

/**
 * Cleanup Job for Database Maintenance
 * Handles archival and cleanup of old data
 */
export class CleanupJob {
    /**
     * Archive old transactions (90+ days)
     * WARNING: Only run after ensuring regulatory compliance and backups
     */
    static async archiveOldTransactions(): Promise<void> {
        console.log('[Cleanup] Starting transaction archival job...');

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 90); // 90 days retention

        try {
            // Count transactions eligible for archival
            const eligibleCount = await prisma.transaction.count({
                where: {
                    createdAt: { lt: cutoffDate }
                }
            });

            console.log(`[Cleanup] Found ${eligibleCount} transactions older than 90 days`);

            // In production, you would:
            // 1. Export to cold storage (S3, Glacier, etc.)
            // 2. Verify backup integrity
            // 3. Only then delete from hot database
            // 4. Ensure compliance with financial regulations (typically 7 years)

            // For now, just log - DO NOT DELETE financial records without proper archival
            if (eligibleCount > 0) {
                console.log('[Cleanup] ⚠️  Production reminder: Archive to cold storage before deletion');
                console.log('[Cleanup] ⚠️  Regulatory retention: Typically 7 years for financial records');
            }

        } catch (error) {
            console.error('[Cleanup] Error during archival job:', error);
        }
    }

    /**
     * Clean up expired idempotency keys
     * Safe to delete after transaction is finalized and no longer retried
     */
    static async cleanupExpiredIdempotencyKeys(): Promise<void> {
        console.log('[Cleanup] Cleaning up expired idempotency keys...');

        const cutoffDate = new Date();
        cutoffDate.setHours(cutoffDate.getHours() - 24); // 24 hour window

        try {
            // Remove referenceId from old transactions to free up unique constraint
            // This allows the same referenceId to be reused after 24 hours
            const result = await prisma.transaction.updateMany({
                where: {
                    createdAt: { lt: cutoffDate },
                    referenceId: { not: null }
                },
                data: {
                    referenceId: null
                }
            });

            console.log(`[Cleanup] Cleared ${result.count} expired idempotency keys`);
        } catch (error) {
            console.error('[Cleanup] Error cleaning idempotency keys:', error);
        }
    }

    /**
     * Vacuum analyze for database performance
     */
    static async optimizeDatabase(): Promise<void> {
        console.log('[Cleanup] Running database optimization...');

        try {
            // Update table statistics for query planner
            await prisma.$executeRawUnsafe('ANALYZE "LedgerEntry"');
            await prisma.$executeRawUnsafe('ANALYZE "Transaction"');
            await prisma.$executeRawUnsafe('ANALYZE "Wallet"');

            console.log('[Cleanup] ✅ Database statistics updated');
        } catch (error) {
            console.error('[Cleanup] Error optimizing database:', error);
        }
    }

    /**
     * Run all cleanup tasks
     */
    static async runAll(): Promise<void> {
        console.log('[Cleanup] ========================================');
        console.log('[Cleanup] Starting complete cleanup job');
        console.log('[Cleanup] ========================================');

        await this.cleanupExpiredIdempotencyKeys();
        await this.archiveOldTransactions();
        await this.optimizeDatabase();

        console.log('[Cleanup] ========================================');
        console.log('[Cleanup] Cleanup job complete');
        console.log('[Cleanup] ========================================');
    }
}
