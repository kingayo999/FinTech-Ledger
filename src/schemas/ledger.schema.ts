import { z } from 'zod';

export const createWalletSchema = z.object({
    body: z.object({
        currency: z.string().length(3).optional(),
    }),
});

export const transferSchema = z.object({
    body: z.object({
        fromWalletId: z.string().uuid(),
        toWalletId: z.string().uuid(),
        amount: z.number().positive(),
        description: z.string().min(1).max(255),
    }),
});

export const getBalanceSchema = z.object({
    params: z.object({
        walletId: z.string().uuid(),
    }),
});
