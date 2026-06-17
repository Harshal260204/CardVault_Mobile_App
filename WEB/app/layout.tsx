import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';

import { Providers } from '@/components/providers';

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CardVault Admin',
  description: 'Super admin and manager console',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
