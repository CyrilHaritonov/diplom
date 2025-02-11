import express from 'express';
import { RoleBindingService } from './role-binding.service';
import { logAction } from '../logging/logging.middleware';
import { LogAction, LogSubject } from '../logging/types';
import { RoleService } from '../roles/role.service';

export function createRoleBindingRouter(keycloak: any) {
    const router = express.Router();

    // Create role binding
    router.post('/',
        keycloak.protect(),
        logAction(LogAction.CREATE, LogSubject.ROLE_BINDING),
        async (req, res) => {
            try {
                const { user_id, role_id } = req.body;
                // @ts-ignore - Keycloak adds user info to request
                const userId = req.kauth?.grant?.access_token?.content?.sub;

                // Get the role to find its workspace
                const role = await RoleService.findById(role_id);
                if (!role) {
                    res.status(404).json({ error: 'Role not found' });
                    return;
                }

                // Check if user has give_roles permission in this workspace
                const userRoles = await RoleBindingService.findByUserAndWorkspace(userId, role.for_workspace);
                const canGiveRoles = userRoles.some(rb => rb.role.give_roles);

                if (!canGiveRoles) {
                    res.status(403).json({ error: 'Access denied: Insufficient permissions to assign roles' });
                    return;
                }

                const roleBinding = await RoleBindingService.create({
                    user_id,
                    role_id
                });
                res.status(201).json(roleBinding);
            } catch (error) {
                console.error('Failed to create role binding:', error);
                res.status(500).json({ error: 'Failed to create role binding' });
            }
        }
    );

    // Get user's role bindings
    router.get('/',
        keycloak.protect(),
        logAction(LogAction.READ, LogSubject.ROLE_BINDING),
        async (req, res) => {
            try {
                // @ts-ignore - Keycloak adds user info to request
                const userId = req.kauth?.grant?.access_token?.content?.sub;
                const roleBindings = await RoleBindingService.findAll(userId);
                res.json(roleBindings);
            } catch (error) {
                console.error('Failed to fetch role bindings:', error);
                res.status(500).json({ error: 'Failed to fetch role bindings' });
            }
        }
    );

    // Get role bindings by user ID
    router.get('/:userId',
        keycloak.protect(),
        logAction(LogAction.READ, LogSubject.ROLE_BINDING),
        async (req, res): Promise<void> => {
            try {
                // @ts-ignore - Keycloak adds user info to request
                const requestingUserId = req.kauth?.grant?.access_token?.content?.sub;
                const targetUserId = req.params.userId;
                
                // Get all role bindings for the target user
                const roleBindings = await RoleBindingService.findAll(targetUserId);
                
                // If user is requesting their own bindings, return them
                if (requestingUserId === targetUserId) {
                    res.json(roleBindings);
                    return;
                }

                // For each workspace, check if requesting user has give_roles permission
                const authorizedBindings = [];
                for (const binding of roleBindings) {
                    const userRoles = await RoleBindingService.findByUserAndWorkspace(
                        requestingUserId, 
                        binding.role.for_workspace
                    );
                    const canGiveRoles = userRoles.some(rb => rb.role.give_roles);
                    
                    if (canGiveRoles) {
                        authorizedBindings.push(binding);
                    }
                }

                res.json(authorizedBindings);
            } catch (error) {
                console.error('Failed to fetch role bindings:', error);
                res.status(500).json({ error: 'Failed to fetch role bindings' });
            }
        }
    );

    // Get user roles in workspace
    router.get('/user/:userId/workspace/:workspaceId',
        keycloak.protect(),
        logAction(LogAction.READ, LogSubject.USER_WORKSPACE_ROLES),
        async (req, res) => {
            try {
                const { userId, workspaceId } = req.params;
                // @ts-ignore - Keycloak adds user info to request
                const requestingUserId = req.kauth?.grant?.access_token?.content?.sub;

                // Check if requesting user has read permission in this workspace
                const userRoles = await RoleBindingService.findByUserAndWorkspace(requestingUserId, workspaceId);
                const canRead = userRoles.some(rb => rb.role.read);

                if (!canRead && requestingUserId !== userId) {
                    res.status(403).json({ error: 'Access denied: Insufficient permissions to view roles' });
                    return;
                }

                const roleBindings = await RoleBindingService.findByUserAndWorkspace(userId, workspaceId);
                res.json(roleBindings);
            } catch (error) {
                console.error('Failed to fetch user workspace roles:', error);
                res.status(500).json({ error: 'Failed to fetch user workspace roles' });
            }
        }
    );

    // Delete role binding
    router.delete('/:id',
        keycloak.protect('admin'),
        logAction(LogAction.DELETE, LogSubject.ROLE_BINDING),
        async (req, res) => {
            try {
                await RoleBindingService.delete(req.params.id);
                res.status(204).send();
            } catch (error) {
                console.error('Failed to delete role binding:', error);
                res.status(500).json({ error: 'Failed to delete role binding' });
            }
        }
    );

    return router;
} 