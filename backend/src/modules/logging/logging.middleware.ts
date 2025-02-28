import { Request, Response, NextFunction } from 'express';
import { LogService } from './log.service';
import { LogAction, ActionLog, LogSubject } from './types';
import { WorkspaceService } from '../workspaces/workspace.service';
import { EventBindingService } from '../event-bindings/event-binding.service';
import axios from "axios";
import {getUsernameByUserId} from "../auth/auth.controller"
import { ChatBindingService } from '../chat-bindings/chat-binding.service';

export async function logActionCore(
    userId: string,
    action: LogAction,
    subject: LogSubject,
    botUrl: string,
    workspaceId?: string,
  ) {
    // Fetch workspace name (if needed)
    let subject_name: string | undefined;
    if (workspaceId) {
      const workspace = await WorkspaceService.findById(workspaceId);
      subject_name = workspace?.name;
    }
  
    // Create log entry
    const log: ActionLog = {
      user_id: userId,
      action,
      subject,
      timestamp: new Date(),
      workspace_id: workspaceId ? undefined : workspaceId as string,
      subject_name,
    };
  
    await LogService.createLog(log);
  
    // Notifications (optional)
    if (botUrl) {
      const eventBindings = await EventBindingService.findAll(userId);
      const matchingBindings = eventBindings.filter(
        (binding) => binding.type === action && binding.workspace_id === workspaceId
      );
      const username = await getUsernameByUserId(userId);
      const chatBinding = await ChatBindingService.findById(userId);
      const chatId = chatBinding?.chat_id;
  
      for (const binding of matchingBindings) {
        try {
          await axios.post(`${botUrl}/send-message`, {
            username,
            workspace_name: subject_name,
            timestamp: log.timestamp,
            subject,
            action,
            chatId,
          });
        } catch (error) {
          console.log("Notification failed:", error);
        }
      }
    }
  }

export const logAction = (action: LogAction, subject: LogSubject, botUrl: string, workspaceId?: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // @ts-ignore - Keycloak user extraction
      const userId = req.kauth?.grant?.access_token?.content?.sub;
      if (!userId) throw new Error('User ID required');

      // Call core logic (enable notifications via botUrl)
      if (workspaceId) {
          await logActionCore(userId, action, subject, botUrl, workspaceId);
      } else {
          await logActionCore(userId, action, subject, botUrl);
      }
      next();
    } catch (error) {
      console.error('Logging failed:', error);
      next();
    }
  };
};