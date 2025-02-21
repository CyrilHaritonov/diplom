import { AppDataSource } from '../../config/database';
import { RoleEntity } from './role.entity';
import { RoleBindingEntity } from '../role-bindings/role-binding.entity';

export class RoleService {
    private static getRepository() {
        return AppDataSource.getRepository(RoleEntity);
    }

    static async create(data: {
        name: string,
        for_workspace: string,
        create: boolean,
        read: boolean,
        update: boolean,
        delete: boolean,
        see_logs: boolean,
        give_roles: boolean,
        add_users: boolean,
        admin_rights: boolean
    }): Promise<RoleEntity> {
        const repository = this.getRepository();
        const role = repository.create(data);
        return repository.save(role);
    }

    static async findAll(workspaceId?: string): Promise<RoleEntity[]> {
        const repository = this.getRepository();
        return repository.find({
            where: workspaceId ? { for_workspace: workspaceId } : undefined,
            relations: ['workspace']
        });
    }

    static async findById(id: string): Promise<RoleEntity | null> {
        const repository = this.getRepository();
        return repository.findOne({
            where: { id },
            relations: ['workspace']
        });
    }

    static async update(id: string, data: {
        name?: string,
        create?: boolean,
        read?: boolean,
        update?: boolean,
        delete?: boolean,
        see_logs?: boolean,
        give_roles?: boolean,
        add_users?: boolean,
        admin_rights?: boolean
    }): Promise<RoleEntity | null> {
        const repository = this.getRepository();
        await repository.update(id, data);
        return this.findById(id);
    }

    static async delete(id: string): Promise<void> {
        const repository = this.getRepository();
        await repository.delete(id);
    }

    static async findByName(name: string, workspaceId: string): Promise<RoleEntity | null> {
        const repository = this.getRepository();
        return repository.findOne({
            where: { 
                name,
                for_workspace: workspaceId
            },
            relations: ['workspace']
        });
    }

    static async deleteWithBindings(id: string): Promise<void> {
        const repository = this.getRepository();
        const queryRunner = AppDataSource.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Delete role bindings first
            await queryRunner.manager
                .getRepository(RoleBindingEntity)
                .delete({ role_id: id });

            // Then delete the role
            await queryRunner.manager
                .getRepository(RoleEntity)
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