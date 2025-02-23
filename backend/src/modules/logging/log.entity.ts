import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { WorkspaceEntity } from '../workspaces/workspace.entity';

@Entity('logs')
export class LogEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    user_id: string;

    @Column()
    action: string;

    @Column()
    subject: string;

    @CreateDateColumn()
    timestamp: Date;

    @Column({ name: 'workspace_id', nullable: true })
    workspace_id: string | null;

    @ManyToOne(() => WorkspaceEntity)
    @JoinColumn({ name: 'workspace_id' })
    workspace: WorkspaceEntity | null;
} 