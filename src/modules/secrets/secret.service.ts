import { AppDataSource } from '../../config/database';
import { SecretEntity } from './secret.entity';
import { LessThan, IsNull } from 'typeorm';
import { EncryptionUtil } from '../../utils/encryption';

export class SecretService {
    private static getRepository() {
        return AppDataSource.getRepository(SecretEntity);
    }

    static async create(data: {
        name: string,
        value: string,
        workspace_id: string,
        created_by: string,
        expires_at?: Date
    }): Promise<SecretEntity> {
        const repository = this.getRepository();
        const encryptedValue = EncryptionUtil.encrypt(data.value);
        
        const secret = repository.create({
            ...data,
            value: encryptedValue
        });
        return repository.save(secret);
    }

    static async findAll(workspaceId: string): Promise<SecretEntity[]> {
        const repository = this.getRepository();
        const now = new Date();
        const secrets = await repository.find({
            where: [
                { workspace_id: workspaceId, expires_at: IsNull() },
                { workspace_id: workspaceId, expires_at: LessThan(now) }
            ],
            relations: ['workspace']
        });

        // Decrypt values
        return secrets.map(secret => ({
            ...secret,
            value: EncryptionUtil.decrypt(secret.value)
        }));
    }

    static async findById(id: string): Promise<SecretEntity | null> {
        const repository = this.getRepository();
        const secret = await repository.findOne({
            where: { id },
            relations: ['workspace']
        });

        if (!secret) return null;

        // Decrypt value
        return {
            ...secret,
            value: EncryptionUtil.decrypt(secret.value)
        };
    }

    static async update(id: string, data: {
        name?: string,
        value?: string,
        expires_at?: Date | null
    }): Promise<SecretEntity | null> {
        const repository = this.getRepository();
        
        const updateData = {
            ...data,
            value: data.value ? EncryptionUtil.encrypt(data.value) : undefined,
            expires_at: data.expires_at === null ? null : data.expires_at
        } as Partial<SecretEntity>;

        await repository.update(id, updateData);
        return this.findById(id);
    }

    static async delete(id: string): Promise<void> {
        const repository = this.getRepository();
        await repository.delete(id);
    }
} 