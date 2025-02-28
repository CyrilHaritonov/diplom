import express from 'express';
import { RoleService } from './role.service';
import { logAction } from '../logging/logging.middleware';
import { LogAction, LogSubject } from '../logging/types';
import { RoleBindingService } from '../role-bindings/role-binding.service';

export function createRoleRouter(keycloak: any, botUrl: string) {
    const router = express.Router();

    // Create role
    router.post('/',
        keycloak.protect(),
        async (req, res) => {
            try {
                const { name, for_workspace, create, read, update, deletable, see_logs, give_roles, add_users, admin_rights } = req.body;
                // @ts-ignore - Keycloak adds user info to request
                const userId = req.kauth?.grant?.access_token?.content?.sub;

                // Check if user has give_roles permission in this workspace
                const userRoles = await RoleBindingService.findByUserAndWorkspace(userId, for_workspace);
                const canGiveRoles = userRoles.some(rb => rb.role.give_roles);

                if (!canGiveRoles) {
                    res.status(403).json({ error: 'Access denied: Insufficient permissions to create roles' });
                    return;
                }

                const role = await RoleService.create({
                    name,
                    for_workspace,
                    create,
                    read,
                    update,
                    deletable,
                    see_logs,
                    give_roles,
                    add_users,
                    admin_rights
                });
                await logAction(LogAction.CREATE, LogSubject.ROLE, botUrl, for_workspace)(req, res, () => {});
                res.status(201).json(role);
            } catch (error) {
                console.error('Failed to create role:', error);
                res.status(500).json({ error: 'Failed to create role' });
            }
        }
    );

    // Get all roles (optionally filtered by workspace)
    router.get('/',
        keycloak.protect(),
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
                const canGiveRoles = userRoles.some(rb => rb.role.give_roles);

                if (!canGiveRoles) {
                    res.status(403).json({ error: 'Access denied: Insufficient permissions to view roles' });
                    return;
                }

                const roles = await RoleService.findAll(workspace_id as string);
                await logAction(LogAction.READ, LogSubject.ROLE, botUrl, workspace_id as string)(req, res, () => {});
                res.json(roles);
            } catch (error) {
                console.error('Failed to fetch roles:', error);
                res.status(500).json({ error: 'Failed to fetch roles' });
            }
        }
    );

    // Get role by name in workspace
    router.get('/:roleName',
        keycloak.protect(),
        async (req, res): Promise<void> => {
            try {
                // @ts-ignore - Keycloak adds user info to request
                const userId = req.kauth?.grant?.access_token?.content?.sub;
                const { workspace_id } = req.query;
                const { roleName } = req.params;

                if (!workspace_id) {
                    res.status(400).json({ error: 'workspace_id is required' });
                    return;
                }

                // Check if user has read permission in this workspace
                const userRoles = await RoleBindingService.findByUserAndWorkspace(userId, workspace_id as string);
                const canGiveRoles = userRoles.some(rb => rb.role.give_roles);

                if (!canGiveRoles) {
                    res.status(403).json({ error: 'Access denied: Insufficient permissions to view roles' });
                    return;
                }

                const role = await RoleService.findByName(roleName, workspace_id as string);
                if (!role) {
                    res.status(404).json({ error: 'Role not found' });
                    return;
                }
                await logAction(LogAction.READ, LogSubject.ROLE, botUrl, workspace_id as string)(req, res, () => {});
                res.json(role);
            } catch (error) {
                console.error('Failed to fetch role:', error);
                res.status(500).json({ error: 'Failed to fetch role' });
            }
        }
    );

    // Update role
    router.put('/:id',
        keycloak.protect(),
        async (req, res): Promise<void> => {
            try {
                // @ts-ignore - Keycloak adds user info to request
                const userId = req.kauth?.grant?.access_token?.content?.sub;
                const { 
                    name, 
                    create, 
                    read, 
                    update, 
                    deletable, 
                    see_logs, 
                    give_roles,
                    add_users,
                    admin_rights 
                } = req.body;

                // Get the role to find its workspace
                const existingRole = await RoleService.findById(req.params.id);
                if (!existingRole) {
                    res.status(404).json({ error: 'Role not found' });
                    return;
                }

                // Check if user has give_roles permission in this workspace
                const userRoles = await RoleBindingService.findByUserAndWorkspace(userId, existingRole.for_workspace);
                const canGiveRoles = userRoles.some(rb => rb.role.give_roles);

                if (!canGiveRoles) {
                    res.status(403).json({ error: 'Access denied: Insufficient permissions to update roles' });
                    return;
                }

                const role = await RoleService.update(req.params.id, {
                    name,
                    create,
                    read,
                    update,
                    deletable,
                    see_logs,
                    give_roles,
                    add_users,
                    admin_rights
                });
                if (role) {
                    await logAction(LogAction.UPDATE, LogSubject.ROLE, botUrl, existingRole.for_workspace)(req, res, () => {});
                }
                res.json(role);
            } catch (error) {
                console.error('Failed to update role:', error);
                res.status(500).json({ error: 'Failed to update role' });
            }
        }
    );

    // Delete role
    router.delete('/:id',
        keycloak.protect(),
        async (req, res) => {
            try {
                // @ts-ignore - Keycloak adds user info to request
                const userId = req.kauth?.grant?.access_token?.content?.sub;

                // Get the role to find its workspace
                const existingRole = await RoleService.findById(req.params.id);
                if (!existingRole) {
                    res.status(404).json({ error: 'Role not found' });
                    return;
                }

                // Check if user has give_roles permission in this workspace
                const userRoles = await RoleBindingService.findByUserAndWorkspace(userId, existingRole.for_workspace);
                const canGiveRoles = userRoles.some(rb => rb.role.give_roles);

                if (!canGiveRoles) {
                    res.status(403).json({ error: 'Access denied: Insufficient permissions to delete roles' });
                    return;
                }

                // Delete role and its bindings
                await RoleService.deleteWithBindings(req.params.id);
                await logAction(LogAction.DELETE, LogSubject.ROLE, botUrl, existingRole.for_workspace)(req, res, () => {});
                res.status(204).send();
            } catch (error) {
                console.error('Failed to delete role:', error);
                res.status(500).json({ error: 'Failed to delete role' });
            }
        }
    );

    return router;
} 