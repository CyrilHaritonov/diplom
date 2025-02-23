import { AppDataSource } from '../../config/database';
import { LogEntity } from './log.entity';
import { ActionLog } from './types';
import { createWriteStream } from 'fs';
import path from 'path';
import fs from 'fs';
import { WorkspaceUserService } from '../workspace-users/workspace-user.service';
import { RoleBindingService } from '../role-bindings/role-binding.service';
import { In, IsNull } from 'typeorm';

export class LogService {
    private static getRepository() {
        return AppDataSource.getRepository(LogEntity);
    }

    static async createLog(log: ActionLog): Promise<void> {
        const repository = this.getRepository();
        await repository.save(log);
    }

    static async getLogs(userId: string): Promise<LogEntity[]> {
        const repository = this.getRepository();

        // Get all workspaces where user is a member
        const workspaceUsers = await WorkspaceUserService.findAll(userId);
        const workspaceIds = workspaceUsers.map(wu => wu.workspace_id);

        // Get user's roles in these workspaces
        const roleBindings = await Promise.all(
            workspaceIds.map(workspaceId => 
                RoleBindingService.findByUserAndWorkspace(userId, workspaceId)
            )
        );

        // Filter workspaces where user has see_logs permission
        const authorizedWorkspaceIds = roleBindings
            .flat()
            .filter(rb => rb?.role.see_logs)
            .map(rb => rb.role.for_workspace);

        // Get logs only from authorized workspaces
        if (authorizedWorkspaceIds.length === 0) {
            return [];
        }

        return repository.find({
            where: [
                { workspace_id: In(authorizedWorkspaceIds) },
                { workspace_id: IsNull() } // System logs without workspace
            ],
            relations: ['workspace'],
            order: {
                timestamp: 'DESC'
            }
        });
    }

    static async exportLogsToFile(userId: string): Promise<string> {
        const logs = await this.getLogs(userId);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `logs_${timestamp}.txt`;
        const filepath = path.join(process.cwd(), 'exports', filename);

        // Ensure exports directory exists
        const dir = path.dirname(filepath);
        await fs.promises.mkdir(dir, { recursive: true });

        const writeStream = createWriteStream(filepath);

        for (const log of logs) {
            const logEntry = `[${log.timestamp.toISOString()}] User: ${log.user_id} | Action: ${log.action} | Subject: ${log.subject}\n`;
            writeStream.write(logEntry);
        }

        await new Promise(resolve => writeStream.end(resolve));
        return filepath;
    }

    static async getWorkspaceLogs(workspaceId: string): Promise<LogEntity[]> {
        const repository = this.getRepository();
        
        return repository.find({
            where: [
                { workspace_id: workspaceId }
            ],
            relations: ['workspace'],
            order: {
                timestamp: 'DESC'
            }
        });
    }
} 