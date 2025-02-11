import express from 'express';
import { WorkspaceUserService } from './workspace-user.service';
import { logAction } from '../logging/logging.middleware';
import { LogAction, LogSubject } from '../logging/types';
import { RoleBindingService } from '../role-bindings/role-binding.service';

export function createWorkspaceUserRouter(keycloak: any) {
    const router = express.Router();

    // Add user to workspace
    router.post('/',
        keycloak.protect(),
        logAction(LogAction.CREATE, LogSubject.WORKSPACE_USER),
        async (req, res) => {
            try {
                // @ts-ignore - Keycloak adds user info to request
                const userId = req.kauth?.grant?.access_token?.content?.sub;
                const { workspace_id, user_id } = req.body;

                // Check if user has add_users permission in this workspace
                const userRoles = await RoleBindingService.findByUserAndWorkspace(userId, workspace_id);
                const canAddUsers = userRoles.some(rb => rb.role.add_users);

                if (!canAddUsers) {
                    res.status(403).json({ error: 'Access denied: Insufficient permissions to add users to workspace' });
                    return;
                }

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
                // @ts-ignore - Keycloak adds user info to request
                const userId = req.kauth?.grant?.access_token?.content?.sub;
                const { workspace_id } = req.query;

                if (!workspace_id) {
                    res.status(400).json({ error: 'workspace_id is required' });
                    return;
                }

                // Check if user has read permission in this workspace
                const userRoles = await RoleBindingService.findByUserAndWorkspace(userId, workspace_id as string);
                const canRead = userRoles.some(rb => rb.role.read);

                if (!canRead) {
                    res.status(403).json({ error: 'Access denied: Insufficient permissions to view workspace users' });
                    return;
                }

                const workspaceUsers = await WorkspaceUserService.findAll(workspace_id as string);
                res.json(workspaceUsers);
            } catch (error) {
                console.error('Failed to fetch workspace users:', error);
                res.status(500).json({ error: 'Failed to fetch workspace users' });
            }
        }
    );

    // Get workspace user for current user
    router.get('/me/:workspaceId',
        keycloak.protect(),
        logAction(LogAction.READ, LogSubject.WORKSPACE_USER),
        async (req, res): Promise<void> => {
            try {
                // @ts-ignore - Keycloak adds user info to request
                const userId = req.kauth?.grant?.access_token?.content?.sub;
                const workspaceId = req.params.workspaceId;

                const workspaceUser = await WorkspaceUserService.findByUserAndWorkspace(userId, workspaceId);
                if (!workspaceUser) {
                    res.status(404).json({ error: 'You are not a member of this workspace' });
                    return;
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
                // @ts-ignore - Keycloak adds user info to request
                const requestingUserId = req.kauth?.grant?.access_token?.content?.sub;
                const { workspaceId, userId } = req.params;

                // Check if requesting user has add_users permission in this workspace
                const userRoles = await RoleBindingService.findByUserAndWorkspace(requestingUserId, workspaceId);
                const canAddUsers = userRoles.some(rb => rb.role.add_users);

                if (!canAddUsers) {
                    res.status(403).json({ error: 'Access denied: Insufficient permissions to check workspace membership' });
                    return;
                }

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
                // @ts-ignore - Keycloak adds user info to request
                const userId = req.kauth?.grant?.access_token?.content?.sub;

                // Get workspace user to check workspace
                const workspaceUser = await WorkspaceUserService.findById(req.params.id);
                if (!workspaceUser) {
                    res.status(404).json({ error: 'Workspace user not found' });
                    return;
                }

                // Check if user has add_users permission in this workspace
                const userRoles = await RoleBindingService.findByUserAndWorkspace(userId, workspaceUser.workspace_id);
                const canAddUsers = userRoles.some(rb => rb.role.add_users);

                if (!canAddUsers) {
                    res.status(403).json({ error: 'Access denied: Insufficient permissions to remove users from workspace' });
                    return;
                }

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