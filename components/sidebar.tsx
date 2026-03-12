'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Columns3,
  FolderKanban,
  Calendar,
  Users,
  Brain,
  FileText,
  Building2,
  Mountain,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/command-center', label: 'Command Center', icon: Columns3 },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/team', label: 'Team', icon: Users },
  { href: '/memory', label: 'Memory', icon: Brain },
  { href: '/docs', label: 'Docs', icon: FileText },
  { href: '/office', label: 'The Office', icon: Building2 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Don't render sidebar on login page
  if (pathname === '/login') return null;

  const handleLogout = async () => {
    try {
      await fetch('/api/auth', { method: 'DELETE' });
    } catch {
      // Cookie clear failed — navigate to login anyway so the user can re-auth
    }
    router.push('/login');
    router.refresh();
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <>
      {/* Mobile Top Bar - shows only on mobile */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center">
            <Mountain className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-sm text-[var(--text-primary)]">Mission Control</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
        >
          <Menu className="w-5 h-5 text-[var(--text-primary)]" />
        </button>
      </div>

      {/* Mobile Drawer - slides in from left */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 bg-black/60 z-50"
            onClick={closeMobileMenu}
          />
          
          {/* Drawer */}
          <aside className="md:hidden fixed left-0 top-0 bottom-0 w-72 bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] flex flex-col z-50">
            {/* Logo / Brand */}
            <div className="h-14 flex items-center justify-between px-5 border-b border-[var(--border-primary)]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center">
                  <Mountain className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="font-semibold text-sm text-[var(--text-primary)]">Mission Control</span>
                  <span className="block text-[10px] text-[var(--text-tertiary)] -mt-0.5 tracking-wide">SHORT MOUNTAIN HOLIDAY</span>
                </div>
              </div>
              <button
                onClick={closeMobileMenu}
                className="p-1.5 rounded-md hover:bg-[var(--bg-hover)] transition-colors"
              >
                <X className="w-5 h-5 text-[var(--text-tertiary)]" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-3 space-y-0.5">
              {navItems.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== '/' && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobileMenu}
                    className={cn(
                      'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors min-h-[44px]',
                      isActive
                        ? 'bg-[var(--bg-hover)] text-[var(--text-primary)]'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                    )}
                  >
                    <Icon className={cn('w-4 h-4', isActive && 'text-[var(--accent)]')} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-[var(--border-primary)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-medium text-white">
                    D
                  </div>
                  <div>
                    <div className="text-xs font-medium text-[var(--text-primary)]">Dru</div>
                    <div className="text-[10px] text-[var(--text-tertiary)]">COO • Online</div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-md hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] min-h-[44px] min-w-[44px]"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* Desktop Sidebar - hidden on mobile */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-60 bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] flex-col z-50">
        {/* Logo / Brand */}
        <div className="h-14 flex items-center gap-2.5 px-5 border-b border-[var(--border-primary)]">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center">
            <Mountain className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-semibold text-sm text-[var(--text-primary)]">Mission Control</span>
            <span className="block text-[10px] text-[var(--text-tertiary)] -mt-0.5 tracking-wide">SHORT MOUNTAIN HOLIDAY</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-[var(--bg-hover)] text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                )}
              >
                <Icon className={cn('w-4 h-4', isActive && 'text-[var(--accent)]')} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[var(--border-primary)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-medium text-white">
                D
              </div>
              <div>
                <div className="text-xs font-medium text-[var(--text-primary)]">Dru</div>
                <div className="text-[10px] text-[var(--text-tertiary)]">COO • Online</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-md hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
