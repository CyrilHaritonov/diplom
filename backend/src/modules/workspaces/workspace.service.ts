import { AppDataSource } from '../../config/database';
import { WorkspaceEntity } from './workspace.entity';
import { RoleService } from '../roles/role.service';
import { WorkspaceUserService } from '../workspace-users/workspace-user.service';
import { RoleBindingService } from '../role-bindings/role-binding.service';
import { SecretEntity } from '../secrets/secret.entity';
import { WorkspaceUserEntity } from '../workspace-users/workspace-user.entity';
import { RoleBindingEntity } from '../role-bindings/role-binding.entity';
import { RoleEntity } from '../roles/role.entity';

export class WorkspaceService {
    private static getRepository() {
        return AppDataSource.getRepository(WorkspaceEntity);
    }

    static async create(name: string, userId: string): Promise<WorkspaceEntity> {
        const repository = this.getRepository();
        const workspace = repository.create({ 
            name,
            owner_id: userId,
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
            deletable: true,
            see_logs: true,
            give_roles: true,
            add_users: true,
            admin_rights: true
        });

        await RoleService.create({
            name: 'read_only',
            for_workspace: savedWorkspace.id,
            create: false,
            read: true,
            update: false,
            deletable: false,
            see_logs: false,
            give_roles: false,
            add_users: false,
            admin_rights: false
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

    static async findAll(userId: string): Promise<WorkspaceEntity[]> {
        const repository = this.getRepository();
        // Get all workspaces
        const allWorkspaces = await repository.find({ where: { deleted: false } });

        // Filter workspaces to only include those where the user is a member
        const memberWorkspaces = await Promise.all(
            allWorkspaces.map(async (workspace) => {
                const isMember = await WorkspaceUserService.isUserMember(workspace.id, userId);
                return isMember ? workspace : null;
            })
        );

        // Filter out null values
        return memberWorkspaces.filter((workspace) => workspace !== null) as WorkspaceEntity[];
    }

    static async findById(id: string): Promise<WorkspaceEntity | null> {
        const repository = this.getRepository();
        return repository.findOneBy({ id });
    }

    static async update(id: string, data: { name: string }): Promise<WorkspaceEntity | null> {
        const repository = this.getRepository();
        await repository.update(id, data);
        return this.findById(id);
    }

    static async delete(id: string): Promise<void> {
        const repository = this.getRepository();
        const workspace = await repository.findOneBy({ id });

        if (!workspace) {
            throw new Error('Workspace not found');
        }

        // Set the deleted flag instead of removing the record
        workspace.deleted = true;
        await repository.save(workspace);
    }
} 