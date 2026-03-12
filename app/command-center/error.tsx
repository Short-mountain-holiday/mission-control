'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function CommandCenterError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 max-w-md text-center">
        <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
          Command Center Unavailable
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          Could not load task data from Notion. Check your API key or try again.
        </p>
        <button
          onClick={reset}
          className="flex items-center gap-2 mx-auto px-4 py-2 rounded-lg text-sm bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white transition-colors font-medium"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    </div>
  );
}
