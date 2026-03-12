'use client';

import { useState, useEffect } from 'react';
import { Calendar, BookOpen, Search, ChevronLeft, ChevronRight, AlertCircle, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

type Tab = 'daily' | 'longterm';

export default function MemoryBrowser() {
  const [tab, setTab] = useState<Tab>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<any>(null);
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [isGatewayError, setIsGatewayError] = useState(false);

  // Fetch available memory dates
  useEffect(() => {
    fetch('/api/memory')
      .then(r => {
        if (r.status === 503) {
          setIsGatewayError(true);
          return r.json();
        }
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        if (data.dates && data.dates.length > 0) {
          setAvailableDates(data.dates);
        } else if (data.gatewayError || data.hint) {
          setIsGatewayError(true);
          setError('Gateway connection unavailable');
          setErrorDetails(data);
        } else if (data.error) {
          setError(data.error);
          setErrorDetails(data);
        }
      })
      .catch((err) => {
        setIsGatewayError(true);
        setError('Gateway connection unavailable');
        setErrorDetails({ message: err.message });
      });
  }, []);

  // Fetch content when tab or date changes
  useEffect(() => {
    setLoading(true);
    setError(null);
    setErrorDetails(null);

    const url = tab === 'longterm'
      ? '/api/memory?type=longterm'
      : `/api/memory?date=${selectedDate}`;

    fetch(url)
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
          setErrorDetails(data);
          setContent('');
        } else {
          setContent(data.content || '');
        }
      })
      .catch((err) => {
        setError('Failed to load memory');
        setErrorDetails({ message: err.message });
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
        ) : error && isGatewayError ? (
          <div className="p-8 max-w-2xl mx-auto">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-amber-400 mb-2">Memory Requires Gateway Connection</h3>
                  <p className="text-sm text-[var(--text-secondary)] mb-4">
                    The Memory screen connects to the agent's workspace on the OpenClaw gateway to retrieve daily logs and long-term memory files. 
                    The gateway appears to be unreachable from this environment.
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)] mb-4">
                    This is a connectivity issue, not a bug. Memory data lives in the workspace filesystem and requires gateway access.
                  </p>
                  
                  {/* Retry button */}
                  <button
                    onClick={() => window.location.reload()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 transition-colors font-medium mb-4"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Retry Connection
                  </button>

                  {/* Collapsible error details */}
                  {errorDetails && (
                    <div className="mt-4 border-t border-amber-500/20 pt-4">
                      <button
                        onClick={() => setShowErrorDetails(!showErrorDetails)}
                        className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors"
                      >
                        {showErrorDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        {showErrorDetails ? 'Hide' : 'Show'} Error Details
                      </button>
                      {showErrorDetails && (
                        <pre className="mt-2 p-3 bg-[var(--bg-elevated)] rounded-lg text-xs text-[var(--text-tertiary)] overflow-x-auto">
                          {JSON.stringify(errorDetails, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
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
