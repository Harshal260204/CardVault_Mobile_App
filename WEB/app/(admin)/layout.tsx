import { AdminDrawer } from '@/components/layout/admin-drawer';

import type { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminDrawer>{children}</AdminDrawer>;
}
