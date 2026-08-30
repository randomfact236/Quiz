import { UserRole } from '../entities/user.entity';

/**
 * Roles that can be assigned through the admin surface. The DB CHECK
 * constraint (`users_role_check`, migration 1788600000000) mirrors this.
 */
export const ASSIGNABLE_ROLES: UserRole[] = [UserRole.USER, UserRole.ADMIN];
