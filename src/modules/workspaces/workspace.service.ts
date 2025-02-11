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
            see_logs: true,
            give_roles: true
        });

        await RoleService.create({
            name: 'read_only',
            for_workspace: savedWorkspace.id,
            create: false,
            read: true,
            update: false,
            delete: false,
            see_logs: false,
            give_roles: false
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

    static async update(id: string, data: { name: string }): Promise<WorkspaceEntity | null> {
        const repository = this.getRepository();
        await repository.update(id, data);
        return this.findById(id);
    }

    static async delete(id: string): Promise<void> {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Delete all secrets in workspace
            await queryRunner.manager
                .getRepository(SecretEntity)
                .delete({ workspace_id: id });

            // Delete all workspace users
            await queryRunner.manager
                .getRepository(WorkspaceUserEntity)
                .delete({ workspace_id: id });

            // Delete all role bindings for roles in this workspace
            await queryRunner.manager
                .getRepository(RoleBindingEntity)
                .createQueryBuilder('rb')
                .innerJoin('rb.role', 'role')
                .where('role.for_workspace = :workspaceId', { workspaceId: id })
                .delete()
                .execute();

            // Delete all roles in workspace
            await queryRunner.manager
                .getRepository(RoleEntity)
                .delete({ for_workspace: id });

            // Finally delete the workspace
            await queryRunner.manager
                .getRepository(WorkspaceEntity)
                .delete(id);

            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }
} 