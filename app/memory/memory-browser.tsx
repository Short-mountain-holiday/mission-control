'use client';

import { useState, useEffect } from 'react';
import { Calendar, BookOpen, Search, ChevronLeft, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

type Tab = 'daily' | 'longterm';

export default function MemoryBrowser() {
  const [tab, setTab] = useState<Tab>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch available memory dates
  useEffect(() => {
    fetch('/api/memory')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        if (data.dates && data.dates.length > 0) {
          setAvailableDates(data.dates);
        } else if (data.error) {
          setError(data.error);
        }
      })
      .catch(() => {
        setError('Failed to load memory index');
      });
  }, []);

  // Fetch content when tab or date changes
  useEffect(() => {
    setLoading(true);
    setError(null);

    const url = tab === 'longterm'
      ? '/api/memory?type=longterm'
      : `/api/memory?date=${selectedDate}`;

    fetch(url)
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
          setContent('');
        } else {
          setContent(data.content || '');
        }
      })
      .catch(() => {
        setError('Failed to load memory');
        setContent('');
      })
      .finally(() => setLoading(false));
  }, [tab, selectedDate]);

  const navigateDate = (direction: -1 | 1) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + direction);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const filteredContent = searchQuery && content
    ? content.split('\n').filter(line =>
        line.toLowerCase().includes(searchQuery.toLowerCase())
      ).join('\n')
    : content;

  return (
    <div className="flex flex-col gap-6">
      {/* Tabs + Controls - stack on mobile, row on desktop */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-1 bg-[var(--bg-surface)] rounded-lg p-1">
          <button
            onClick={() => setTab('daily')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors',
              tab === 'daily' ? 'bg-[var(--bg-hover)] text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'
            )}
          >
            <Calendar className="w-3.5 h-3.5" />
            Daily Logs
          </button>
          <button
            onClick={() => setTab('longterm')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors',
              tab === 'longterm' ? 'bg-[var(--bg-hover)] text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'
            )}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Long-Term Memory
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-auto">
          <Search className="w-4 h-4 text-[var(--text-tertiary)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search memories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-lg pl-9 pr-4 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] w-full md:w-64 focus:outline-none focus:border-[var(--accent)]"
          />
        </div>
      </div>

      {/* Date Navigator (daily only) */}
      {tab === 'daily' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigateDate(-1)}
              className="w-8 h-8 min-w-[2rem] rounded-lg flex items-center justify-center hover:bg-[var(--bg-hover)] transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-[var(--text-tertiary)]" />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-lg px-3 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] flex-1"
            />
            <button
              onClick={() => navigateDate(1)}
              className="w-8 h-8 min-w-[2rem] rounded-lg flex items-center justify-center hover:bg-[var(--bg-hover)] transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
            </button>
          </div>

          {/* Date chips - horizontal scroll */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
            {availableDates.slice(-7).reverse().map(date => (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={cn(
                  'px-2.5 py-1 rounded-md text-xs whitespace-nowrap transition-colors',
                  selectedDate === date
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--bg-surface)] text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)]'
                )}
              >
                {new Date(date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl min-h-[500px]">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-sm text-[var(--text-tertiary)]">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" />
            Loading...
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 text-sm text-[var(--text-tertiary)]">
            <AlertCircle className="w-8 h-8 mb-3 text-amber-400" />
            <p>{error}</p>
            {tab === 'daily' && (
              <p className="text-xs mt-2">No memory log found for this date</p>
            )}
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-1.5 px-3 py-1.5 mt-4 rounded-lg text-xs bg-[var(--bg-hover)] hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        ) : content ? (
          <div className="p-6 markdown-content">
            <ReactMarkdown>{searchQuery ? filteredContent : content}</ReactMarkdown>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-sm text-[var(--text-tertiary)]">
            No content available
          </div>
        )}
      </div>
    </div>
  );
}
