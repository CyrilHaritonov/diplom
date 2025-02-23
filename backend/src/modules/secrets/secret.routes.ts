import express from 'express';
import { SecretService } from './secret.service';
import { logAction } from '../logging/logging.middleware';
import { LogAction, LogSubject } from '../logging/types';
import { RoleBindingService } from '../role-bindings/role-binding.service';

export function createSecretRouter(keycloak: any) {
    const router = express.Router();

    // Create secret
    router.post('/',
        keycloak.protect(),
        async (req, res) => {
            try {
                const { workspace_id, name, value, expires_at } = req.body;
                // @ts-ignore - Keycloak adds user info to request
                const userId = req.kauth?.grant?.access_token?.content?.sub;

                // Check if user has create permission in this workspace
                const userRoles = await RoleBindingService.findByUserAndWorkspace(userId, workspace_id);
                const canCreate = userRoles.some(rb => rb.role.create);

                if (!canCreate) {
                    res.status(403).json({ error: 'Access denied: Insufficient permissions to create secrets' });
                    return;
                }

                const secret = await SecretService.create({
                    name,
                    value,
                    workspace_id,
                    created_by: userId,
                    expires_at: expires_at ? new Date(expires_at) : undefined
                });
                await logAction(LogAction.CREATE, LogSubject.SECRET, workspace_id)(req, res, () => {});
                res.status(201).json(secret);
            } catch (error) {
                console.error('Failed to create secret:', error);
                res.status(500).json({ error: 'Failed to create secret' });
            }
        }
    );

    // Get all secrets for workspace
    router.get('/workspace/:workspaceId',
        keycloak.protect(),
        async (req, res): Promise<void> => {
            try {
                // @ts-ignore - Keycloak adds user info to request
                const userId = req.kauth?.grant?.access_token?.content?.sub;
                const workspaceId = req.params.workspaceId;

                // Check if user has read permission in this workspace
                const userRoles = await RoleBindingService.findByUserAndWorkspace(userId, workspaceId);
                const canRead = userRoles.some(rb => rb.role.read);

                if (!canRead) {
                    res.status(403).json({ error: 'Access denied: Insufficient permissions to view secrets' });
                    return;
                }

                const secrets = await SecretService.findAll(workspaceId);
                await logAction(LogAction.READ, LogSubject.SECRET, workspaceId)(req, res, () => {});
                res.json(secrets);
            } catch (error) {
                console.error('Failed to fetch secrets:', error);
                res.status(500).json({ error: 'Failed to fetch secrets' });
            }
        }
    );

    // Get secret by ID
    router.get('/:id',
        keycloak.protect(),
        async (req, res): Promise<void> => {
            try {
                // @ts-ignore - Keycloak adds user info to request
                const userId = req.kauth?.grant?.access_token?.content?.sub;
                
                const secret = await SecretService.findById(req.params.id);
                if (!secret) {
                    res.status(404).json({ error: 'Secret not found' });
                    return;
                }

                // Check if user has read permission in this workspace
                const userRoles = await RoleBindingService.findByUserAndWorkspace(userId, secret.workspace_id);
                const canRead = userRoles.some(rb => rb.role.read);

                if (!canRead) {
                    res.status(403).json({ error: 'Access denied: Insufficient permissions to view this secret' });
                    return;
                }

                await logAction(LogAction.READ, LogSubject.SECRET, secret.workspace_id)(req, res, () => {});
                res.json(secret);
            } catch (error) {
                console.error('Failed to fetch secret:', error);
                res.status(500).json({ error: 'Failed to fetch secret' });
            }
        }
    );

    // Update secret
    router.put('/:id',
        keycloak.protect(),
        async (req, res): Promise<void> => {
            try {
                // @ts-ignore - Keycloak adds user info to request
                const userId = req.kauth?.grant?.access_token?.content?.sub;
                const { name, value, expires_at } = req.body;

                // Get existing secret to check workspace
                const existingSecret = await SecretService.findById(req.params.id);
                if (!existingSecret) {
                    res.status(404).json({ error: 'Secret not found' });
                    return;
                }

                // Check if user has update permission in this workspace
                const userRoles = await RoleBindingService.findByUserAndWorkspace(userId, existingSecret.workspace_id);
                const canUpdate = userRoles.some(rb => rb.role.update);

                if (!canUpdate) {
                    res.status(403).json({ error: 'Access denied: Insufficient permissions to update this secret' });
                    return;
                }

                const secret = await SecretService.update(req.params.id, {
                    name,
                    value,
                    expires_at: expires_at ? new Date(expires_at) : null
                });
                if (secret) {
                    await logAction(LogAction.UPDATE, LogSubject.SECRET, existingSecret.workspace_id)(req, res, () => {});
                }
                res.json(secret);
            } catch (error) {
                console.error('Failed to update secret:', error);
                res.status(500).json({ error: 'Failed to update secret' });
            }
        }
    );

    // Delete secret
    router.delete('/:id',
        keycloak.protect(),
        async (req, res): Promise<void> => {
            try {
                // @ts-ignore - Keycloak adds user info to request
                const userId = req.kauth?.grant?.access_token?.content?.sub;

                // Get secret to check workspace
                const secret = await SecretService.findById(req.params.id);
                if (!secret) {
                    res.status(404).json({ error: 'Secret not found' });
                    return;
                }

                // Check if user has delete permission in this workspace
                const userRoles = await RoleBindingService.findByUserAndWorkspace(userId, secret.workspace_id);
                const canDelete = userRoles.some(rb => rb.role.deletable);

                if (!canDelete) {
                    res.status(403).json({ error: 'Access denied: Insufficient permissions to delete this secret' });
                    return;
                }

                await SecretService.delete(req.params.id);
                await logAction(LogAction.DELETE, LogSubject.SECRET, secret.workspace_id)(req, res, () => {});
                res.status(204).send();
            } catch (error) {
                console.error('Failed to delete secret:', error);
                res.status(500).json({ error: 'Failed to delete secret' });
            }
        }
    );

    return router;
} 