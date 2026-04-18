import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nom: string;

  @Column()
  email: string;

  @Column('text')
  message: string;

  @Column({ default: false })
  lu: boolean;

  @CreateDateColumn()
  date_envoi: Date;
}
