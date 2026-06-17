import {
  FileQuestion,
  Settings2,
  Check,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from 'lucide-react';
import { type ReactNode, useState, useEffect, useRef } from 'react';

import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface DataTableColumn<T> {
  key: string;
  header: string | ReactNode;
  className?: string;
  render: (row: T) => ReactNode;
  sortable?: boolean;
  onSort?: (direction: 'asc' | 'desc') => void;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  keyField: (row: T) => string;
  isLoading?: boolean;
  emptyMessage?: string;
  emptyState?: ReactNode;
  sortKey?: string;
  sortDir?: 'asc' | 'desc';
}

export function DataTable<T>({
  columns,
  rows,
  keyField,
  isLoading = false,
  emptyMessage = 'No records found',
  emptyState,
  sortKey,
  sortDir,
}: DataTableProps<T>) {
  const [visibleKeys, setVisibleKeys] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize visible columns
  useEffect(() => {
    setVisibleKeys(columns.map((c) => c.key));
  }, [columns]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const toggleColumn = (key: string) => {
    setVisibleKeys((prev) => {
      if (prev.includes(key)) {
        // Prevent hiding the last column
        const withHeader = columns.filter(
          (c) => c.header && c.key !== 'actions',
        );
        const visibleWithHeader = prev.filter(
          (k) => k !== key && withHeader.some((c) => c.key === k),
        );
        if (visibleWithHeader.length === 0) return prev; // keep at least one column with content
        return prev.filter((k) => k !== key);
      } else {
        return [...prev, key];
      }
    });
  };

  const visibleColumns = columns.filter(
    (col) => visibleKeys.includes(col.key) || col.key === 'actions',
  );

  const toggleableColumns = columns.filter(
    (col) => col.header && col.key !== 'actions',
  );

  const columnCount = visibleColumns.length;

  return (
    <div className="space-y-2">
      {/* Table toolbar for toggling column visibility */}
      {toggleableColumns.length > 0 && (
        <div className="flex justify-end px-4 pt-3">
          <div ref={dropdownRef} className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              type="button"
              className="flex items-center gap-1.5 text-xs font-medium"
            >
              <Settings2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Columns</span>
            </Button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-1 z-30 w-48 rounded-md border border-border bg-surface p-1 shadow-md animate-in fade-in slide-in-from-top-1 duration-100">
                <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
                  Toggle Columns
                </p>
                <div className="h-px bg-border/60 my-1" />
                <div className="space-y-0.5">
                  {toggleableColumns.map((col) => {
                    const isVisible = visibleKeys.includes(col.key);
                    return (
                      <button
                        key={col.key}
                        onClick={() => toggleColumn(col.key)}
                        type="button"
                        className="flex items-center justify-between w-full text-left px-2 py-1.5 text-xs rounded hover:bg-neutral-50 dark:hover:bg-neutral-800/40 text-text-secondary hover:text-text-primary transition-colors"
                      >
                        <span>{col.header}</span>
                        {isVisible && (
                          <Check
                            className="h-3.5 w-3.5 text-brand-600 shrink-0"
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse table-auto">
          <thead>
            <tr className="border-b border-neutral-200 dark:border-neutral-800 text-[11px] font-medium uppercase tracking-wider text-text-tertiary bg-neutral-50 dark:bg-neutral-900/50">
              {visibleColumns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-text-tertiary text-left',
                    col.className,
                  )}
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => {
                        const nextDir =
                          sortKey === col.key && sortDir === 'asc'
                            ? 'desc'
                            : 'asc';
                        col.onSort?.(nextDir);
                      }}
                      className="inline-flex items-center gap-1 hover:text-text-primary transition-colors focus:outline-none"
                    >
                      <span>{col.header}</span>
                      {sortKey === col.key ? (
                        sortDir === 'asc' ? (
                          <ChevronUp className="h-3.5 w-3.5 text-brand-600" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 text-brand-600" />
                        )
                      ) : (
                        <ChevronsUpDown className="h-3.5 w-3.5 text-neutral-300 dark:text-neutral-700" />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, rowIndex) => (
                <tr
                  key={`skeleton-row-${rowIndex}`}
                  className="h-[42px] border-b border-neutral-100 dark:border-neutral-900 last:border-0"
                >
                  {visibleColumns.map((col, colIndex) => {
                    const widthClass =
                      colIndex === 0
                        ? 'w-[75%]'
                        : colIndex === visibleColumns.length - 1
                          ? 'w-[50%]'
                          : colIndex % 3 === 0
                            ? 'w-[60%]'
                            : colIndex % 3 === 1
                              ? 'w-[85%]'
                              : 'w-[45%]';
                    return (
                      <td
                        key={`skeleton-col-${colIndex}`}
                        className="px-4 py-3 align-middle"
                      >
                        <Skeleton
                          className={cn('h-3.5 rounded-sm', widthClass)}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : !rows.length ? (
              <tr>
                <td colSpan={columnCount} className="px-4 py-16 text-center">
                  {emptyState ? (
                    emptyState
                  ) : (
                    <EmptyState
                      icon={FileQuestion}
                      title="No data available"
                      description={emptyMessage}
                    />
                  )}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={keyField(row)}
                  className="border-b border-neutral-100 dark:border-neutral-900 last:border-0 transition-colors hover:bg-neutral-50/60 dark:hover:bg-neutral-800/20"
                >
                  {visibleColumns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-4 py-3 text-sm text-text-primary align-middle',
                        col.className,
                      )}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
