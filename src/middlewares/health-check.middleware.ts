import prisma from '../config/prisma';
import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';

/**
 * System Health Monitor
 * Checks ledger integrity and provides circuit breaker functionality
 */
class SystemHealth {
    private static isHealthy = true;
    private static lastCheck = Date.now();
    private static CHECK_INTERVAL = 60000; // 1 minute

    /**
     * Check if the ledger is balanced (SUM = 0)
     */
    static async check(): Promise<boolean> {
        // Cache health status for 1 minute to avoid excessive DB queries
        if (Date.now() - this.lastCheck < this.CHECK_INTERVAL) {
            return this.isHealthy;
        }

        try {
            const sum = await prisma.ledgerEntry.aggregate({
                _sum: { amount: true }
            });

            const amount = sum._sum.amount || new Prisma.Decimal(0);
            console.log('[Health] Ledger Sum:', amount.toString(), 'IsZero:', amount.isZero());
            this.isHealthy = amount.isZero();
            this.lastCheck = Date.now();

            if (!this.isHealthy) {
                console.error('[CRITICAL] Ledger integrity violation detected!');
            }
        } catch (error) {
            console.error('[Health Check] Database error:', error);
            this.isHealthy = false;
        }

        return this.isHealthy;
    }

    /**
     * Get cached health status (no DB query)
     */
    static getStatus(): boolean {
        return this.isHealthy;
    }

    /**
     * Force health check refresh
     */
    static async forceCheck(): Promise<boolean> {
        this.lastCheck = 0; // Force refresh
        return await this.check();
    }
}

/**
 * Circuit Breaker Middleware
 * Halts write operations if ledger integrity is compromised
 */
export async function healthCheckMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
) {
    // Skip health check for read-only operations
    if (req.method === 'GET' || req.method === 'HEAD') {
        return next();
    }

    // Check system health
    const healthy = await SystemHealth.check();

    if (!healthy) {
        return res.status(503).json({
            status: 'ERROR',
            message: 'System is temporarily unavailable due to maintenance. Please try again later.',
            code: 'SYSTEM_MAINTENANCE'
        });
    }

    next();
}

/**
 * Health check endpoint for load balancers
 */
export async function healthCheckEndpoint(req: Request, res: Response) {
    const healthy = await SystemHealth.forceCheck();

    if (healthy) {
        res.status(200).json({
            status: 'healthy',
            timestamp: new Date().toISOString()
        });
    } else {
        res.status(503).json({
            status: 'unhealthy',
            message: 'Ledger integrity compromised',
            timestamp: new Date().toISOString()
        });
    }
}

export { SystemHealth };
