import prisma from '../config/prisma';

export class WalletService {
    static async createWallet(userId: string, currency: string = 'USD') {
        return await prisma.wallet.create({
            data: {
                userId,
                currency,
            },
        });
    }

    static async getWalletsByUser(userId: string) {
        return await prisma.wallet.findMany({
            where: { userId },
            include: {
                _count: {
                    select: { ledgerEntries: true },
                },
            },
        });
    }
}
