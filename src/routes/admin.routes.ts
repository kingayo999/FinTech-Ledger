import { Router } from 'express';
import { AuditService } from '../services/audit.service';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// Only Admins can view audit logs
router.get('/logs', authenticate, authorize(['ADMIN']), async (req, res) => {
    try {
        const logs = await AuditService.getLogs();
        res.status(200).json({ status: 'SUCCESS', data: logs });
    } catch (error: any) {
        res.status(500).json({ status: 'ERROR', message: error.message });
    }
});

export default router;
