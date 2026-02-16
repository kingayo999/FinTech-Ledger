import { Router } from 'express';
import { WalletController } from '../controllers/wallet.controller';
import { TransactionController } from '../controllers/transaction.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createWalletSchema, transferSchema, getBalanceSchema, fundSchema } from '../schemas/ledger.schema';

const router = Router();

// All ledger routes require authentication
router.use(authenticate);

// Wallet routes
router.post('/wallets', validate(createWalletSchema), WalletController.create);
router.get('/wallets', WalletController.list);
router.get('/wallets/:walletId/balance', validate(getBalanceSchema), WalletController.getBalance);
router.post('/wallets/:walletId/fund', validate(fundSchema), WalletController.fund);
router.get('/wallets/:walletId/transactions', TransactionController.list);

// Transaction routes
router.post('/transfer', validate(transferSchema), TransactionController.transfer);

export default router;
