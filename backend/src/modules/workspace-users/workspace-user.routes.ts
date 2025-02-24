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
        async (req, res) => {
            try {
                const { workspace_id, user_id } = req.body;
                // @ts-ignore - Keycloak adds user info to request
                const userId = req.kauth?.grant?.access_token?.content?.sub;

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
                await logAction(LogAction.CREATE, LogSubject.WORKSPACE_USER, workspace_id)(req, res, () => {});
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
        async (req, res) => {
            try {
                const { workspace_id } = req.query;
                // @ts-ignore - Keycloak adds user info to request
                const userId = req.kauth?.grant?.access_token?.content?.sub;

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
                
                // Add roles to each workspace user
                const usersWithRoles = await Promise.all(workspaceUsers.map(async (user) => {
                    const roles = await RoleBindingService.findByUserAndWorkspace(user.user_id, workspace_id as string);
                    return {
                        ...user,
                        roles: roles.map(roleBinding => roleBinding.role.name) // Assuming role has a 'name' property
                    };
                }));

                await logAction(LogAction.READ, LogSubject.WORKSPACE_USER, workspace_id as string)(req, res, () => {});
                res.json(usersWithRoles);
            } catch (error) {
                console.error('Failed to fetch workspace users:', error);
                res.status(500).json({ error: 'Failed to fetch workspace users' });
            }
        }
    );

    // Get workspace user for current user
    router.get('/me/:workspaceId',
        keycloak.protect(),
        async (req, res): Promise<void> => {
            try {
                const workspaceId = req.params.workspaceId;
                // @ts-ignore - Keycloak adds user info to request
                const userId = req.kauth?.grant?.access_token?.content?.sub;

                const workspaceUser = await WorkspaceUserService.findByUserAndWorkspace(userId, workspaceId);
                if (!workspaceUser) {
                    res.status(404).json({ error: 'You are not a member of this workspace' });
                    return;
                }
                await logAction(LogAction.READ, LogSubject.WORKSPACE_USER, workspaceId)(req, res, () => {});
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
        async (req, res) => {
            try {
                const { workspaceId, userId } = req.params;
                // @ts-ignore - Keycloak adds user info to request
                const requestingUserId = req.kauth?.grant?.access_token?.content?.sub;

                // Check if requesting user has add_users permission in this workspace
                const userRoles = await RoleBindingService.findByUserAndWorkspace(requestingUserId, workspaceId);
                const canAddUsers = userRoles.some(rb => rb.role.add_users);

                if (!canAddUsers) {
                    res.status(403).json({ error: 'Access denied: Insufficient permissions to check workspace membership' });
                    return;
                }

                const workspaceUser = await WorkspaceUserService.findByUserAndWorkspace(userId, workspaceId);
                await logAction(LogAction.READ, LogSubject.WORKSPACE_USER, workspaceId)(req, res, () => {});
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
        async (req, res) => {
            try {
                const workspaceUser = await WorkspaceUserService.findById(req.params.id);
                if (!workspaceUser) {
                    res.status(404).json({ error: 'Workspace user not found' });
                    return;
                }
                // @ts-ignore - Keycloak adds user info to request
                const userId = req.kauth?.grant?.access_token?.content?.sub;

                // Check if user has add_users permission in this workspace
                const userRoles = await RoleBindingService.findByUserAndWorkspace(userId, workspaceUser.workspace_id);
                const canAddUsers = userRoles.some(rb => rb.role.add_users);

                if (!canAddUsers) {
                    res.status(403).json({ error: 'Access denied: Insufficient permissions to remove users from workspace' });
                    return;
                }

                await WorkspaceUserService.delete(req.params.id);
                await logAction(LogAction.DELETE, LogSubject.WORKSPACE_USER, workspaceUser.workspace_id)(req, res, () => {});
                res.status(204).send();
            } catch (error) {
                console.error('Failed to remove user from workspace:', error);
                res.status(500).json({ error: 'Failed to remove user from workspace' });
            }
        }
    );

    return router;
} 