import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/config/prisma';

describe('Transfer Integration Flow', () => {
    let userToken: string;
    let walletId: string;
    let secondWalletId: string;

    beforeAll(async () => {
        // Clean test database
        await prisma.ledgerEntry.deleteMany();
        await prisma.transaction.deleteMany();
        await prisma.wallet.deleteMany();
        await prisma.refreshToken.deleteMany();
        await prisma.auditLog.deleteMany();
        await prisma.user.deleteMany();
    });

    it('should complete full transfer lifecycle', async () => {
        // 1. Register user
        const registerRes = await request(app)
            .post('/auth/register')
            .send({ email: 'integration@example.com', password: 'Test123!' });

        expect(registerRes.status).toBe(201);
        userToken = registerRes.body.data.accessToken;

        // 2. Get auto-created wallet
        const walletsRes = await request(app)
            .get('/api/wallets')
            .set('Authorization', `Bearer ${userToken}`);

        expect(walletsRes.status).toBe(200);
        walletId = walletsRes.body.data[0].id;

        // 3. Fund wallet
        const fundRes = await request(app)
            .post(`/api/wallets/${walletId}/fund`)
            .set('Authorization', `Bearer ${userToken}`)
            .send({ amount: 1000 });

        expect(fundRes.status).toBe(200);

        // 4. Create second wallet
        const createWalletRes = await request(app)
            .post('/api/wallets')
            .set('Authorization', `Bearer ${userToken}`)
            .send({ currency: 'USD' });

        expect(createWalletRes.status).toBe(201);
        secondWalletId = createWalletRes.body.data.id;

        // 5. Transfer
        const transferRes = await request(app)
            .post('/api/transfer')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                fromWalletId: walletId,
                toWalletId: secondWalletId,
                amount: 250,
                description: 'Integration test transfer'
            });

        expect(transferRes.status).toBe(201);

        // 6. Verify balances
        const balance1 = await request(app)
            .get(`/api/wallets/${walletId}/balance`)
            .set('Authorization', `Bearer ${userToken}`);

        expect(balance1.body.data.balance).toBe('750.00000000');

        const balance2 = await request(app)
            .get(`/api/wallets/${secondWalletId}/balance`)
            .set('Authorization', `Bearer ${userToken}`);

        expect(balance2.body.data.balance).toBe('250.00000000');
    });

    it('should reject transfer with insufficient funds', async () => {
        const transferRes = await request(app)
            .post('/api/transfer')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                fromWalletId: walletId,
                toWalletId: secondWalletId,
                amount: 10000,
                description: 'Should fail'
            });

        expect(transferRes.status).toBe(400);
        expect(transferRes.body.message).toContain('Insufficient funds');
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });
});
