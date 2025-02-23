import { AppDataSource } from '../../config/database';
import { RoleBindingEntity } from './role-binding.entity';

export class RoleBindingService {
    private static getRepository() {
        return AppDataSource.getRepository(RoleBindingEntity);
    }

    static async create(data: {
        user_id: string,
        role_id: string
    }): Promise<RoleBindingEntity> {
        const repository = this.getRepository();
        const roleBinding = repository.create(data);
        return repository.save(roleBinding);
    }

    static async findAll(userId?: string): Promise<RoleBindingEntity[]> {
        const repository = this.getRepository();
        return repository.find({
            where: userId ? { user_id: userId } : undefined,
            relations: ['role', 'role.workspace']
        });
    }

    static async findById(id: string): Promise<RoleBindingEntity | null> {
        const repository = this.getRepository();
        return repository.findOne({
            where: { id },
            relations: ['role', 'role.workspace']
        });
    }

    static async delete(id: string): Promise<void> {
        const repository = this.getRepository();
        await repository.delete(id);
    }

    static async findByUserAndWorkspace(userId: string, workspaceId: string): Promise<RoleBindingEntity[]> {
        const repository = this.getRepository();
        return repository.createQueryBuilder('rb')
            .innerJoinAndSelect('rb.role', 'role')
            .innerJoinAndSelect('role.workspace', 'workspace')
            .where('rb.user_id = :userId', { userId })
            .andWhere('role.for_workspace = :workspaceId', { workspaceId })
            .getMany();
    }

    static async findByRoleAndWorkspace(roleId: string, workspaceId: string): Promise<RoleBindingEntity[]> {
        const repository = this.getRepository();
        return repository.createQueryBuilder('rb')
            .innerJoinAndSelect('rb.role', 'role')
            .innerJoinAndSelect('role.workspace', 'workspace')
            .where('rb.role_id = :roleId', { roleId })
            .andWhere('role.for_workspace = :workspaceId', { workspaceId })
            .getMany();
    }
} 
