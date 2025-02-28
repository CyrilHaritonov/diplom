import { AppDataSource } from '../../config/database';
import { ChatBinding } from './chat-binding.entity';

export class ChatBindingService {
    private static getRepository() {
        return AppDataSource.getRepository(ChatBinding);
    }

    static async create(data: { user_id: string; chat_id: string; code: string }): Promise<ChatBinding> {
        const repository = this.getRepository();
        const chatBinding = repository.create(data);
        return repository.save(chatBinding);
    }

    static async findById(user_id: string): Promise<ChatBinding | null> {
        const repository = this.getRepository();
        return repository.findOne({ where: { user_id} });
    }

    static async update(code: string, chat_id: string): Promise<ChatBinding | null> {
        const repository = this.getRepository();
        const chatBinding = await repository.findOne({ where: { code } });
        if (chatBinding && chatBinding.chat_id === "") {
            chatBinding.chat_id = chat_id;
            await repository.save(chatBinding);
            return chatBinding;
        }
        return null;
    }

    static async delete(user_id: string): Promise<void> {
        const repository = this.getRepository();
        await repository.delete({ user_id });
    }
} 