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
        const workspaceUsers = await WorkspaceUserService.findByUserId(userId);
        const workspaceIds = workspaceUsers.map(wu => wu.workspace_id);
        console.log(workspaceUsers, workspaceIds)
        // Get user's roles in these workspaces
        const roleBindings = await Promise.all(
            workspaceIds.map(workspaceId => 
                RoleBindingService.findByUserAndWorkspace(userId, workspaceId)
            )
        );
        console.log(roleBindings)
        // Filter workspaces where user has see_logs permission
        const authorizedWorkspaceIds = roleBindings
            .flat()
            .filter(rb => rb?.role.see_logs)
            .map(rb => rb.role.for_workspace);
        console.log(authorizedWorkspaceIds)
        // Get logs only from authorized workspaces
        if (authorizedWorkspaceIds.length === 0) {
            return [];
        }

        return repository.find({
            where: [
                { workspace_id: In(authorizedWorkspaceIds) }
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
        const filename = `logs_${timestamp}.csv`;
        const filepath = path.join(process.cwd(), 'exports', filename);

        // Ensure exports directory exists
        const dir = path.dirname(filepath);
        await fs.promises.mkdir(dir, { recursive: true });

        const writeStream = createWriteStream(filepath);
        // Write CSV header
        writeStream.write('date,time,user_id,action,subject\n');

        for (const log of logs) {
            const humanReadableDate = new Date(log.timestamp).toLocaleString('en-GB', { hour12: false }); // Convert to human-readable format in 24-hour format
            const logEntry = `${humanReadableDate},${log.user_id},${log.action},${log.subject}\n`;
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