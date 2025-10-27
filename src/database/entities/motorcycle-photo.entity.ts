import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
} from 'typeorm';
import { Motorcycle } from './motorcycle.entity';

@Entity('motorcycle_photos')
export class MotorcyclePhoto {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: string;

  // eslint-disable-next-line prettier/prettier
  @ManyToOne(() => Motorcycle, (motorcycle) => motorcycle.photos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'motorcycle_id' })
  motorcycle!: Motorcycle;

  @RelationId((photo: MotorcyclePhoto) => photo.motorcycle)
  motorcycleId!: string;

  @Column({ name: 'path_or_url', type: 'text' })
  pathOrUrl!: string;

  @Column({ name: 'is_cover', type: 'boolean', default: false })
  isCover!: boolean;

  @Column({ name: 'sort_order', type: 'smallint', default: 0 })
  sortOrder!: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
