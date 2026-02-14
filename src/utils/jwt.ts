import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export class JwtUtils {
    static generateToken(payload: { userId: string; email: string; role: string }): string {
        return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
    }

    static verifyToken(token: string): any {
        try {
            return jwt.verify(token, JWT_SECRET);
        } catch (error) {
            return null;
        }
    }
}
