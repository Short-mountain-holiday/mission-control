'use client';

import { useState, useEffect } from 'react';
import { Search, FileText, Clock, Folder } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface DocEntry {
  name: string;
  path: string;
  category: string;
  lastModified: string;
  size: number;
}

export default function DocsBrowser() {
  const [docs, setDocs] = useState<DocEntry[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<DocEntry | null>(null);
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  useEffect(() => {
    fetch('/api/docs')
      .then(r => r.json())
      .then(data => {
        if (data.docs) setDocs(data.docs);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const loadDoc = async (doc: DocEntry) => {
    setSelectedDoc(doc);
    setContentLoading(true);
    try {
      const res = await fetch(`/api/docs?path=${encodeURIComponent(doc.path)}`);
      const data = await res.json();
      setContent(data.content || '');
    } catch {
      setContent('Failed to load document');
    } finally {
      setContentLoading(false);
    }
  };

  const categories = ['All', ...Array.from(new Set(docs.map(d => d.category)))];

  const filteredDocs = docs.filter(d => {
    if (categoryFilter !== 'All' && d.category !== categoryFilter) return false;
    if (searchQuery && !d.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex gap-6 h-[calc(100vh-180px)]">
      {/* Left: Doc List */}
      <div className="w-80 shrink-0 flex flex-col bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl overflow-hidden">
        {/* Search */}
        <div className="p-3 border-b border-[var(--border-primary)]">
          <div className="relative">
            <Search className="w-4 h-4 text-[var(--text-tertiary)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search docs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-lg pl-9 pr-4 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
          {/* Category filters */}
          <div className="flex flex-wrap gap-1 mt-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={cn(
                  'px-2 py-0.5 rounded text-[10px] transition-colors',
                  categoryFilter === cat
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--bg-surface)] text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)]'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Doc List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-sm text-[var(--text-tertiary)]">
              Loading...
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-sm text-[var(--text-tertiary)]">
              No documents found
            </div>
          ) : (
            filteredDocs.map((doc) => (
              <button
                key={doc.path}
                onClick={() => loadDoc(doc)}
                className={cn(
                  'w-full text-left px-3 py-2.5 rounded-lg transition-colors',
                  selectedDoc?.path === doc.path
                    ? 'bg-[var(--bg-hover)]'
                    : 'hover:bg-[var(--bg-hover)]'
                )}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-[var(--text-tertiary)] shrink-0" />
                  <span className="text-sm text-[var(--text-primary)] truncate">{doc.name}</span>
                </div>
                <div className="flex items-center gap-2 mt-1 ml-5.5">
                  <span className="text-[10px] bg-[var(--bg-elevated)] text-[var(--text-tertiary)] px-1.5 py-0.5 rounded">{doc.category}</span>
                  <span className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {new Date(doc.lastModified).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right: Doc Content */}
      <div className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl overflow-hidden flex flex-col">
        {selectedDoc ? (
          <>
            <div className="px-6 py-4 border-b border-[var(--border-primary)] flex items-center justify-between">
              <div>
                <h2 className="text-sm font-medium">{selectedDoc.name}</h2>
                <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{selectedDoc.path}</p>
              </div>
              <span className="text-[10px] bg-[var(--bg-elevated)] text-[var(--text-tertiary)] px-2 py-0.5 rounded">{selectedDoc.category}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {contentLoading ? (
                <div className="flex items-center justify-center h-32 text-sm text-[var(--text-tertiary)]">
                  Loading...
                </div>
              ) : (
                <div className="markdown-content">
                  <ReactMarkdown>{content}</ReactMarkdown>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-[var(--text-tertiary)]">
            <Folder className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">Select a document to view</p>
          </div>
        )}
      </div>
    </div>
  );
}
