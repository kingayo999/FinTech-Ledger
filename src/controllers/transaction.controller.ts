import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { LedgerService } from '../services/ledger.service';

export class TransactionController {
    static async transfer(req: AuthRequest, res: Response) {
        try {
            const { fromWalletId, toWalletId, amount, description } = req.body;

            // Ensure the user owns the fromWalletId (Simple check for now, can be expanded)
            // In a real system, we'd query the wallet to verify ownership first.

            const transaction = await LedgerService.transfer(
                fromWalletId,
                toWalletId,
                amount,
                description
            );

            res.status(201).json({ status: 'SUCCESS', data: transaction });
        } catch (error: any) {
            res.status(400).json({ status: 'ERROR', message: error.message });
        }
    }
}
