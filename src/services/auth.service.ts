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

        // Automatically create a default USD wallet
        await prisma.wallet.create({
            data: {
                userId: user.id,
                currency: 'USD',
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

        if (!user || !user.isActive) {
            throw new Error('Invalid credentials or inactive account');
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            throw new Error('Invalid credentials');
        }

        const accessToken = JwtUtils.generateAccessToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        const refreshTokenValue = JwtUtils.generateRefreshToken({ userId: user.id });
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

        await prisma.refreshToken.create({
            data: {
                token: refreshTokenValue,
                userId: user.id,
                expiresAt,
            },
        });

        return {
            accessToken,
            refreshToken: refreshTokenValue,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            }
        };
    }

    static async refresh(token: string) {
        const payload = JwtUtils.verifyToken(token);
        if (!payload || !payload.userId) {
            throw new Error('Invalid refresh token');
        }

        const storedToken = await prisma.refreshToken.findUnique({
            where: { token },
            include: { user: true },
        });

        if (!storedToken || storedToken.expiresAt < new Date() || !storedToken.user.isActive) {
            if (storedToken) {
                await prisma.refreshToken.delete({ where: { id: storedToken.id } });
            }
            throw new Error('Refresh token expired or invalid');
        }

        const accessToken = JwtUtils.generateAccessToken({
            userId: storedToken.user.id,
            email: storedToken.user.email,
            role: storedToken.user.role,
        });

        return { accessToken };
    }

    static async logout(token: string) {
        await prisma.refreshToken.deleteMany({
            where: { token }
        });
    }
}
