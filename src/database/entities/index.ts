import { AuditLog } from './audit-log.entity';
import { Brand } from './brand.entity';
import { Motorcycle } from './motorcycle.entity';
import { MotorcyclePhoto } from './motorcycle-photo.entity';
import { RefreshToken } from './refresh-token.entity';
import { Role } from './role.entity';
import { Store } from './store.entity';
import { User } from './user.entity';
import { UserRole } from './user-role.entity';

export const databaseEntities = [
  AuditLog,
  Brand,
  Motorcycle,
  MotorcyclePhoto,
  RefreshToken,
  Role,
  Store,
  User,
  UserRole,
];
export type DatabaseEntity = (typeof databaseEntities)[number];

export {
  AuditLog,
  Brand,
  Motorcycle,
  MotorcyclePhoto,
  RefreshToken,
  Role,
  Store,
  User,
  UserRole,
};
