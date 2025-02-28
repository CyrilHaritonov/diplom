import { Request, Response } from 'express';

// Middleware to check the custom header
export const checkCustomHeader = (allowed_fqdn: string) => (req: Request, res: Response, next: Function) => {
    const requestedBy = req.headers['x-requested-by'];
    if (requestedBy === allowed_fqdn) {
        next();
    } else {
        res.status(403).send('Forbidden: Invalid Request Source');
    }
};