import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import ledgerRoutes from './routes/ledger.routes';
import adminRoutes from './routes/admin.routes';
import { errorHandler } from './middlewares/error.middleware';

dotenv.config();

const app: Application = express();

app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/api', ledgerRoutes);
app.use('/admin', adminRoutes);

app.get('/', (req: Request, res: Response) => {
    res.status(200).json({
        message: 'Welcome to FinTech Ledger API',
        documentation: 'Visit /health for system status',
        endpoints: ['/auth', '/api', '/admin']
    });
});

app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// Global error handler
app.use(errorHandler);

export default app;
