import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// All admin routes require authentication + ADMIN role
router.use(authenticate, authorize(['ADMIN']));

// Audit log queries
router.get('/audit-logs', AdminController.getAuditLogs);

// Ledger queries
router.get('/ledger/wallet/:walletId', AdminController.getWalletLedger);
router.get('/ledger/transaction/:transactionId', AdminController.getTransactionLedger);

export default router;
