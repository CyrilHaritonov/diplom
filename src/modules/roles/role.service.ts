import { AppDataSource } from '../../config/database';
import { RoleEntity } from './role.entity';

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
        see_logs: boolean
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
        rights?: string
    }): Promise<RoleEntity | null> {
        const repository = this.getRepository();
        await repository.update(id, data);
        return this.findById(id);
    }

    static async delete(id: string): Promise<void> {
        const repository = this.getRepository();
        await repository.delete(id);
    }
} 