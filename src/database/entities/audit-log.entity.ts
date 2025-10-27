import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
} from 'typeorm';
import { User } from './user.entity';

@Entity('audit_log')
@Index('idx_audit_entity', ['entity', 'entityId'])
export class AuditLog {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: string;

  @ManyToOne(() => User, (user) => user.auditLogs, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'user_id' })
  user?: User | null;

  @RelationId((log: AuditLog) => log.user)
  userId?: string | null;

  @Column({ type: 'varchar', length: 80 })
  entity!: string;

  @Column({ name: 'entity_id', type: 'bigint' })
  entityId!: string;

  @Column({ type: 'varchar', length: 30 })
  action!: string;

  @Column({ name: 'changed_data', type: 'jsonb', nullable: true })
  changedData?: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
