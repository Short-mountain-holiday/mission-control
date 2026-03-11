import { Users, Crown, ArrowDown } from 'lucide-react';
import { agents, missionStatement } from '@/lib/agents';
import { cn } from '@/lib/utils';

export default function TeamPage() {
  const visionary = agents.find(a => a.role === 'Visionary');
  const integrator = agents.find(a => a.name === 'Dru');
  const domainAgents = agents.filter(a => a.reportsTo === 'Dru');

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2.5">
          <Users className="w-6 h-6 text-[var(--accent)]" />
          Team
        </h1>
        <p className="text-sm text-[var(--text-tertiary)] mt-1">
          SMH organizational structure & agent roles
        </p>
      </div>

      {/* Mission Statement */}
      <div className="bg-gradient-to-br from-[var(--accent)]/10 to-emerald-500/5 border border-[var(--accent)]/20 rounded-xl p-6 mb-10">
        <div className="flex items-center gap-2 mb-3">
          <Crown className="w-4 h-4 text-[var(--accent)]" />
          <span className="text-xs font-medium text-[var(--accent)] uppercase tracking-wider">Mission Statement</span>
        </div>
        <p className="text-sm text-[var(--text-primary)] leading-relaxed">{missionStatement}</p>
      </div>

      {/* Org Chart */}
      <div className="flex flex-col items-center gap-6">
        {/* Visionary */}
        {visionary && (
          <AgentCard agent={visionary} tier="visionary" />
        )}

        <div className="flex items-center justify-center">
          <ArrowDown className="w-5 h-5 text-[var(--border-secondary)]" />
        </div>

        {/* Integrator */}
        {integrator && (
          <AgentCard agent={integrator} tier="integrator" />
        )}

        <div className="flex items-center justify-center">
          <ArrowDown className="w-5 h-5 text-[var(--border-secondary)]" />
        </div>

        {/* Domain Agents */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          {domainAgents.map((agent) => (
            <AgentCard key={agent.name} agent={agent} tier="domain" />
          ))}
        </div>
      </div>

      {/* EOS Legend */}
      <div className="mt-12 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-5">
        <h3 className="text-sm font-medium mb-3">EOS Accountability Chart</h3>
        <div className="grid grid-cols-2 gap-3 text-xs text-[var(--text-secondary)]">
          <div><span className="text-blue-400 font-medium">Visionary</span> — Sets the direction, big decisions, external relationships</div>
          <div><span className="text-emerald-400 font-medium">Integrator</span> — Runs the operating system, coordinates team, accountability</div>
          <div><span className="text-purple-400 font-medium">CMO</span> — Marketing content, social strategy, campaigns, brand voice</div>
          <div><span className="text-amber-400 font-medium">CIFO</span> — Revenue analysis, pricing strategy, financial intelligence</div>
          <div><span className="text-rose-400 font-medium">Guest Comms</span> — Pre-booking through post-stay guest communication</div>
          <div className="text-[var(--text-tertiary)]"><span className="font-medium">Future Roles</span> — Operations Agent, additional specialists as SMH scales</div>
        </div>
      </div>
    </div>
  );
}

function AgentCard({ agent, tier }: { agent: typeof agents[0]; tier: 'visionary' | 'integrator' | 'domain' }) {
  const tierStyles = {
    visionary: 'border-blue-500/30 bg-blue-500/5',
    integrator: 'border-emerald-500/30 bg-emerald-500/5',
    domain: 'border-[var(--border-primary)] bg-[var(--bg-surface)]',
  };

  return (
    <div className={cn(
      'border rounded-xl p-5 w-full transition-colors hover:border-[var(--border-secondary)]',
      tierStyles[tier],
      agent.status === 'parked' && 'opacity-60'
    )}>
      <div className="flex items-start gap-4">
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center text-lg font-semibold text-white shrink-0',
          agent.color
        )}>
          {agent.avatar}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base font-semibold">{agent.name}</span>
            <span className={cn(
              'text-[10px] px-2 py-0.5 rounded-full font-medium',
              agent.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' :
              agent.status === 'parked' ? 'bg-zinc-500/10 text-zinc-400' :
              'bg-amber-500/10 text-amber-400'
            )}>
              {agent.status}
            </span>
          </div>
          <div className="text-xs text-[var(--accent)] font-medium mb-2">{agent.role} — {agent.title}</div>
          {agent.currentFocus && (
            <div className="text-xs text-[var(--text-tertiary)] mb-3">{agent.currentFocus}</div>
          )}
          <div className="flex flex-wrap gap-1.5">
            {agent.owns.map((item) => (
              <span
                key={item}
                className="text-[10px] bg-[var(--bg-elevated)] text-[var(--text-secondary)] px-2 py-0.5 rounded"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
