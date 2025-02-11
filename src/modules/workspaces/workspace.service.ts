import { AppDataSource } from '../../config/database';
import { WorkspaceEntity } from './workspace.entity';
import { RoleService } from '../roles/role.service';
import { WorkspaceUserService } from '../workspace-users/workspace-user.service';
import { RoleBindingService } from '../role-bindings/role-binding.service';

export class WorkspaceService {
    private static getRepository() {
        return AppDataSource.getRepository(WorkspaceEntity);
    }

    static async create(name: string, userId: string): Promise<WorkspaceEntity> {
        const repository = this.getRepository();
        const workspace = repository.create({ 
            name, 
            created_by: userId 
        });
        const savedWorkspace = await repository.save(workspace);

        // Create default roles
        const fullControlRole = await RoleService.create({
            name: 'full_control',
            for_workspace: savedWorkspace.id,
            create: true,
            read: true,
            update: true,
            delete: true,
            see_logs: true
        });

        await RoleService.create({
            name: 'read_only',
            for_workspace: savedWorkspace.id,
            create: false,
            read: true,
            update: false,
            delete: false,
            see_logs: false
        });

        // Add creator as member
        const workspaceUser = await WorkspaceUserService.create({
            workspace_id: savedWorkspace.id,
            user_id: userId
        });

        // Give creator full control role
        await RoleBindingService.create({
            user_id: userId,
            role_id: fullControlRole.id
        });

        return savedWorkspace;
    }

    static async findAll(): Promise<WorkspaceEntity[]> {
        const repository = this.getRepository();
        return repository.find();
    }

    static async findById(id: string): Promise<WorkspaceEntity | null> {
        const repository = this.getRepository();
        return repository.findOneBy({ id });
    }

    static async update(id: string, name: string): Promise<WorkspaceEntity | null> {
        const repository = this.getRepository();
        await repository.update(id, { name });
        return this.findById(id);
    }

    static async delete(id: string): Promise<void> {
        const repository = this.getRepository();
        await repository.delete(id);
    }
} 