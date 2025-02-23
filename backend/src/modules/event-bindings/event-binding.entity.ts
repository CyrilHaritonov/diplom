import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { LogAction } from '../logging/types';

@Entity('event_bindings')
export class EventBindingEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    user_id: string;

    @Column({
        type: 'enum',
        enum: LogAction
    })
    type: LogAction;
} 