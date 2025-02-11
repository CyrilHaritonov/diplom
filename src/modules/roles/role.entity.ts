import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { WorkspaceEntity } from '../workspaces/workspace.entity';

@Entity('roles')
export class RoleEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ name: 'workspace_id' })
    for_workspace: string;

    @Column()
    create: boolean;

    @Column()
    read: boolean;

    @Column()
    update: boolean;

    @Column()
    delete: boolean;

    @Column()
    see_logs: boolean;

    @ManyToOne(() => WorkspaceEntity)
    @JoinColumn({ name: 'workspace_id' })
    workspace: WorkspaceEntity;
} 