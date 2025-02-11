import { DataSource } from 'typeorm';
import { LogEntity } from '../modules/logging/log.entity';
import { WorkspaceEntity } from '../modules/workspaces/workspace.entity';
import { RoleEntity } from '../modules/roles/role.entity';
import { RoleBindingEntity } from '../modules/role-bindings/role-binding.entity';
import { WorkspaceUserEntity } from '../modules/workspace-users/workspace-user.entity';

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [LogEntity, WorkspaceEntity, RoleEntity, RoleBindingEntity, WorkspaceUserEntity],
    synchronize: process.env.NODE_ENV === 'development',
    logging: process.env.NODE_ENV === 'development'
}); 