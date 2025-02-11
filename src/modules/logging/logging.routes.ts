import express from 'express';
import { LogService } from './log.service';

export function createLoggingRouter(keycloak: any) {
    const router = express.Router();

    // Export logs route
    router.get('/export',
        keycloak.protect(),
        async (req, res) => {
            try {
                // @ts-ignore - Keycloak adds user info to request
                const userId = req.kauth?.grant?.access_token?.content?.sub;
                const filepath = await LogService.exportLogsToFile(userId);
                res.download(filepath);
            } catch (error) {
                console.error('Failed to export logs:', error);
                res.status(500).json({ error: 'Failed to export logs' });
            }
        }
    );

    // Get logs
    router.get('/',
        keycloak.protect(),
        async (req, res) => {
            try {
                // @ts-ignore - Keycloak adds user info to request
                const userId = req.kauth?.grant?.access_token?.content?.sub;
                const logs = await LogService.getLogs(userId);
                res.json(logs);
            } catch (error) {
                console.error('Failed to fetch logs:', error);
                res.status(500).json({ error: 'Failed to fetch logs' });
            }
        }
    );

    return router;
} 