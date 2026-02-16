import { Request, Response, NextFunction } from 'express';
import { JwtUtils } from '../utils/jwt';

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role: string;
    };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ status: 'ERROR', message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const payload = JwtUtils.verifyToken(token);

    if (!payload) {
        return res.status(401).json({ status: 'ERROR', message: 'Invalid or expired token' });
    }

    req.user = payload;

    // Optional: Check if user is still active in DB for every request
    // This is safer but adds DB load. For now, we trust the short-lived token.
    // In a high-security environment, we would check user.isActive here.

    next();
};

export const authorize = (roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ status: 'ERROR', message: 'Forbidden: Insufficient permissions' });
        }
        next();
    };
};
