import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('workspaces')
export class WorkspaceEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ name: 'owner_id' })
    owner_id: string;

    @Column()
    created_by: string;

    @CreateDateColumn()
    created_at: Date;
} 