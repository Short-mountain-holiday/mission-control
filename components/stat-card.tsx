import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  accent?: string;
}

export default function StatCard({ label, value, icon: Icon, trend, trendUp, accent }: StatCardProps) {
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-xl p-5 hover:border-[var(--border-secondary)] transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className={cn(
          'w-9 h-9 rounded-lg flex items-center justify-center',
          accent || 'bg-[var(--bg-elevated)]'
        )}>
          <Icon className="w-4.5 h-4.5 text-[var(--text-secondary)]" />
        </div>
        {trend && (
          <span className={cn(
            'text-xs font-medium px-2 py-0.5 rounded-full',
            trendUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
          )}>
            {trend}
          </span>
        )}
      </div>
      <div className="text-2xl font-semibold tracking-tight">{value}</div>
      <div className="text-xs text-[var(--text-tertiary)] mt-1">{label}</div>
    </div>
  );
}
