import express from 'express';
import { ChatBindingService } from './chat-binding.service';
import { checkCustomHeader } from './chat-binding.middleware';
import { logAction } from '../logging/logging.middleware';
import { LogAction, LogSubject } from '../logging/types';

export function createChatBindingRouter(keycloak: any, allowed_fqdn: string, botUrl: string) {
    const router = express.Router();

    // Create a new chat binding
    router.post('/', keycloak.protect(), logAction(LogAction.CREATE, LogSubject.CHAT_BINDING, botUrl), async (req, res) => {
        try {
            // @ts-ignore - Keycloak adds user info to request
            const userId = req.kauth?.grant?.access_token?.content?.sub;
            const chatBinding = await ChatBindingService.create({
                user_id: userId,
                chat_id: '', // empty by default
                code: (Math.random().toString(36) + Math.random().toString(36) + Math.random().toString(36)).substring(2, 34) // concatenated random code
            });
            res.status(201).json(chatBinding);
        } catch (error) {
            res.status(500).json({ message: 'Failed to create chat binding', error });
        }
    });

    // Get the chat binding for the authenticated user
    router.get('/', keycloak.protect(), logAction(LogAction.READ, LogSubject.CHAT_BINDING, botUrl), async (req, res) => {
        try {
            // @ts-ignore - Keycloak adds user info to request
            const userId = req.kauth?.grant?.access_token?.content?.sub;
            const chatBinding = await ChatBindingService.findById(userId);
            if (chatBinding) {
                res.status(200).json(chatBinding);
            } else {
                res.status(404).json({ message: 'Chat binding not found' });
            }
        } catch (error) {
            res.status(500).json({ message: 'Failed to fetch chat binding', error });
        }
    });

    // Edit the chat binding
    router.put('/', checkCustomHeader(allowed_fqdn), logAction(LogAction.UPDATE, LogSubject.CHAT_BINDING, botUrl), async (req, res) => {
        const { chat_id, code } = req.body;
        try {
            const chatBinding = await ChatBindingService.update(code, chat_id);
            res.status(200).json(chatBinding);
        } catch (error) {
            res.status(500).json({ message: 'Failed to update chat binding', error });
        }
    });

    // Delete a chat binding
    router.delete('/', keycloak.protect(), logAction(LogAction.DELETE, LogSubject.CHAT_BINDING, botUrl), async (req, res) => {
        try {
            // @ts-ignore - Keycloak adds user info to request
            const userId = req.kauth?.grant?.access_token?.content?.sub;
            await ChatBindingService.delete(userId);
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ message: 'Failed to delete chat binding', error });
        }
    });

    router.get('/check-fqdn', keycloak.protect(), async (req, res) => {
        try {
            if (!allowed_fqdn) {
                res.status(500).json({ message: 'ALLOWED_FQDN is not set' });
                return;
            }

            res.status(200).json({ message: 'ALLOWED_FQDN is set', allowed_fqdn });
        } catch (error) {
            res.status(500).json({ message: 'Failed to check ALLOWED_FQDN', error });
        }
    });

    
    return router;
} 