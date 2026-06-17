export interface OrgUserDto {
  id: string;
  organizationId: string;
  organizationName?: string | null;
  email: string;
  fullName: string | null;
  role: string;
  isActive: boolean;
  lastActiveAt: string | null;
  createdAt: string;
}

export function toOrgUserDto(user: {
  id: string;
  organizationId: string;
  organization?: { name: string } | null;
  email: string;
  fullName: string | null;
  role: string;
  isActive: boolean;
  lastActiveAt: Date | null;
  createdAt: Date;
}): OrgUserDto {
  return {
    id: user.id,
    organizationId: user.organizationId,
    organizationName: user.organization?.name ?? null,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    isActive: user.isActive,
    lastActiveAt: user.lastActiveAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}
