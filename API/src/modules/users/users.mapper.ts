export interface OrgUserDto {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  isActive: boolean;
  lastActiveAt: string | null;
  createdAt: string;
}

export function toOrgUserDto(user: {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  isActive: boolean;
  lastActiveAt: Date | null;
  createdAt: Date;
}): OrgUserDto {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    isActive: user.isActive,
    lastActiveAt: user.lastActiveAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}
