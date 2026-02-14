import prisma from '../config/prisma';
import bcrypt from 'bcrypt';
import { JwtUtils } from '../utils/jwt';
import { AuditService } from './audit.service';

export class AuthService {
    static async register(email: string, password: string, role: 'USER' | 'ADMIN' = 'USER') {
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                passwordHash: hashedPassword,
                role,
            },
            select: {
                id: true,
                email: true,
                role: true,
            }
        });

        // Audit administrative registration
        if (role === 'ADMIN') {
            await AuditService.logAction(user.id, 'ADMIN_REGISTERED', { email: user.email });
        }

        return user;
    }

    static async login(email: string, password: string) {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            throw new Error('Invalid credentials');
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            throw new Error('Invalid credentials');
        }

        const token = JwtUtils.generateToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            }
        };
    }
}
