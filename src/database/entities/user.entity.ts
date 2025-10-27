import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';
import { Store } from './store.entity';
import { UserStatus } from '../enums';
import { UserRole } from './user-role.entity';
import { RefreshToken } from './refresh-token.entity';
import { Motorcycle } from './motorcycle.entity';
import { AuditLog } from './audit-log.entity';

@Entity('users')
@Index('uq_users_email', ['email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: string;

  @ManyToOne(() => Store, (store) => store.users, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'store_id' })
  store?: Store | null;

  @RelationId((user: User) => user.store)
  storeId?: string | null;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'varchar', length: 160 })
  email!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({
    type: 'enum',
    enum: UserStatus,
    enumName: 'user_status',
    default: UserStatus.ACTIVE,
  })
  status!: UserStatus;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt?: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => UserRole, (userRole) => userRole.user)
  userRoles?: UserRole[];

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens?: RefreshToken[];

  @OneToMany(() => Motorcycle, (motorcycle) => motorcycle.createdBy)
  createdMotorcycles?: Motorcycle[];

  @OneToMany(() => Motorcycle, (motorcycle) => motorcycle.updatedBy)
  updatedMotorcycles?: Motorcycle[];

  @OneToMany(() => AuditLog, (audit) => audit.user)
  auditLogs?: AuditLog[];
}
