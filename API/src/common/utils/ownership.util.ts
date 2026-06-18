import { Prisma } from '@prisma/client';
import type { RequestUser } from '../../modules/auth/auth.types';

/**
 * Returns a Prisma where clause object enforcing user ownership.
 * Super Admins are granted bypass.
 *
 * @param user The authenticated request user
 * @param ownerField The schema field mapping to the user's ID (e.g. 'createdById', 'submittedById')
 */
export function getOwnershipFilter(
  user: RequestUser,
  ownerField: string,
): Record<string, string> {
  if (user.role === 'super_admin') {
    return {};
  }
  return { [ownerField]: user.id };
}
