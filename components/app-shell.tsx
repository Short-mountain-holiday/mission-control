'use client';

import { usePathname } from 'next/navigation';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === '/login';

  if (isLogin) {
    return <>{children}</>;
  }

  return (
    <main className="md:ml-60 min-h-screen pt-14 md:pt-0">
      {children}
    </main>
  );
}
