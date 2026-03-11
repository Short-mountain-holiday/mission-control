'use client';

import { useState, FormEvent } from 'react';
import { Mountain, Lock, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push('/');
        router.refresh();
      } else if (res.status === 429) {
        setError('Too many attempts. Try again in a few minutes.');
        triggerShake();
      } else {
        setError('Incorrect password');
        triggerShake();
      }
    } catch {
      setError('Connection error');
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
      <div className="w-full max-w-sm px-6">
        {/* Branding */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center mx-auto mb-4">
            <Mountain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Mission Control</h1>
          <p className="text-xs text-[var(--text-tertiary)] mt-1 tracking-wide uppercase">
            Short Mountain Holiday
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div
            className={`relative mb-4 transition-transform ${
              shake ? 'animate-[shake_0.5s_ease-in-out]' : ''
            }`}
          >
            <Lock className="w-4 h-4 text-[var(--text-tertiary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoFocus
              autoComplete="current-password"
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl pl-10 pr-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 mb-4 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Checking...
              </>
            ) : (
              'Enter'
            )}
          </button>
        </form>
      </div>

      {/* Shake animation */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}
