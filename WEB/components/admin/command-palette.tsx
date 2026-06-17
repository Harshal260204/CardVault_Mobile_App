'use client';

import {
  Search,
  LayoutDashboard,
  Contact,
  Users,
  Shield,
  Download,
  BarChart3,
  Building2,
  CalendarDays,
  CreditCard,
  Sun,
  Moon,
  LogOut,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

import { isPlatformSuperAdmin } from '@/lib/roles';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { useThemeStore } from '@/stores/theme-store';

interface CommandItem {
  id: string;
  title: string;
  category: string;
  icon: React.ElementType;
  action: () => void;
}

export function CommandPalette() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const isSuperAdmin = isPlatformSuperAdmin(useAuthStore((s) => s.user?.role));
  const logout = useAuthStore((s) => s.logout);
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Toggle palette on Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSearch('');
      setSelectedIndex(0);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const commands: CommandItem[] = [
    {
      id: 'dashboard',
      title: 'Go to Dashboard',
      category: 'Navigation',
      icon: LayoutDashboard,
      action: () => router.push('/admin/dashboard'),
    },
    {
      id: 'analytics',
      title: 'Go to Analytics',
      category: 'Navigation',
      icon: BarChart3,
      action: () => router.push('/admin/analytics'),
    },
    {
      id: 'contacts',
      title: 'Go to Contacts',
      category: 'Navigation',
      icon: Contact,
      action: () => router.push('/admin/contacts'),
    },
    {
      id: 'sessions',
      title: 'Go to Sessions',
      category: 'Navigation',
      icon: CalendarDays,
      action: () => router.push('/admin/sessions'),
    },
    {
      id: 'users',
      title: 'Go to Users',
      category: 'Navigation',
      icon: Users,
      action: () => router.push('/admin/users'),
    },
    {
      id: 'audit-log',
      title: 'Go to Audit Log',
      category: 'Navigation',
      icon: Shield,
      action: () => router.push('/admin/audit-log'),
    },
    {
      id: 'export',
      title: 'Go to Export Center',
      category: 'Navigation',
      icon: Download,
      action: () => router.push('/admin/export'),
    },
    {
      id: 'billing',
      title: 'Go to Billing',
      category: 'Navigation',
      icon: CreditCard,
      action: () => router.push('/admin/billing'),
    },
    {
      id: 'theme',
      title: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`,
      category: 'Preferences',
      icon: theme === 'dark' ? Sun : Moon,
      action: () => toggleTheme(),
    },
    {
      id: 'logout',
      title: 'Sign Out',
      category: 'Account',
      icon: LogOut,
      action: () => {
        logout();
        router.push('/login');
      },
    },
  ];

  const filteredCommands = commands.filter(
    (cmd) =>
      cmd.title.toLowerCase().includes(search.toLowerCase()) ||
      cmd.category.toLowerCase().includes(search.toLowerCase()),
  );

  // Navigate with keyboard keys
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(
        (prev) =>
          (prev - 1 + filteredCommands.length) % filteredCommands.length,
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
        setIsOpen(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-[3px] z-[9999] flex items-start justify-center pt-[15vh] p-4 transition-opacity duration-200">
      <div
        ref={containerRef}
        className="bg-surface border border-border shadow-modal rounded-xl w-full max-w-lg overflow-hidden flex flex-col scale-[1.01] transition-transform duration-200"
        onKeyDown={handleKeyDown}
      >
        {/* Search header */}
        <div className="p-4 border-b border-border/80 flex items-center gap-3">
          <Search
            className="h-4.5 w-4.5 text-text-tertiary shrink-0"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            className="bg-transparent text-sm w-full outline-none text-text-primary placeholder:text-text-tertiary"
          />
          <kbd className="text-[10px] font-semibold text-text-tertiary border border-border px-1.5 py-0.5 rounded bg-zinc-50 dark:bg-zinc-800/50 uppercase tracking-widest shrink-0">
            Esc
          </kbd>
        </div>

        {/* Command list */}
        <div className="max-h-[320px] overflow-y-auto p-2 space-y-1">
          {filteredCommands.length > 0 ? (
            filteredCommands.map((cmd, index) => {
              const Icon = cmd.icon;
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={() => {
                    cmd.action();
                    setIsOpen(false);
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    'flex items-center justify-between px-3 py-2 text-sm rounded-md cursor-pointer transition-colors duration-100',
                    isSelected
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-text-primary font-medium'
                      : 'text-text-secondary hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className="h-4 w-4 shrink-0 text-text-tertiary"
                      aria-hidden="true"
                    />
                    <span>{cmd.title}</span>
                  </div>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
                    {cmd.category}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="py-6 text-center text-sm text-text-tertiary">
              No results found for &ldquo;{search}&rdquo;
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="border-t border-border/80 px-4 py-2.5 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between text-[11px] text-text-tertiary">
          <div className="flex items-center gap-2">
            <span>Navigation:</span>
            <kbd className="border border-border/80 px-1 py-0.2 rounded bg-surface">
              ↑↓
            </kbd>
            <span>Select:</span>
            <kbd className="border border-border/80 px-1 py-0.2 rounded bg-surface">
              Enter
            </kbd>
          </div>
          <span>⌘K or Ctrl+K to toggle</span>
        </div>
      </div>
    </div>
  );
}
