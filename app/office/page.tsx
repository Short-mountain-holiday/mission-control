'use client';

import { useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgentState {
  name: string;
  role: string;
  status: 'working' | 'idle' | 'offline';
  color: string;
  initial: string;
  focus?: string;
  x: number;
  y: number;
}

const AGENTS: AgentState[] = [
  { name: 'Micah', role: 'Visionary', status: 'idle', color: '#3b82f6', initial: 'M', focus: 'Strategy & direction', x: 80, y: 60 },
  { name: 'Dru', role: 'COO', status: 'working', color: '#22c55e', initial: 'D', focus: 'Running operations', x: 320, y: 160 },
  { name: 'Sloane', role: 'CMO', status: 'idle', color: '#a855f7', initial: 'S', focus: 'Marketing strategy', x: 120, y: 320 },
  { name: 'Reid', role: 'CIFO', status: 'offline', color: '#f59e0b', initial: 'R', focus: 'Parked', x: 320, y: 320 },
  { name: 'Willow', role: 'Guest Comms', status: 'offline', color: '#f43f5e', initial: 'W', focus: 'Parked', x: 520, y: 320 },
];

const TZ = 'America/Chicago';

function isBusinessHours(): boolean {
  const hour = parseInt(new Date().toLocaleString('en-US', { timeZone: TZ, hour: 'numeric', hour12: false }), 10);
  return hour >= 8 && hour < 18;
}

function getTimezoneAbbr(): string {
  try {
    return new Date().toLocaleString('en-US', { timeZone: TZ, timeZoneName: 'short' }).split(' ').pop() || 'CT';
  } catch {
    return 'CT';
  }
}

function Desk({ x, y, occupied }: { x: number; y: number; occupied: boolean }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Desk surface */}
      <rect
        x={-30} y={-15} width={60} height={35} rx={4}
        fill="#27272a" stroke="#3f3f46" strokeWidth={1.5}
      />
      {/* Monitor */}
      <rect
        x={-12} y={-25} width={24} height={14} rx={2}
        fill={occupied ? '#18181b' : '#111113'}
        stroke={occupied ? '#3f3f46' : '#27272a'}
        strokeWidth={1}
      />
      {/* Monitor stand */}
      <rect x={-2} y={-11} width={4} height={4} fill="#27272a" />
      {/* Screen glow when occupied */}
      {occupied && (
        <rect
          x={-10} y={-23} width={20} height={10} rx={1}
          fill="#6366f1" opacity={0.15}
        />
      )}
    </g>
  );
}

function AgentSprite({ agent, hoveredAgent, onHover }: {
  agent: AgentState;
  hoveredAgent: string | null;
  onHover: (name: string | null) => void;
}) {
  const isHovered = hoveredAgent === agent.name;
  const isWorking = agent.status === 'working';
  const isOffline = agent.status === 'offline';

  return (
    <g
      transform={`translate(${agent.x}, ${agent.y})`}
      onMouseEnter={() => onHover(agent.name)}
      onMouseLeave={() => onHover(null)}
      className="cursor-pointer"
    >
      {/* Chair */}
      <ellipse cx={0} cy={28} rx={14} ry={5} fill="#1e1e22" opacity={0.6} />

      {/* Body */}
      <rect
        x={-10} y={8} width={20} height={18} rx={4}
        fill={isOffline ? '#27272a' : agent.color}
        opacity={isOffline ? 0.4 : 0.8}
      />

      {/* Head */}
      <circle
        cx={0} cy={0} r={12}
        fill={isOffline ? '#27272a' : agent.color}
        opacity={isOffline ? 0.4 : 1}
      />

      {/* Initial */}
      <text
        x={0} y={5} textAnchor="middle"
        fill="white" fontSize={12} fontWeight={600}
        opacity={isOffline ? 0.4 : 1}
      >
        {agent.initial}
      </text>

      {/* Working indicator - typing dots */}
      {isWorking && (
        <g transform="translate(0, -22)">
          <circle cx={-6} cy={0} r={2} fill={agent.color}>
            <animate attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite" begin="0s" />
          </circle>
          <circle cx={0} cy={0} r={2} fill={agent.color}>
            <animate attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite" begin="0.2s" />
          </circle>
          <circle cx={6} cy={0} r={2} fill={agent.color}>
            <animate attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite" begin="0.4s" />
          </circle>
        </g>
      )}

      {/* Status ring */}
      <circle
        cx={0} cy={0} r={14}
        fill="none"
        stroke={isWorking ? agent.color : isOffline ? '#3f3f46' : '#71717a'}
        strokeWidth={isHovered ? 2.5 : 1.5}
        strokeDasharray={isWorking ? 'none' : '4 3'}
        opacity={isHovered ? 1 : 0.6}
      >
        {isWorking && (
          <animate attributeName="stroke-opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />
        )}
      </circle>

      {/* Tooltip on hover */}
      {isHovered && (
        <g transform="translate(0, -42)">
          <rect x={-60} y={-20} width={120} height={36} rx={6} fill="#18181b" stroke="#3f3f46" strokeWidth={1} />
          <text x={0} y={-6} textAnchor="middle" fill="#fafafa" fontSize={10} fontWeight={600}>
            {agent.name} — {agent.role}
          </text>
          <text x={0} y={7} textAnchor="middle" fill="#a1a1aa" fontSize={9}>
            {agent.focus || agent.status}
          </text>
        </g>
      )}
    </g>
  );
}

export default function OfficePage() {
  const [agents, setAgents] = useState(AGENTS);
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState('');

  // Update Micah's status based on business hours
  useEffect(() => {
    const updateStatus = () => {
      setAgents(prev => prev.map(a => {
        if (a.name === 'Micah') {
          return { ...a, status: isBusinessHours() ? 'idle' : 'offline' as const };
        }
        return a;
      }));

      // Update clock
      const now = new Date();
      const cdtTime = now.toLocaleString('en-US', {
        timeZone: TZ,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      setCurrentTime(cdtTime + ' ' + getTimezoneAbbr());
    };

    updateStatus();
    const interval = setInterval(updateStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  // Try to get live session data
  useEffect(() => {
    const controller = new AbortController();

    const checkSessions = async () => {
      try {
        const res = await fetch('/api/cron', { signal: controller.signal });
        if (res.ok) {
          setAgents(prev => prev.map(a =>
            a.name === 'Dru' ? { ...a, status: 'working' as const, focus: 'Running operations' } : a
          ));
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setAgents(prev => prev.map(a =>
          a.name === 'Dru' ? { ...a, status: 'idle' as const, focus: 'Gateway unreachable' } : a
        ));
      }
    };

    checkSessions();
    const interval = setInterval(checkSessions, 30000);
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, []);

  const working = agents.filter(a => a.status === 'working').length;
  const idle = agents.filter(a => a.status === 'idle').length;
  const offline = agents.filter(a => a.status === 'offline').length;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-[var(--accent)]" />
            The Office
          </h1>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">
            SMH team at work
          </p>
        </div>
        <div className="flex items-center gap-4">
          {currentTime && (
            <span className="text-xs text-[var(--text-tertiary)]">{currentTime}</span>
          )}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-[var(--text-secondary)]">{working} working</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-zinc-400" />
              <span className="text-xs text-[var(--text-secondary)]">{idle} idle</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-zinc-600" />
              <span className="text-xs text-[var(--text-secondary)]">{offline} offline</span>
            </div>
          </div>
        </div>
      </div>

      {/* Office Floor */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl p-6 overflow-hidden">
        <svg
          viewBox="0 0 700 450"
          className="w-full max-w-4xl mx-auto"
          style={{ minHeight: 400 }}
        >
          {/* Floor */}
          <rect x={0} y={0} width={700} height={450} rx={12} fill="#0a0a0b" />

          {/* Grid pattern */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#18181b" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="700" height="450" fill="url(#grid)" rx={12} />

          {/* Room labels */}
          <text x={80} y={30} fill="#3f3f46" fontSize={10} fontWeight={500} textAnchor="middle">
            CORNER OFFICE
          </text>
          <text x={320} y={130} fill="#3f3f46" fontSize={10} fontWeight={500} textAnchor="middle">
            OPS CENTER
          </text>
          <text x={320} y={290} fill="#3f3f46" fontSize={10} fontWeight={500} textAnchor="middle">
            DOMAIN AGENTS
          </text>

          {/* Room dividers */}
          <line x1={200} y1={10} x2={200} y2={240} stroke="#1e1e22" strokeWidth={2} strokeDasharray="6 4" />
          <line x1={10} y1={260} x2={690} y2={260} stroke="#1e1e22" strokeWidth={2} strokeDasharray="6 4" />

          {/* Water cooler area */}
          <g transform="translate(600, 80)">
            <rect x={-15} y={-10} width={30} height={35} rx={4} fill="#18181b" stroke="#27272a" strokeWidth={1} />
            <text x={0} y={40} textAnchor="middle" fill="#27272a" fontSize={8}>☕</text>
          </g>

          {/* Conference room */}
          <g transform="translate(550, 190)">
            <rect x={-50} y={-30} width={100} height={60} rx={6} fill="none" stroke="#1e1e22" strokeWidth={1.5} strokeDasharray="4 3" />
            <ellipse cx={0} cy={0} rx={30} ry={15} fill="#111113" stroke="#1e1e22" strokeWidth={1} />
            <text x={0} y={45} textAnchor="middle" fill="#27272a" fontSize={8}>CONF ROOM</text>
          </g>

          {/* Desks */}
          <Desk x={80} y={100} occupied={agents[0]?.status !== 'offline'} />
          <Desk x={320} y={200} occupied={agents[1]?.status !== 'offline'} />
          <Desk x={120} y={360} occupied={agents[2]?.status !== 'offline'} />
          <Desk x={320} y={360} occupied={agents[3]?.status !== 'offline'} />
          <Desk x={520} y={360} occupied={agents[4]?.status !== 'offline'} />

          {/* Agent Sprites */}
          {agents.map((agent) => (
            <AgentSprite
              key={agent.name}
              agent={agent}
              hoveredAgent={hoveredAgent}
              onHover={setHoveredAgent}
            />
          ))}
        </svg>
      </div>

      {/* Agent Status Cards */}
      <div className="grid grid-cols-5 gap-3 mt-6">
        {agents.map((agent) => (
          <div
            key={agent.name}
            className={cn(
              'bg-[var(--bg-secondary)] border rounded-xl p-4 transition-colors',
              agent.status === 'working'
                ? 'border-emerald-500/30'
                : agent.status === 'idle'
                ? 'border-[var(--border-primary)]'
                : 'border-[var(--border-primary)] opacity-50'
            )}
          >
            <div className="flex items-center gap-2.5 mb-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                style={{ backgroundColor: agent.color }}
              >
                {agent.initial}
              </div>
              <div>
                <div className="text-sm font-medium text-[var(--text-primary)]">{agent.name}</div>
                <div className="text-[10px] text-[var(--text-tertiary)]">{agent.role}</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  agent.status === 'working' ? 'bg-emerald-400 animate-pulse'
                    : agent.status === 'idle' ? 'bg-zinc-400'
                    : 'bg-zinc-600'
                )}
              />
              <span className="text-[10px] text-[var(--text-tertiary)] capitalize">{agent.status}</span>
              {agent.focus && (
                <span className="text-[10px] text-[var(--text-tertiary)]"> • {agent.focus}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
