import { ReconciliationJob } from './reconciliation.job';
import { CleanupJob } from './cleanup.job';
import cron from 'node-cron';

/**
 * Schedule automated background jobs
 */
export function scheduleJobs() {
    console.log('[Jobs] Scheduling automated background jobs...');

    // Run reconciliation daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
        console.log('[Jobs] Running nightly reconciliation...');
        try {
            await ReconciliationJob.run();
        } catch (error) {
            console.error('[Jobs] Reconciliation failed:', error);
        }
    });

    // Run cleanup weekly on Sunday at 3 AM
    cron.schedule('0 3 * * 0', async () => {
        console.log('[Jobs] Running weekly cleanup...');
        try {
            await CleanupJob.runAll();
        } catch (error) {
            console.error('[Jobs] Cleanup failed:', error);
        }
    });

    console.log('[Jobs] ✅ Scheduled jobs:');
    console.log('[Jobs]   - Reconciliation: Daily at 2:00 AM');
    console.log('[Jobs]   - Cleanup: Weekly on Sunday at 3:00 AM');
}
