import { AppRole } from '../constants/roles.constant';

export interface AuthenticatedUser {
  id: string;
  email: string;
  roles: AppRole[];
}
