import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import prisma from '../config/prisma';

export class AdminController {
    /**
     * Get audit logs with pagination
     */
    static async getAuditLogs(req: AuthRequest, res: Response) {
        try {
            const page = parseInt(req.query.page as string) || 0;
            const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);

            const logs = await prisma.auditLog.findMany({
                orderBy: { createdAt: 'desc' },
                skip: page * limit,
                take: limit,
                include: {
                    admin: {
                        select: {
                            id: true,
                            email: true,
                            role: true
                        }
                    }
                }
            });

            const totalCount = await prisma.auditLog.count();

            res.status(200).json({
                status: 'SUCCESS',
                data: {
                    logs,
                    pagination: {
                        page,
                        limit,
                        totalCount,
                        totalPages: Math.ceil(totalCount / limit)
                    }
                }
            });
        } catch (error: any) {
            res.status(500).json({ status: 'ERROR', message: error.message });
        }
    }

    /**
     * Get ledger history for a specific wallet
     */
    static async getWalletLedger(req: AuthRequest, res: Response) {
        try {
            const { walletId } = req.params as { walletId: string };
            const page = parseInt(req.query.page as string) || 0;
            const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);

            const entries = await prisma.ledgerEntry.findMany({
                where: { walletId },
                orderBy: { createdAt: 'desc' },
                skip: page * limit,
                take: limit,
                include: {
                    transaction: {
                        select: {
                            id: true,
                            description: true,
                            referenceId: true,
                            createdAt: true
                        }
                    }
                }
            });

            const totalCount = await prisma.ledgerEntry.count({
                where: { walletId }
            });

            res.status(200).json({
                status: 'SUCCESS',
                data: {
                    entries,
                    pagination: {
                        page,
                        limit,
                        totalCount,
                        totalPages: Math.ceil(totalCount / limit)
                    }
                }
            });
        } catch (error: any) {
            res.status(500).json({ status: 'ERROR', message: error.message });
        }
    }

    /**
     * Get all ledger entries for a specific transaction
     */
    static async getTransactionLedger(req: AuthRequest, res: Response) {
        try {
            const { transactionId } = req.params as { transactionId: string };

            const entries = await prisma.ledgerEntry.findMany({
                where: { transactionId },
                include: {
                    wallet: {
                        select: {
                            id: true,
                            userId: true,
                            currency: true
                        }
                    },
                    transaction: {
                        select: {
                            id: true,
                            description: true,
                            referenceId: true,
                            createdAt: true
                        }
                    }
                }
            });

            // Verify double-entry integrity
            const sum = entries.reduce((acc, entry) =>
                acc.plus(entry.amount),
                new (await import('@prisma/client')).Prisma.Decimal(0)
            );

            res.status(200).json({
                status: 'SUCCESS',
                data: {
                    entries,
                    integrity: {
                        sum: sum.toString(),
                        isValid: sum.isZero()
                    }
                }
            });
        } catch (error: any) {
            res.status(500).json({ status: 'ERROR', message: error.message });
        }
    }
}
