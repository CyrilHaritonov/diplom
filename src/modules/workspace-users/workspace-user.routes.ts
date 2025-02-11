import express from 'express';
import { WorkspaceUserService } from './workspace-user.service';
import { logAction } from '../logging/logging.middleware';
import { LogAction, LogSubject } from '../logging/types';

export function createWorkspaceUserRouter(keycloak: any) {
    const router = express.Router();

    // Add user to workspace
    router.post('/',
        keycloak.protect(),
        logAction(LogAction.CREATE, LogSubject.WORKSPACE_USER),
        async (req, res) => {
            try {
                const { workspace_id, user_id } = req.body;
                const workspaceUser = await WorkspaceUserService.create({
                    workspace_id,
                    user_id
                });
                res.status(201).json(workspaceUser);
            } catch (error) {
                console.error('Failed to add user to workspace:', error);
                res.status(500).json({ error: 'Failed to add user to workspace' });
            }
        }
    );

    // Get all workspace users (optionally filtered by workspace)
    router.get('/',
        keycloak.protect(),
        logAction(LogAction.READ, LogSubject.WORKSPACE_USER),
        async (req, res) => {
            try {
                const { workspace_id } = req.query;
                const workspaceUsers = await WorkspaceUserService.findAll(workspace_id as string);
                res.json(workspaceUsers);
            } catch (error) {
                console.error('Failed to fetch workspace users:', error);
                res.status(500).json({ error: 'Failed to fetch workspace users' });
            }
        }
    );

    // Get workspace user by ID
    router.get('/:id',
        keycloak.protect(),
        logAction(LogAction.READ, LogSubject.WORKSPACE_USER),
        async (req, res): Promise<void> => {
            try {
                const workspaceUser = await WorkspaceUserService.findById(req.params.id);
                if (!workspaceUser) {
                    res.status(404).json({ error: 'Workspace user not found' });
                }
                res.json(workspaceUser);
            } catch (error) {
                console.error('Failed to fetch workspace user:', error);
                res.status(500).json({ error: 'Failed to fetch workspace user' });
            }
        }
    );

    // Check if user is in workspace
    router.get('/check/:workspaceId/:userId',
        keycloak.protect(),
        logAction(LogAction.READ, LogSubject.WORKSPACE_USER),
        async (req, res) => {
            try {
                const { workspaceId, userId } = req.params;
                const workspaceUser = await WorkspaceUserService.findByUserAndWorkspace(userId, workspaceId);
                res.json({ isMember: !!workspaceUser });
            } catch (error) {
                console.error('Failed to check workspace membership:', error);
                res.status(500).json({ error: 'Failed to check workspace membership' });
            }
        }
    );

    // Remove user from workspace
    router.delete('/:id',
        keycloak.protect(),
        logAction(LogAction.DELETE, LogSubject.WORKSPACE_USER),
        async (req, res) => {
            try {
                await WorkspaceUserService.delete(req.params.id);
                res.status(204).send();
            } catch (error) {
                console.error('Failed to remove user from workspace:', error);
                res.status(500).json({ error: 'Failed to remove user from workspace' });
            }
        }
    );

    return router;
} 