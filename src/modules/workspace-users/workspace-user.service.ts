import { AppDataSource } from '../../config/database';
import { WorkspaceUserEntity } from './workspace-user.entity';

export class WorkspaceUserService {
    private static getRepository() {
        return AppDataSource.getRepository(WorkspaceUserEntity);
    }

    static async create(data: {
        workspace_id: string,
        user_id: string
    }): Promise<WorkspaceUserEntity> {
        const repository = this.getRepository();
        const workspaceUser = repository.create(data);
        return repository.save(workspaceUser);
    }

    static async findAll(workspaceId?: string): Promise<WorkspaceUserEntity[]> {
        const repository = this.getRepository();
        return repository.find({
            where: workspaceId ? { workspace_id: workspaceId } : undefined,
            relations: ['workspace']
        });
    }

    static async findById(id: string): Promise<WorkspaceUserEntity | null> {
        const repository = this.getRepository();
        return repository.findOne({
            where: { id },
            relations: ['workspace']
        });
    }

    static async findByUserAndWorkspace(userId: string, workspaceId: string): Promise<WorkspaceUserEntity | null> {
        const repository = this.getRepository();
        return repository.findOne({
            where: {
                user_id: userId,
                workspace_id: workspaceId
            },
            relations: ['workspace']
        });
    }

    static async delete(id: string): Promise<void> {
        const repository = this.getRepository();
        await repository.delete(id);
    }
} 