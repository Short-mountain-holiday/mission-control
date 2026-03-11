import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/sidebar';
import AppShell from '@/components/app-shell';

export const metadata: Metadata = {
  title: 'Mission Control — Short Mountain Holiday',
  description: 'SMH Operations Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <Sidebar />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
