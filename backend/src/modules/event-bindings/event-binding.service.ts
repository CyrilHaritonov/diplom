import { AppDataSource } from '../../config/database';
import { EventBindingEntity } from './event-binding.entity';
import { LogAction } from '../logging/types';

export class EventBindingService {
    private static getRepository() {
        return AppDataSource.getRepository(EventBindingEntity);
    }

    static async create(data: {
        user_id: string,
        type: LogAction,
        workspace_id: string
    }): Promise<EventBindingEntity> {
        const repository = this.getRepository();
        const eventBinding = repository.create(data);
        return repository.save(eventBinding);
    }

    static async findAll(userId: string): Promise<EventBindingEntity[]> {
        const repository = this.getRepository();
        return repository.find({
            where: {
                user_id: userId
            }
        });
    }

    static async findById(id: string): Promise<EventBindingEntity | null> {
        const repository = this.getRepository();
        return repository.findOneBy({ id });
    }

    static async update(id: string, type: LogAction, workspace_id: string): Promise<EventBindingEntity | null> {
        const repository = this.getRepository();
        await repository.update(id, { type, workspace_id });
        return this.findById(id);
    }

    static async delete(id: string): Promise<void> {
        const repository = this.getRepository();
        await repository.delete(id);
    }
} 