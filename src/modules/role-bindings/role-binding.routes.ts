import express from 'express';
import { RoleBindingService } from './role-binding.service';
import { logAction } from '../logging/logging.middleware';
import { LogAction, LogSubject } from '../logging/types';

export function createRoleBindingRouter(keycloak: any) {
    const router = express.Router();

    // Create role binding
    router.post('/',
        keycloak.protect('admin'),
        logAction(LogAction.CREATE, LogSubject.ROLE_BINDING),
        async (req, res) => {
            try {
                const { user_id, role_id } = req.body;
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

    // Get all role bindings (optionally filtered by user)
    router.get('/',
        keycloak.protect(),
        logAction(LogAction.READ, LogSubject.ROLE_BINDING),
        async (req, res) => {
            try {
                const { user_id } = req.query;
                const roleBindings = await RoleBindingService.findAll(user_id as string);
                res.json(roleBindings);
            } catch (error) {
                console.error('Failed to fetch role bindings:', error);
                res.status(500).json({ error: 'Failed to fetch role bindings' });
            }
        }
    );

    // Get role binding by ID
    router.get('/:id',
        keycloak.protect(),
        logAction(LogAction.READ, LogSubject.ROLE_BINDING),
        async (req, res): Promise<void> =>  {
            try {
                const roleBinding = await RoleBindingService.findById(req.params.id);
                if (!roleBinding) {
                    res.status(404).json({ error: 'Role binding not found' });
                }
                res.json(roleBinding);
            } catch (error) {
                console.error('Failed to fetch role binding:', error);
                res.status(500).json({ error: 'Failed to fetch role binding' });
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