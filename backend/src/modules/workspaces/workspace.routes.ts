import express from 'express';
import { WorkspaceService } from './workspace.service';
import { logAction } from '../logging/logging.middleware';
import { LogAction, LogSubject } from '../logging/types';
import { RoleBindingService } from '../role-bindings/role-binding.service';

export function createWorkspaceRouter(keycloak: any, botUrl: string) {
    const router = express.Router();

    // Create workspace
    router.post('/',
        keycloak.protect(),
        async (req, res) => {
            try {
                const { name } = req.body;
                // @ts-ignore - Keycloak adds user info to request
                const userId = req.kauth?.grant?.access_token?.content?.sub;
                
                const workspace = await WorkspaceService.create(name, userId);
                
                // Log the action after workspace is created
                await logAction(
                    LogAction.CREATE, 
                    LogSubject.WORKSPACE, 
                    botUrl,
                    workspace.id
                )(req, res, () => {});
                
                res.status(201).json(workspace);
            } catch (error) {
                console.error('Failed to create workspace:', error);
                res.status(500).json({ error: 'Failed to create workspace' });
            }
        }
    );

    // Get all workspaces
    router.get('/',
        keycloak.protect(),
        logAction(LogAction.READ, LogSubject.WORKSPACE, botUrl),
        async (req, res) => {
            try {
                // @ts-ignore - Keycloak adds user info to request
                const userId = req.kauth?.grant?.access_token?.content?.sub;
                const workspaces = await WorkspaceService.findAll(userId);
                res.json(workspaces);
            } catch (error) {
                console.error('Failed to fetch workspaces:', error);
                res.status(500).json({ error: 'Failed to fetch workspaces' });
            }
        }
    );

    // Get workspace by ID
    router.get('/:id',
        keycloak.protect(),
        async (req, res): Promise<void> => {
            try {
                const workspace = await WorkspaceService.findById(req.params.id);
                if (!workspace) {
                    res.status(404).json({ error: 'Workspace not found' });
                    return;
                }
                await logAction(LogAction.READ, LogSubject.WORKSPACE, botUrl, workspace.id)(req, res, () => {});
                res.json(workspace);
            } catch (error) {
                console.error('Failed to fetch workspace:', error);
                res.status(500).json({ error: 'Failed to fetch workspace' });
            }
        }
    );

    // Update workspace
    router.put('/:id',
        keycloak.protect(),
        async (req, res) => {
            try {
                // @ts-ignore - Keycloak adds user info to request
                const userId = req.kauth?.grant?.access_token?.content?.sub;
                const { name } = req.body;

                // Get existing workspace
                const existingWorkspace = await WorkspaceService.findById(req.params.id);
                if (!existingWorkspace) {
                    res.status(404).json({ error: 'Workspace not found' });
                    return;
                }

                // Check if user has admin rights in this workspace
                const userRoles = await RoleBindingService.findByUserAndWorkspace(userId, existingWorkspace.id);
                const isAdmin = userRoles.some(rb => rb.role.admin_rights);

                if (!isAdmin) {
                    res.status(403).json({ error: 'Access denied: Insufficient permissions to update workspace' });
                    return;
                }

                const workspace = await WorkspaceService.update(req.params.id, { name: name as string });
                if (workspace) {
                    await logAction(LogAction.UPDATE, LogSubject.WORKSPACE, botUrl, workspace.id)(req, res, () => {});
                }
                res.json(workspace);
            } catch (error) {
                console.error('Failed to update workspace:', error);
                res.status(500).json({ error: 'Failed to update workspace' });
            }
        }
    );

    // Delete workspace
    router.delete('/:id',
        keycloak.protect(),
        async (req, res) => {
            try {
                // @ts-ignore - Keycloak adds user info to request
                const userId = req.kauth?.grant?.access_token?.content?.sub;

                // Get workspace to check permissions
                const workspace = await WorkspaceService.findById(req.params.id);
                if (!workspace) {
                    res.status(404).json({ error: 'Workspace not found' });
                    return;
                }

                // Check if user has admin rights in this workspace
                const userRoles = await RoleBindingService.findByUserAndWorkspace(userId, workspace.id);
                const isAdmin = userRoles.some(rb => rb.role.admin_rights);

                if (!isAdmin) {
                    res.status(403).json({ error: 'Access denied: Insufficient permissions to delete workspace' });
                    return;
                }

                await WorkspaceService.delete(req.params.id);
                await logAction(LogAction.DELETE, LogSubject.WORKSPACE, botUrl, req.params.id)(req, res, () => {});
                res.status(204).send();
            } catch (error) {
                console.error('Failed to delete workspace:', error);
                res.status(500).json({ error: 'Failed to delete workspace' });
            }
        }
    );

    return router;
} 