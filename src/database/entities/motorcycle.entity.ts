import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';
import { Store } from './store.entity';
import { Brand } from './brand.entity';
import { User } from './user.entity';
import { MotorcycleStatus, FuelType, TransmissionType } from '../enums';
import { MotorcyclePhoto } from './motorcycle-photo.entity';

@Entity('motorcycles')
export class Motorcycle {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: string;

  @ManyToOne(() => Store, (store) => store.motorcycles, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'store_id' })
  store!: Store;

  @RelationId((motorcycle: Motorcycle) => motorcycle.store)
  storeId!: string;

  @ManyToOne(() => Brand, (brand) => brand.motorcycles, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'brand_id' })
  brand!: Brand;

  @RelationId((motorcycle: Motorcycle) => motorcycle.brand)
  brandId!: string;

  @Column({ name: 'model_name', type: 'varchar', length: 160 })
  modelName!: string;

  @Column({ type: 'smallint', nullable: true })
  year?: number | null;

  @Column({ type: 'varchar', length: 60, nullable: true })
  color?: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  vin?: string | null;

  @Column({ type: 'varchar', length: 16, nullable: true })
  plate?: string | null;

  @Column({ type: 'int', nullable: true })
  km?: number | null;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  price?: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  cost?: string | null;

  @Column({
    type: 'enum',
    enum: MotorcycleStatus,
    enumName: 'motorcycle_status',
    default: MotorcycleStatus.AVAILABLE,
  })
  status!: MotorcycleStatus;

  @Column({
    type: 'enum',
    enum: FuelType,
    enumName: 'fuel_type',
    nullable: true,
  })
  fuel?: FuelType | null;

  @Column({ name: 'engine_cc', type: 'int', nullable: true })
  engineCc?: number | null;

  @Column({ name: 'power_hp', type: 'int', nullable: true })
  powerHp?: number | null;

  @Column({ name: 'torque_nm', type: 'int', nullable: true })
  torqueNm?: number | null;

  @Column({
    type: 'enum',
    enum: TransmissionType,
    enumName: 'transmission_type',
    nullable: true,
  })
  transmission?: TransmissionType | null;

  @Column({ type: 'boolean', nullable: true })
  abs?: boolean | null;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ name: 'has_documentation', type: 'boolean', nullable: true })
  hasDocumentation?: boolean | null;

  @Column({ name: 'has_inspection', type: 'boolean', nullable: true })
  hasInspection?: boolean | null;

  @Column({ name: 'extra_attributes', type: 'jsonb', nullable: true })
  extraAttributes?: Record<string, unknown> | null;

  @Column({ name: 'completeness_score', type: 'smallint', default: 0 })
  completenessScore!: number;

  @Column({ name: 'missing_fields', type: 'jsonb', nullable: true })
  missingFields?: string[] | null;

  @Column({ name: 'client_name', type: 'varchar', length: 160, nullable: true })
  clientName?: string | null;

  @Column({ name: 'client_phone', type: 'varchar', length: 30, nullable: true })
  clientPhone?: string | null;

  @Column({ name: 'document_cost', type: 'numeric', precision: 12, scale: 2, nullable: true })
  documentCost?: string | null;

  @Column({ name: 'maintenance_cost', type: 'numeric', precision: 12, scale: 2, nullable: true })
  maintenanceCost?: string | null;

  @Column({ name: 'down_payment', type: 'numeric', precision: 12, scale: 2, nullable: true })
  downPayment?: string | null;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted!: boolean;

  @ManyToOne(() => User, (user) => user.createdMotorcycles, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'created_by' })
  createdBy?: User | null;

  @RelationId((motorcycle: Motorcycle) => motorcycle.createdBy)
  createdById?: string | null;

  @ManyToOne(() => User, (user) => user.updatedMotorcycles, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'updated_by' })
  updatedBy?: User | null;

  @RelationId((motorcycle: Motorcycle) => motorcycle.updatedBy)
  updatedById?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => MotorcyclePhoto, (photo) => photo.motorcycle)
  photos?: MotorcyclePhoto[];
}

