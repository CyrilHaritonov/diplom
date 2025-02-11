import { Request, Response } from 'express';
import { getKeycloak } from './keycloak.middleware';

export class AuthController {
    static login(req: Request, res: Response) {
        return getKeycloak().protect()(req, res, () => {
            res.json({ message: 'Login successful' });
        });
    }

    static logout(req: Request, res: Response) {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        return res.redirect(getKeycloak().logoutUrl(baseUrl));
    }

    static getUserInfo(req: Request, res: Response) {
        return getKeycloak().protect()(req, res, () => {
            // @ts-ignore - Keycloak adds the user property to the request
            const userInfo = req.kauth?.grant?.access_token?.content || {};
            res.json(userInfo);
        });
    }
} 