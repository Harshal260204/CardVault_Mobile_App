'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3,
  CalendarDays,
  Contact,
  Download,
  LayoutDashboard,
  Menu,
  Shield,
  Users,
  X,
  Sun,
  Moon,
  LogOut,
  Bell,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';

import { CommandPalette } from '@/components/admin/command-palette';
import { useOrganizations } from '@/hooks/use-admin';
import { isPlatformSuperAdmin } from '@/lib/roles';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { useThemeStore } from '@/stores/theme-store';

interface NavItem {
  readonly href: string;
  readonly label: string;
  readonly icon: React.ElementType;
}

interface NavGroup {
  readonly group: string;
  readonly items: readonly NavItem[];
  readonly superAdminOnly?: boolean;
}

const navGroups: readonly NavGroup[] = [
  {
    group: '',
    items: [
      { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    group: 'Data',
    items: [
      { href: '/admin/contacts', label: 'Contacts', icon: Contact },
      { href: '/admin/sessions', label: 'Sessions', icon: CalendarDays },
      { href: '/admin/users', label: 'Users', icon: Users },
    ],
  },
  {
    group: 'System',
    items: [
      { href: '/admin/audit-log', label: 'Audit Log', icon: Shield },
      { href: '/admin/export', label: 'Export', icon: Download },
    ],
  },
];

const getInitials = (name: string | null) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
};

const getRoleLabel = (role?: string) => {
  if (!role) return '';
  switch (role) {
    case 'platform_super_admin':
      return 'Super Admin';
    case 'platform_support':
      return 'Support';
    case 'tenant_admin':
      return 'Admin';
    case 'manager':
      return 'Manager';
    case 'employee':
      return 'Employee';
    default:
      return role;
  }
};

function NavLinks({
  pathname,
  isSuperAdmin,
  onNavigate,
  className,
  collapsed = false,
}: {
  pathname: string;
  isSuperAdmin: boolean;
  onNavigate?: () => void;
  className?: string;
  collapsed?: boolean;
}) {
  return (
    <nav className={cn('flex-1 space-y-4 px-3 py-4', className)}>
      {navGroups.map((group, groupIdx) => {
        if (group.superAdminOnly && !isSuperAdmin) return null;

        return (
          <div key={groupIdx} className="space-y-1">
            {group.group && !collapsed && (
              <div className="text-[10px] font-semibold text-white/30 uppercase tracking-widest px-3 mb-1.5 mt-4">
                {group.group}
              </div>
            )}
            {group.group && collapsed && (
              <div className="border-t border-white/5 my-2 mx-2" />
            )}

            {group.items.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);

              if (collapsed) {
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onNavigate}
                    title={label}
                    className="flex items-center justify-center h-12 w-full relative group/item"
                  >
                    {active && (
                      <div className="absolute left-0 top-2.5 bottom-2.5 w-[2px] bg-brand-600 rounded-r" />
                    )}
                    <div
                      className={cn(
                        'flex items-center justify-center h-10 w-10 rounded-md transition-colors',
                        active
                          ? 'bg-white/15 text-white'
                          : 'text-white/70 group-hover/item:bg-white/5 group-hover/item:text-white',
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    </div>
                  </Link>
                );
              }

              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onNavigate}
                  className={cn(
                    'flex items-center rounded-md gap-3 px-3 py-2 text-sm transition-colors duration-150',
                    active
                      ? 'bg-white/10 text-white font-medium'
                      : 'text-white/70 hover:bg-white/5 hover:text-white',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}

export function AdminDrawer({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const isSuperAdmin = isPlatformSuperAdmin(useAuthStore((s) => s.user?.role));
  const currentUser = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  const { data: organizations } = useOrganizations(isSuperAdmin);

  const currentOrgName = isSuperAdmin
    ? (organizations?.find((org) => org.id === currentUser?.organizationId)
        ?.name ??
      currentUser?.organizationId ??
      'Super Admin')
    : null;

  const segments = pathname.split('/').filter(Boolean);
  const formatSegment = (segment: string) => {
    if (segment === 'admin') return 'Home';
    return segment
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const breadcrumbs = segments.map((seg, idx) => {
    const isLast = idx === segments.length - 1;
    const href = '/' + segments.slice(0, idx + 1).join('/');
    const label = formatSegment(seg);
    return { label, href, isLast };
  });

  const handleSearchClick = () => {
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      metaKey: true,
      bubbles: true,
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground font-sans">
      {/* Sidebar - Desktop & Tablet */}
      <aside className="hidden md:flex shrink-0 flex-col bg-neutral-950 text-white transition-all duration-200 md:w-[60px] lg:w-[240px] border-r border-white/5">
        {/* Header */}
        <div className="flex h-14 items-center px-4 font-semibold tracking-tight border-b border-white/5 justify-center lg:justify-start lg:px-6">
          <span className="hidden lg:inline text-white">CardVault Admin</span>
          <span className="inline lg:hidden text-xs text-white">CV</span>
        </div>

        {/* Navigation links */}
        <div className="flex-1 overflow-y-auto">
          {/* Expanded links on desktop */}
          <div className="hidden lg:block">
            <NavLinks pathname={pathname} isSuperAdmin={isSuperAdmin} />
          </div>
          {/* Collapsed links on tablet */}
          <div className="block lg:hidden">
            <NavLinks
              pathname={pathname}
              isSuperAdmin={isSuperAdmin}
              collapsed={true}
            />
          </div>
        </div>

        {/* Footer Area with Theme Toggle & User Info & Logout */}
        <div className="border-t border-white/5 p-3">
          {/* Expanded view on desktop */}
          <div className="hidden lg:block space-y-3">
            {currentUser && (
              <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/10">
                <div className="h-8 w-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {getInitials(currentUser.fullName)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate text-white">
                    {currentUser.fullName || 'User'}
                  </p>
                  <span className="inline-block px-1.5 py-0.5 text-[9px] rounded font-semibold bg-white/10 text-white/80">
                    {getRoleLabel(currentUser.role)}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between px-1">
              <button
                onClick={toggleTheme}
                type="button"
                className="h-8 w-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
              >
                {theme === 'light' ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </button>

              <button
                onClick={logout}
                type="button"
                className="h-8 w-8 rounded-lg flex items-center justify-center text-white/50 hover:text-red-400 hover:bg-white/5 transition-colors"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Collapsed view on tablet */}
          <div className="block lg:hidden flex flex-col items-center gap-3">
            <div
              className="h-8 w-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xs shrink-0"
              title={currentUser?.fullName || 'User'}
            >
              {currentUser ? getInitials(currentUser.fullName) : 'U'}
            </div>
            <button
              onClick={toggleTheme}
              type="button"
              className="h-8 w-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5 transition-colors"
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            >
              {theme === 'light' ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Bar Component */}
        <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-neutral-200 dark:border-neutral-800 bg-neutral-0 dark:bg-neutral-900 px-4">
          {/* Mobile view layout */}
          <div className="flex items-center gap-3 md:hidden w-full justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="p-1.5 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <span className="font-bold text-sm tracking-tight text-neutral-900 dark:text-white">
                CardVault
              </span>
            </div>

            {/* Avatar Dropdown on Mobile */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="h-8 w-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xs shrink-0 focus:outline-none"
              >
                {currentUser ? getInitials(currentUser.fullName) : 'U'}
              </button>
              {showUserDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 rounded-md border border-neutral-200 dark:border-neutral-800 bg-surface shadow-lg py-1 z-50">
                    <div className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-800 text-xs">
                      <p className="font-semibold text-foreground truncate">
                        {currentUser?.fullName || 'User'}
                      </p>
                      <p className="text-text-tertiary truncate text-[10px]">
                        {currentUser?.email}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        logout();
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-red-650 hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-2"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Desktop & Tablet view layout */}
          <div className="hidden md:flex w-full items-center justify-between">
            {/* Left: Breadcrumbs */}
            <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
              {breadcrumbs.map((bc, idx) => (
                <div key={bc.href} className="flex items-center gap-1.5">
                  {idx > 0 && (
                    <span className="text-neutral-300 dark:text-neutral-600">
                      /
                    </span>
                  )}
                  {bc.isLast ? (
                    <span className="font-semibold text-neutral-900 dark:text-neutral-250">
                      {bc.label}
                    </span>
                  ) : (
                    <Link
                      href={bc.href}
                      className="hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors"
                    >
                      {bc.label}
                    </Link>
                  )}
                </div>
              ))}
            </div>

            {/* Middle: Organization context pill (for super admin only) */}
            {isSuperAdmin && currentOrgName && (
              <div
                className="mx-4 px-2.5 py-1 text-xs font-medium rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 border border-brand-100 dark:border-brand-500/20 max-w-[200px] truncate"
                title={`Organization Context: ${currentOrgName}`}
              >
                Org: {currentOrgName}
              </div>
            )}

            {/* Right actions */}
            <div className="flex items-center gap-3">
              {/* Search button */}
              <button
                onClick={handleSearchClick}
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-350 bg-neutral-50 dark:bg-neutral-850 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md border border-neutral-200 dark:border-neutral-800 transition-colors"
              >
                <Search className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Search...</span>
                <kbd className="hidden sm:inline-flex h-4 items-center gap-0.5 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 px-1 font-mono text-[9px] font-medium text-neutral-400">
                  <span>⌘</span>K
                </kbd>
              </button>

              {/* Notification bell placeholder */}
              <button
                className="relative p-1.5 text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-350 hover:bg-neutral-50 dark:hover:bg-neutral-850 rounded-full transition-colors"
                title="Notifications"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-1 right-1 h-1.5 w-1.5 bg-brand-600 rounded-full" />
              </button>

              {/* Avatar Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="h-8 w-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xs shrink-0 focus:outline-none hover:ring-2 hover:ring-brand-600/30 transition-all"
                >
                  {currentUser ? getInitials(currentUser.fullName) : 'U'}
                </button>
                {showUserDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowUserDropdown(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 rounded-md border border-neutral-200 dark:border-neutral-800 bg-surface shadow-lg py-1 z-50">
                      <div className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-800 text-xs">
                        <p className="font-semibold text-foreground truncate">
                          {currentUser?.fullName || 'User'}
                        </p>
                        <p className="text-text-tertiary truncate text-[10px]">
                          {currentUser?.email}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          logout();
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-red-650 hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-2"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 bg-canvas">
          {children}
        </main>
      </div>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {open ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 md:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="fixed inset-y-0 left-0 z-50 flex w-[240px] flex-col bg-neutral-950 text-white md:hidden"
            >
              <div className="flex h-14 items-center justify-between px-4 border-b border-white/5">
                <span className="font-semibold text-white">
                  CardVault Admin
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <NavLinks
                  pathname={pathname}
                  isSuperAdmin={isSuperAdmin}
                  onNavigate={() => setOpen(false)}
                />
              </div>

              {/* Mobile Sidebar Footer */}
              <div className="border-t border-white/5 p-4 space-y-3">
                {currentUser && (
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/10">
                    <div className="h-8 w-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {getInitials(currentUser.fullName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate text-white">
                        {currentUser.fullName || 'User'}
                      </p>
                      <span className="inline-block px-1.5 py-0.5 text-[9px] rounded font-semibold bg-white/10 text-white/80">
                        {getRoleLabel(currentUser.role)}
                      </span>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <button
                    onClick={toggleTheme}
                    type="button"
                    className="flex items-center gap-2 text-xs text-white/50 hover:text-white"
                  >
                    {theme === 'light' ? (
                      <>
                        <Moon className="h-4 w-4" aria-hidden="true" />
                        <span>Dark Mode</span>
                      </>
                    ) : (
                      <>
                        <Sun className="h-4 w-4" aria-hidden="true" />
                        <span>Light Mode</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={logout}
                    type="button"
                    className="flex items-center gap-2 text-xs text-white/50 hover:text-red-400"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
      <CommandPalette />
    </div>
  );
}
