import { z } from 'zod';

export const registerSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string().min(8),
        role: z.enum(['USER', 'ADMIN']).optional(),
    }),
});

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string(),
    }),
});

export const refreshSchema = z.object({
    body: z.object({
        refreshToken: z.string(),
    }),
});

export const logoutSchema = z.object({
    body: z.object({
        refreshToken: z.string(),
    }),
});
