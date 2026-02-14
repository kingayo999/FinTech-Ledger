import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

export class AuthController {
    static async register(req: Request, res: Response) {
        try {
            const { email, password, role } = req.body;
            const user = await AuthService.register(email, password, role);
            res.status(201).json({ status: 'SUCCESS', data: user });
        } catch (error: any) {
            res.status(400).json({ status: 'ERROR', message: error.message });
        }
    }

    static async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;
            const result = await AuthService.login(email, password);
            res.status(200).json({ status: 'SUCCESS', data: result });
        } catch (error: any) {
            res.status(401).json({ status: 'ERROR', message: error.message });
        }
    }
}
