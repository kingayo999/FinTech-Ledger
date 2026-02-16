import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import ledgerRoutes from './routes/ledger.routes';
import adminRoutes from './routes/admin.routes';
import { errorHandler } from './middlewares/error.middleware';
import { apiLimiter } from './middlewares/rateLimit.middleware';
import { healthCheckMiddleware, healthCheckEndpoint } from './middlewares/health-check.middleware';

dotenv.config();

const app: Application = express();

app.use(express.json());

// Configure CORS
import cors from 'cors';
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Apply general rate limiting to all routes
app.use(apiLimiter);

// Health check endpoint (before circuit breaker)
app.get('/health', healthCheckEndpoint);

app.get('/', (req: Request, res: Response) => {
    res.status(200).json({
        message: 'Welcome to FinTech Ledger API',
        documentation: 'Visit /health for system status',
        endpoints: ['/auth', '/api', '/admin']
    });
});

// Apply circuit breaker to all financial transaction routes
app.use('/api', healthCheckMiddleware);
app.use('/admin', healthCheckMiddleware);

// Routes
app.use('/auth', authRoutes);
app.use('/api', ledgerRoutes);
app.use('/admin', adminRoutes);

// Global error handler
app.use(errorHandler);

export default app;
