import type { Metadata, Viewport } from 'next';
import './globals.css';
import Sidebar from '@/components/sidebar';
import AppShell from '@/components/app-shell';

export const metadata: Metadata = {
  title: 'Mission Control — Short Mountain Holiday',
  description: 'Operations dashboard for Short Mountain Holiday',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Mission Control',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#059669',
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
