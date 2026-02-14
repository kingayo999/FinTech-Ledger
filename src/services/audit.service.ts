import prisma from '../config/prisma';

export class AuditService {
    /**
     * Records a sensitive action performed by an administrator.
     */
    static async logAction(adminId: string, action: string, metadata?: any) {
        return await prisma.auditLog.create({
            data: {
                adminId,
                action,
                metadata: metadata || {},
            },
        });
    }

    /**
     * Retrieves audit logs (Admin only).
     */
    static async getLogs() {
        return await prisma.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                admin: {
                    select: { email: true, role: true },
                },
            },
        });
    }
}
