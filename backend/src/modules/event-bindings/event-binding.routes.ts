import express from 'express';
import { EventBindingService } from './event-binding.service';
import { logAction } from '../logging/logging.middleware';
import { LogAction, LogSubject } from '../logging/types';
import { RoleBindingService } from '../role-bindings/role-binding.service';

export function createEventBindingRouter(keycloak: any, botUrl: string) {
    const router = express.Router();

    // Create event binding
    router.post('/',
        keycloak.protect(),
        logAction(LogAction.CREATE, LogSubject.EVENT_BINDING, botUrl),
        async (req, res): Promise<void> => {
            try {
                // @ts-ignore - Keycloak adds user info to request
                const userId = req.kauth?.grant?.access_token?.content?.sub;
                const { type, workspace_id } = req.body;

                // Check if user has see_logs permission in this workspace
                const roleBindings = await RoleBindingService.findByUserAndWorkspace(userId, workspace_id);
                const canSeeLogs = roleBindings.some(rb => rb.role.see_logs);

                if (!canSeeLogs) {
                    res.status(403).json({ error: 'Access denied: Insufficient permissions to view logs' });
                    return;
                }
                
                const eventBinding = await EventBindingService.create({
                    user_id: userId,
                    type,
                    workspace_id
                });
                res.status(201).json(eventBinding);
            } catch (error) {
                console.error('Failed to create event binding:', error);
                res.status(500).json({ error: 'Failed to create event binding' });
            }
        }
    );

    // Delete user's event binding
    router.delete('/:id',
        keycloak.protect(),
        logAction(LogAction.DELETE, LogSubject.EVENT_BINDING, botUrl),
        async (req, res): Promise<void> => {
            try {
                // @ts-ignore - Keycloak adds user info to request
                const userId = req.kauth?.grant?.access_token?.content?.sub;
                
                const existing = await EventBindingService.findById(req.params.id);
                if (!existing) {
                    res.status(404).json({ error: 'Event binding not found' });
                    return;
                }

                if (existing.user_id !== userId) {
                    res.status(403).json({ error: 'Access denied' });
                    return;
                }

                await EventBindingService.delete(req.params.id);
                res.status(204).send();
            } catch (error) {
                console.error('Failed to delete event binding:', error);
                res.status(500).json({ error: 'Failed to delete event binding' });
            }
        }
    );

    router.get('/bindings',
        keycloak.protect(),
        logAction(LogAction.READ, LogSubject.EVENT_BINDING, botUrl),
        async (req, res): Promise<void> => {
            try {
                // @ts-ignore - Keycloak adds user info to request
                const userId = req.kauth?.grant?.access_token?.content?.sub;
                const { workspace_id } = req.query;

                if (!workspace_id) {
                    res.status(400).json({ error: 'Workspace ID is required' });
                    return;
                }

                const eventBindings = await EventBindingService.findAll(userId);
                const filteredBindings = eventBindings.filter(binding => binding.workspace_id === workspace_id);

                res.json(filteredBindings);
            } catch (error) {
                console.error('Failed to retrieve event bindings:', error);
                res.status(500).json({ error: 'Failed to retrieve event bindings' });
            }
        }
    );

    return router;
} 