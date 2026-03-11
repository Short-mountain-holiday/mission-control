import { Brain } from 'lucide-react';
import MemoryBrowser from './memory-browser';

export default function MemoryPage() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2.5">
          <Brain className="w-6 h-6 text-[var(--accent)]" />
          Memory
        </h1>
        <p className="text-sm text-[var(--text-tertiary)] mt-1">
          Daily logs and curated long-term memory
        </p>
      </div>

      <MemoryBrowser />
    </div>
  );
}
