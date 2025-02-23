import express from 'express';
import { EventBindingService } from './event-binding.service';
import { logAction } from '../logging/logging.middleware';
import { LogAction, LogSubject } from '../logging/types';

export function createEventBindingRouter(keycloak: any) {
    const router = express.Router();

    // Create event binding
    router.post('/',
        keycloak.protect(),
        logAction(LogAction.CREATE, LogSubject.EVENT_BINDING),
        async (req, res): Promise<void> => {
            try {
                // @ts-ignore - Keycloak adds user info to request
                const userId = req.kauth?.grant?.access_token?.content?.sub;
                const { type } = req.body;
                
                const eventBinding = await EventBindingService.create({
                    user_id: userId,
                    type
                });
                res.status(201).json(eventBinding);
            } catch (error) {
                console.error('Failed to create event binding:', error);
                res.status(500).json({ error: 'Failed to create event binding' });
            }
        }
    );

    // Get user's event bindings
    router.get('/',
        keycloak.protect(),
        logAction(LogAction.READ, LogSubject.EVENT_BINDING),
        async (req, res): Promise<void> => {
            try {
                // @ts-ignore - Keycloak adds user info to request
                const userId = req.kauth?.grant?.access_token?.content?.sub;
                const eventBindings = await EventBindingService.findAll(userId);
                res.json(eventBindings);
            } catch (error) {
                console.error('Failed to fetch event bindings:', error);
                res.status(500).json({ error: 'Failed to fetch event bindings' });
            }
        }
    );

    // Get user's event binding by ID
    router.get('/:id',
        keycloak.protect(),
        logAction(LogAction.READ, LogSubject.EVENT_BINDING),
        async (req, res): Promise<void> => {
            try {
                // @ts-ignore - Keycloak adds user info to request
                const userId = req.kauth?.grant?.access_token?.content?.sub;
                const eventBinding = await EventBindingService.findById(req.params.id);
                
                if (!eventBinding) {
                    res.status(404).json({ error: 'Event binding not found' });
                    return;
                }

                if (eventBinding.user_id !== userId) {
                    res.status(403).json({ error: 'Access denied' });
                    return;
                }

                res.json(eventBinding);
            } catch (error) {
                console.error('Failed to fetch event binding:', error);
                res.status(500).json({ error: 'Failed to fetch event binding' });
            }
        }
    );

    // Update user's event binding
    router.put('/:id',
        keycloak.protect(),
        logAction(LogAction.UPDATE, LogSubject.EVENT_BINDING),
        async (req, res): Promise<void> => {
            try {
                // @ts-ignore - Keycloak adds user info to request
                const userId = req.kauth?.grant?.access_token?.content?.sub;
                const { type } = req.body;

                const existing = await EventBindingService.findById(req.params.id);
                if (!existing) {
                    res.status(404).json({ error: 'Event binding not found' });
                    return;
                }

                if (existing.user_id !== userId) {
                    res.status(403).json({ error: 'Access denied' });
                    return;
                }

                const eventBinding = await EventBindingService.update(req.params.id, type);
                res.json(eventBinding);
            } catch (error) {
                console.error('Failed to update event binding:', error);
                res.status(500).json({ error: 'Failed to update event binding' });
            }
        }
    );

    // Delete user's event binding
    router.delete('/:id',
        keycloak.protect(),
        logAction(LogAction.DELETE, LogSubject.EVENT_BINDING),
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

    return router;
} 