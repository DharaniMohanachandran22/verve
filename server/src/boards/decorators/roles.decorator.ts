import { SetMetadata } from '@nestjs/common';
import { Role } from '../schemas/board.schema';

export interface PermissionGuardMeta {
  roles: Role[];
  allowSelf: boolean;
}

export const ROLES_KEY = 'roles';

export const Roles = (roles: Role[], allowSelf = false): MethodDecorator =>
  SetMetadata<string, PermissionGuardMeta>(ROLES_KEY, { roles, allowSelf });
