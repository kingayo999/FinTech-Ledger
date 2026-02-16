import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';
import { registerSchema, loginSchema, refreshSchema, logoutSchema } from '../schemas/auth.schema';
import { authLimiter } from '../middlewares/rateLimit.middleware';

const router = Router();

// Apply strict rate limiting to authentication endpoints
router.use(authLimiter);

router.post('/register', validate(registerSchema), AuthController.register);
router.post('/login', validate(loginSchema), AuthController.login);
router.post('/refresh', validate(refreshSchema), AuthController.refresh);
router.post('/logout', validate(logoutSchema), AuthController.logout);

export default router;
