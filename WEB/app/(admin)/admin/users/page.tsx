'use client';

import { Users as UsersIcon, Plus, MoreHorizontal } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

import { DataTable, type DataTableColumn } from '@/components/admin/data-table';
import { PaginationBar } from '@/components/admin/pagination-bar';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Modal, ConfirmDialog } from '@/components/ui/modal';
import {
  useDeleteOrgUser,
  useUpdateOrgUser,
} from '@/hooks/use-admin';
import { useOrgUsers, useCreateOrgUser } from '@/hooks/use-org-users';
import { formatRoleLabel, isPlatformSuperAdmin } from '@/lib/roles';
import type { OrgUserRecord, UserRole } from '@/lib/types';
import { useAuthStore } from '@/stores/auth-store';

function isProtectedRole(role: string): boolean {
  return (
    role === 'platform_super_admin' ||
    role === 'tenant_admin' ||
    role === 'platform_support'
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null) {
    const typed = error as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    return typed.response?.data?.message ?? typed.message ?? fallback;
  }
  return fallback;
}

const getInitials = (name: string | null) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
};

type CreateUserFormState = {
  email: string;
  fullName: string;
  role: UserRole;
  password: string;
};

type EditUserFormState = {
  fullName: string;
  role: UserRole;
  isActive: boolean;
};

function UsersContent() {
  const currentUser = useAuthStore((s) => s.user);
  const isSuperAdmin = isPlatformSuperAdmin(currentUser?.role);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [debouncedQ, setDebouncedQ] = useState('');
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  const limit = 15;
  const updateUser = useUpdateOrgUser();
  const deleteUser = useDeleteOrgUser();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateUserFormState>({
    email: '',
    fullName: '',
    role: 'employee',
    password: '',
  });
  const [createError, setCreateError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<OrgUserRecord | null>(null);
  const [editForm, setEditForm] = useState<EditUserFormState>({
    fullName: '',
    role: 'employee',
    isActive: true,
  });
  const [editError, setEditError] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<OrgUserRecord | null>(null);

  const createUser = useCreateOrgUser();

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    try {
      await createUser.mutateAsync({
        email: createForm.email.trim(),
        fullName: createForm.fullName.trim(),
        role: isSuperAdmin ? createForm.role : 'employee',
        password: createForm.password,
      });
      setIsCreateOpen(false);
      setCreateForm({
        email: '',
        fullName: '',
        role: 'employee',
        password: '',
      });
    } catch (err: unknown) {
      setCreateError(getErrorMessage(err, 'Failed to create user'));
    }
  };

  const openCreateModal = () => {
    setCreateError(null);
    setCreateForm({
      email: '',
      fullName: '',
      role: 'employee',
      password: '',
    });
    setIsCreateOpen(true);
  };

  const openEditModal = (user: OrgUserRecord) => {
    setEditingUser(user);
    setEditError(null);
    setEditForm({
      fullName: user.fullName ?? '',
      role: user.role,
      isActive: user.isActive,
    });
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setEditError(null);
    try {
      await updateUser.mutateAsync({
        id: editingUser.id,
        fullName: editForm.fullName.trim(),
        role: isSuperAdmin ? editForm.role : undefined,
        isActive: editForm.isActive,
      });
      setEditingUser(null);
    } catch (err: unknown) {
      setEditError(getErrorMessage(err, 'Failed to update user'));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;
    try {
      await deleteUser.mutateAsync(deletingUser.id);
      setDeletingUser(null);
    } catch {
      /* handled */
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useOrgUsers({
    page,
    limit,
    q: debouncedQ || undefined,
  });

  const totalPages = Math.max(1, Math.ceil((data?.meta.total ?? 0) / limit));

  const columns: DataTableColumn<OrgUserRecord>[] = [
    {
      key: 'user',
      header: 'User',
      className: 'min-w-[200px]',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400 flex items-center justify-center font-bold text-xs shrink-0">
            {getInitials(row.fullName ?? row.email)}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-foreground truncate">
              {row.fullName ?? row.email}
            </p>
            {row.fullName && (
              <p className="text-xs text-text-tertiary truncate">{row.email}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      className: 'w-[120px]',
      render: (row) => (
        <Badge variant="default">{formatRoleLabel(row.role)}</Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      className: 'w-[100px]',
      render: (row) => (
        <Badge variant={row.isActive ? 'success' : 'default'}>
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'lastActive',
      header: 'Last active',
      className: 'w-[140px]',
      render: (row) => (
        <span className="text-xs text-text-tertiary">
          {row.lastActiveAt
            ? new Date(row.lastActiveAt).toLocaleDateString()
            : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-[120px] text-right',
      render: (row) => {
        const isProtected = isProtectedRole(row.role);
        const isDropdownOpen = activeDropdownId === row.id;
        return (
          <div className="flex justify-end gap-2 items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEditModal(row)}
              disabled={isProtected || updateUser.isPending}
              className="h-7 px-2.5 text-xs"
              title="Edit member details"
            >
              Edit
            </Button>
            <div className="relative">
              <button
                onClick={() =>
                  setActiveDropdownId(isDropdownOpen ? null : row.id)
                }
                className="h-7 w-7 flex items-center justify-center text-text-secondary hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md border border-border/40 focus:outline-none disabled:opacity-50"
                title="More actions"
                disabled={isProtected}
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {isDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setActiveDropdownId(null)}
                  />
                  <div className="absolute right-0 mt-1 w-44 rounded-md border border-neutral-200 dark:border-neutral-800 bg-surface shadow-lg py-1 z-50 text-left">
                    <button
                      onClick={() => {
                        setActiveDropdownId(null);
                        openEditModal(row);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-text-primary hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    >
                      Change role
                    </button>
                    <button
                      onClick={async () => {
                        setActiveDropdownId(null);
                        try {
                          await updateUser.mutateAsync({
                            id: row.id,
                            isActive: !row.isActive,
                          });
                        } catch {}
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-text-primary hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    >
                      {row.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <div className="border-t border-neutral-100 dark:border-neutral-800 my-1" />
                    <button
                      onClick={() => {
                        setActiveDropdownId(null);
                        setDeletingUser(row);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-red-650 hover:bg-neutral-50 dark:hover:bg-neutral-800 font-medium"
                      disabled={row.id === currentUser?.id}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      },
    },
  ];

  if (currentUser && !isSuperAdmin) {
    return null;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Team"
        description={
          isSuperAdmin
            ? 'Manage managers and employees across organizations'
            : 'Create and manage employee accounts in your organization'
        }
        action={
          <Button
            variant="primary"
            size="sm"
            onClick={openCreateModal}
            className="flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" /> Add member
          </Button>
        }
      />

      <Card>
        <CardContent className="space-y-4 p-4">
          <Input
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            rows={data?.items ?? []}
            keyField={(r) => r.id}
            isLoading={isLoading}
            emptyState={
              <EmptyState
                icon={UsersIcon}
                title="No users yet"
                description={
                  isSuperAdmin
                    ? 'Create a user to assign them to organizations.'
                    : 'Create your first salesperson to start scanning cards.'
                }
                actionLabel="Add User"
                onAction={openCreateModal}
              />
            }
          />
          {!isLoading && data?.items && data.items.length > 0 && (
            <PaginationBar
              page={page}
              totalPages={totalPages}
              total={data?.meta.total ?? 0}
              onPageChange={setPage}
            />
          )}
        </CardContent>
      </Card>

      {/* CREATE USER MODAL */}
      <Modal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add team member"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="create-user-form"
              loading={createUser.isPending}
            >
              Add member
            </Button>
          </div>
        }
      >
        {createError && (
          <p className="text-sm text-red-655 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-md p-2 mb-4">
            {createError}
          </p>
        )}
        <form
          id="create-user-form"
          onSubmit={handleCreateUser}
          className="space-y-4"
        >
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-tertiary mb-1">
              Full Name
            </label>
            <Input
              required
              placeholder="e.g. Sales Employee"
              value={createForm.fullName}
              onChange={(e) =>
                setCreateForm((current) => ({
                  ...current,
                  fullName: e.target.value,
                }))
              }
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-tertiary mb-1">
              Email
            </label>
            <Input
              required
              type="email"
              placeholder="e.g. employee@cardvault.local"
              value={createForm.email}
              onChange={(e) =>
                setCreateForm((current) => ({
                  ...current,
                  email: e.target.value,
                }))
              }
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-tertiary mb-1">
              Password
            </label>
            <Input
              required
              type="password"
              placeholder="At least 8 characters"
              value={createForm.password}
              onChange={(e) =>
                setCreateForm((current) => ({
                  ...current,
                  password: e.target.value,
                }))
              }
              minLength={8}
            />
          </div>

          {isSuperAdmin ? (
            <>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-tertiary mb-1">
                  Role
                </label>
                <select
                  className="w-full rounded-md border border-neutral-200 bg-neutral-0 dark:border-neutral-800 dark:bg-neutral-900 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-600/20"
                  value={createForm.role}
                  onChange={(e) =>
                    setCreateForm((current) => ({
                      ...current,
                      role: e.target.value as UserRole,
                    }))
                  }
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-tertiary mb-1">
                Role
              </label>
              <Input value="Employee" disabled />
            </div>
          )}
        </form>
      </Modal>

      {/* EDIT USER MODAL */}
      <Modal
        open={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="Edit member"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setEditingUser(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="edit-user-form"
              loading={updateUser.isPending}
            >
              Save Changes
            </Button>
          </div>
        }
      >
        {editError && (
          <p className="mb-4 rounded-md border border-red-200 bg-red-50 dark:bg-red-950/20 p-2 text-sm text-red-650">
            {editError}
          </p>
        )}
        {editingUser && (
          <form
            id="edit-user-form"
            onSubmit={handleEditUser}
            className="space-y-4"
          >
            <Input label="Email" value={editingUser.email} disabled />
            <Input
              label="Full Name"
              value={editForm.fullName}
              onChange={(e) =>
                setEditForm((current) => ({
                  ...current,
                  fullName: e.target.value,
                }))
              }
            />

            {isSuperAdmin ? (
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-tertiary mb-1">
                  Role
                </label>
                <select
                  className="w-full rounded-md border border-neutral-200 bg-neutral-0 dark:border-neutral-800 dark:bg-neutral-900 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-600/20"
                  value={editForm.role}
                  onChange={(e) =>
                    setEditForm((current) => ({
                      ...current,
                      role: e.target.value as UserRole,
                    }))
                  }
                  disabled={isProtectedRole(editingUser.role)}
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="tenant_admin">Tenant Admin</option>
                  {editingUser.role === 'platform_super_admin' ? (
                    <option value="platform_super_admin">
                      Platform Super Admin
                    </option>
                  ) : null}
                  {editingUser.role === 'platform_support' ? (
                    <option value="platform_support">Platform Support</option>
                  ) : null}
                </select>
              </div>
            ) : null}

            <label className="flex items-center gap-2 text-sm text-foreground select-none">
              <input
                type="checkbox"
                checked={editForm.isActive}
                onChange={(e) =>
                  setEditForm((current) => ({
                    ...current,
                    isActive: e.target.checked,
                  }))
                }
                disabled={editingUser.id === currentUser?.id}
              />
              Account is active
            </label>
          </form>
        )}
      </Modal>

      {/* DELETE CONFIRMATION DIALOG */}
      <ConfirmDialog
        open={!!deletingUser}
        onCancel={() => setDeletingUser(null)}
        onConfirm={handleDeleteConfirm}
        title="Remove team member"
        message={
          deletingUser
            ? `Remove ${deletingUser.fullName ?? deletingUser.email} from the organization? This cannot be undone.`
            : ''
        }
        loading={deleteUser.isPending}
      />
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 animate-pulse">
          <div className="h-9 w-48 bg-neutral-200 dark:bg-neutral-800 rounded" />
          <div className="h-64 bg-neutral-200 dark:bg-neutral-800 rounded" />
        </div>
      }
    >
      <UsersContent />
    </Suspense>
  );
}
