import express from 'express';
import { LogService } from './log.service';
import { logAction } from './logging.middleware';
import { LogAction, LogSubject } from './types';
import { RoleBindingService } from '../role-bindings/role-binding.service';

export function createLoggingRouter(keycloak: any, botUrl: string) {
    const router = express.Router();

    // Get workspace logs
    router.get('/workspace/:workspaceId',
        keycloak.protect(),
        async (req, res): Promise<void> => {
            try {
                // @ts-ignore - Keycloak adds user info to request
                const userId = req.kauth?.grant?.access_token?.content?.sub;
                const workspaceId = req.params.workspaceId;

                // Check if user has see_logs permission in this workspace
                const roleBindings = await RoleBindingService.findByUserAndWorkspace(userId, workspaceId);
                const canSeeLogs = roleBindings.some(rb => rb.role.see_logs);

                if (!canSeeLogs) {
                    res.status(403).json({ error: 'Access denied: Insufficient permissions to view logs' });
                    return;
                }

                const logs = await LogService.getWorkspaceLogs(workspaceId);
                res.json(logs);
            } catch (error) {
                console.error('Failed to fetch workspace logs:', error);
                res.status(500).json({ error: 'Failed to fetch workspace logs' });
            }
        }
    );

    // Export logs route
    router.get('/export',
        keycloak.protect(),
        async (req, res) => {
            try {
                // @ts-ignore - Keycloak adds user info to request
                const userId = req.kauth?.grant?.access_token?.content?.sub;
                const filepath = await LogService.exportLogsToFile(userId, botUrl);
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
                const logs = await LogService.getLogs(userId, botUrl);
                res.json(logs);
            } catch (error) {
                console.error('Failed to fetch logs:', error);
                res.status(500).json({ error: 'Failed to fetch logs' });
            }
        }
    );

    return router;
} 