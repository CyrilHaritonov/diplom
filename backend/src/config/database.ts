import dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { LogEntity } from '../modules/logging/log.entity';
import { WorkspaceEntity } from '../modules/workspaces/workspace.entity';
import { RoleEntity } from '../modules/roles/role.entity';
import { RoleBindingEntity } from '../modules/role-bindings/role-binding.entity';
import { WorkspaceUserEntity } from '../modules/workspace-users/workspace-user.entity';
import { EventBindingEntity } from '../modules/event-bindings/event-binding.entity';
import { SecretEntity } from '../modules/secrets/secret.entity';
import { ChatBinding } from '../modules/chat-bindings/chat-binding.entity';

dotenv.config();

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT as string),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD as string || 'postgres',
    database: process.env.DB_NAME,
    entities: [LogEntity, WorkspaceEntity, RoleEntity, RoleBindingEntity, WorkspaceUserEntity, EventBindingEntity, SecretEntity, ChatBinding],
    synchronize: process.env.NODE_ENV === 'development',
    logging: process.env.NODE_ENV === 'development'
}); 