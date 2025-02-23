import { Request, Response, NextFunction } from 'express';
import { LogService } from './log.service';
import { LogAction, ActionLog, LogSubject } from './types';
import { WorkspaceService } from '../workspaces/workspace.service';
import { EventBindingService } from '../event-bindings/event-binding.service';

export const logAction = (action: LogAction, subject: LogSubject, workspaceId?: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // @ts-ignore - Keycloak adds user info to request
            const userId = req.kauth?.grant?.access_token?.content?.sub;
            if (!userId) {
                throw new Error('User ID is required for logging actions');
            }

            let subject_name: string | undefined;
            if (workspaceId) {
                const workspace = await WorkspaceService.findById(workspaceId);
                subject_name = workspace?.name;
            }
            
            const log: ActionLog = {
                user_id: userId,
                action,
                subject,
                timestamp: new Date(),
                workspace_id: workspaceId,
                subject_name
            };

            await LogService.createLog(log);

            // Check event bindings and send notifications
            const eventBindings = await EventBindingService.findAll(userId);
            const matchingBindings = eventBindings.filter(binding => binding.type === action);

            for (const binding of matchingBindings) {
                // TODO: Send notification to Telegram bot
                console.log(`TODO: Send notification to Telegram for user ${userId} about action ${action}`);
            }

            next();
        } catch (error) {
            console.error('Logging failed:', error);
            next();
        }
    };
}; 