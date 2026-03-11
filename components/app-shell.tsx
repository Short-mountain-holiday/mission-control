'use client';

import { usePathname } from 'next/navigation';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === '/login';

  if (isLogin) {
    return <>{children}</>;
  }

  return (
    <main className="ml-60 min-h-screen">
      {children}
    </main>
  );
}
