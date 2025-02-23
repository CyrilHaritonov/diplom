import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { WorkspaceEntity } from '../workspaces/workspace.entity';

@Entity('workspace_users')
@Unique(['workspace_id', 'user_id'])
export class WorkspaceUserEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'workspace_id' })
    workspace_id: string;

    @Column()
    user_id: string;

    @ManyToOne(() => WorkspaceEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'workspace_id' })
    workspace: WorkspaceEntity;
} 