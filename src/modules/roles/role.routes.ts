import express from 'express';
import { RoleService } from './role.service';
import { logAction } from '../logging/logging.middleware';
import { LogAction, LogSubject } from '../logging/types';

export function createRoleRouter(keycloak: any) {
    const router = express.Router();

    // Create role
    router.post('/',
        keycloak.protect(),
        logAction(LogAction.CREATE, LogSubject.ROLE),
        async (req, res) => {
            try {
                const { name, for_workspace, create, read, update, can_delete, see_logs } = req.body;
                const role = await RoleService.create({
                    name,
                    for_workspace,
                    create,
                    read,
                    update,
                    delete: can_delete,
                    see_logs
                });
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
        logAction(LogAction.READ, LogSubject.ROLE),
        async (req, res) => {
            try {
                const { workspace_id } = req.query;
                const roles = await RoleService.findAll(workspace_id as string);
                res.json(roles);
            } catch (error) {
                console.error('Failed to fetch roles:', error);
                res.status(500).json({ error: 'Failed to fetch roles' });
            }
        }
    );

    // Get role by ID
    router.get('/:id',
        keycloak.protect(),
        logAction(LogAction.READ, LogSubject.ROLE),
        async (req, res): Promise<void> => {
            try {
                const role = await RoleService.findById(req.params.id);
                if (!role) {
                    res.status(404).json({ error: 'Role not found' });
                }
                res.json(role);
            } catch (error) {
                console.error('Failed to fetch role:', error);
                res.status(500).json({ error: 'Failed to fetch role' });
            }
        }
    );

    // Update role
    router.put('/:id',
        keycloak.protect('admin'),
        logAction(LogAction.UPDATE, LogSubject.ROLE),
        async (req, res): Promise<void> => {
            try {
                const { name, rights } = req.body;
                const role = await RoleService.update(req.params.id, {
                    name,
                    rights
                });
                if (!role) {
                    res.status(404).json({ error: 'Role not found' });
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
        keycloak.protect('admin'),
        logAction(LogAction.DELETE, LogSubject.ROLE),
        async (req, res) => {
            try {
                await RoleService.delete(req.params.id);
                res.status(204).send();
            } catch (error) {
                console.error('Failed to delete role:', error);
                res.status(500).json({ error: 'Failed to delete role' });
            }
        }
    );

    return router;
} 