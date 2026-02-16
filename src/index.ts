import app from './app';
import { scheduleJobs } from './jobs/scheduler';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`[server]: FinTech Ledger is running at http://localhost:${PORT}`);

    // Start background jobs
    scheduleJobs();
});
