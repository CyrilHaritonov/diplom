import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { WorkspaceEntity } from '../workspaces/workspace.entity';

@Entity('secrets')
export class SecretEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    value: string;

    @Column({ name: 'workspace_id' })
    workspace_id: string;

    @Column()
    created_by: string;

    @Column({ type: 'timestamp', nullable: true })
    expires_at: Date;

    @CreateDateColumn()
    created_at: Date;

    @ManyToOne(() => WorkspaceEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'workspace_id' })
    workspace: WorkspaceEntity;
} 