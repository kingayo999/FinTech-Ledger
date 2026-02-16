import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter
 * Limit: 100 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: {
        status: 'ERROR',
        message: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Strict rate limiter for authentication endpoints
 * Limit: 5 requests per 15 minutes per IP
 * Prevents brute force attacks
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        status: 'ERROR',
        message: 'Too many authentication attempts, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
});

/**
 * Financial transaction rate limiter
 * Limit: 20 requests per 10 minutes per IP
 * Prevents transaction spam and potential abuse
 */
export const transactionLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 20,
    message: {
        status: 'ERROR',
        message: 'Transaction rate limit exceeded. Please wait before making more transfers.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
