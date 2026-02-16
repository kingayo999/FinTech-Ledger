import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { WalletService } from '../services/wallet.service';
import { BalanceService } from '../services/balance.service';
import { LedgerService } from '../services/ledger.service';
import prisma from '../config/prisma';

export class WalletController {
    static async create(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.userId;
            const { currency } = req.body;
            const wallet = await WalletService.createWallet(userId, currency);
            res.status(201).json({ status: 'SUCCESS', data: wallet });
        } catch (error: any) {
            res.status(400).json({ status: 'ERROR', message: error.message });
        }
    }

    static async list(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.userId;
            const wallets = await WalletService.getWalletsByUser(userId);
            res.status(200).json({ status: 'SUCCESS', data: wallets });
        } catch (error: any) {
            res.status(500).json({ status: 'ERROR', message: error.message });
        }
    }

    static async getBalance(req: AuthRequest, res: Response) {
        try {
            const { walletId } = req.params as { walletId: string };
            const balance = await BalanceService.getBalance(walletId);
            res.status(200).json({ status: 'SUCCESS', data: { walletId, balance } });
        } catch (error: any) {
            res.status(400).json({ status: 'ERROR', message: error.message });
        }
    }

    static async fund(req: AuthRequest, res: Response) {
        try {
            const { walletId } = req.params as { walletId: string };
            const { amount } = req.body;
            const userId = req.user!.userId;
            const userRole = req.user!.role;

            // CRITICAL SECURITY FIX: Verify ownership OR admin role
            if (userRole !== 'ADMIN') {
                const wallet = await prisma.wallet.findFirst({
                    where: {
                        id: walletId,
                        userId: userId
                    }
                });

                if (!wallet) {
                    return res.status(403).json({
                        status: 'ERROR',
                        message: 'Unauthorized: You do not own this wallet'
                    });
                }
            }

            const transaction = await LedgerService.fund(walletId, amount);

            res.status(200).json({
                status: 'SUCCESS',
                message: 'Wallet funded successfully',
                data: transaction
            });
        } catch (error: any) {
            res.status(400).json({ status: 'ERROR', message: error.message });
        }
    }
}
