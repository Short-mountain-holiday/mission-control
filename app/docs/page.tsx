import { FileText } from 'lucide-react';
import DocsBrowser from './docs-browser';

export default function DocsPage() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2.5">
          <FileText className="w-6 h-6 text-[var(--accent)]" />
          Documents
        </h1>
        <p className="text-sm text-[var(--text-tertiary)] mt-1">
          Agent-created documents, plans, and SOPs
        </p>
      </div>

      <DocsBrowser />
    </div>
  );
}
