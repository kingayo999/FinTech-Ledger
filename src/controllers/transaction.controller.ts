import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { LedgerService } from '../services/ledger.service';
import prisma from '../config/prisma';

export class TransactionController {
    static async transfer(req: AuthRequest, res: Response) {
        try {
            const { fromWalletId, toWalletId, amount, description, referenceId } = req.body;
            const userId = req.user!.userId;

            // CRITICAL SECURITY FIX: Verify sender wallet ownership
            const senderWallet = await prisma.wallet.findFirst({
                where: {
                    id: fromWalletId,
                    userId: userId
                }
            });

            if (!senderWallet) {
                return res.status(403).json({
                    status: 'ERROR',
                    message: 'Unauthorized: You do not own this wallet'
                });
            }

            // Sanitize metadata to prevent XSS, JSON bloat, and injection attacks
            const cleanMetadata = {
                actor: userId,
                ip: String(req.ip || '').replace(/[^0-9.:]/g, '').substring(0, 45), // IPv6 max
                userAgent: String(req.get('User-Agent') || 'unknown')
                    .replace(/[<>\"'`]/g, '') // Remove XSS-prone characters
                    .substring(0, 200),
                timestamp: new Date().toISOString()
            };

            // Validate metadata size (prevent JSON bloat)
            if (JSON.stringify(cleanMetadata).length > 1000) {
                return res.status(400).json({
                    status: 'ERROR',
                    message: 'Transaction metadata too large'
                });
            }

            const transaction = await LedgerService.transfer(
                fromWalletId,
                toWalletId,
                amount,
                description,
                referenceId,
                cleanMetadata
            );

            res.status(201).json({ status: 'SUCCESS', data: transaction });
        } catch (error: any) {
            res.status(400).json({ status: 'ERROR', message: error.message });
        }
    }
    static async list(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.userId;
            const walletIdParam = req.params.walletId;
            const limit = req.query.limit ? Number(String(req.query.limit)) : 20;
            const offset = req.query.offset ? Number(String(req.query.offset)) : 0;

            // Ensure walletId is a string (Express params can be string | string[])
            let targetWalletId = Array.isArray(walletIdParam) ? walletIdParam[0] : walletIdParam;

            // If no walletId provided in params, fetch the user's first wallet (default)
            // or we could require it. For dashboard simplicity, let's find one if missing.
            if (!targetWalletId) {
                const userWallets = await prisma.wallet.findMany({
                    where: { userId },
                    take: 1
                });
                if (userWallets.length > 0) {
                    targetWalletId = userWallets[0].id;
                } else {
                    return res.status(200).json({ status: 'SUCCESS', data: [] });
                }
            } else {
                // Verify ownership if walletId is provided
                const wallet = await prisma.wallet.findFirst({
                    where: { id: targetWalletId, userId }
                });
                if (!wallet) {
                    return res.status(403).json({ status: 'ERROR', message: 'Unauthorized' });
                }
            }

            const transactions = await LedgerService.getTransactions(targetWalletId, limit, offset);
            res.status(200).json({ status: 'SUCCESS', data: transactions });
        } catch (error: any) {
            res.status(500).json({ status: 'ERROR', message: error.message });
        }
    }
}
