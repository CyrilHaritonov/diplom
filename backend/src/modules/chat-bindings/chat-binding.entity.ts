import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('chat_bindings')
export class ChatBinding {
    @PrimaryColumn()
    user_id: string;

    @Column('text')
    chat_id: string;

    @Column('text')
    code: string;
} 