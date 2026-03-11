import type { Agent } from './types';

// Static agent definitions — this is our org chart
export const agents: Agent[] = [
  {
    name: 'Micah',
    role: 'Visionary',
    title: 'Founder & Owner',
    status: 'active',
    currentFocus: 'Strategy & direction',
    owns: ['Vision', 'Key decisions', 'Soundstripe advisory', 'Property operations'],
    avatar: 'M',
    color: 'bg-blue-500',
  },
  {
    name: 'Dru',
    role: 'Integrator / COO',
    title: 'Chief Operating Officer',
    status: 'active',
    currentFocus: 'Morning briefings, board accountability, coordination',
    owns: [
      'Morning briefings',
      'Board accountability',
      'Cross-functional coordination',
      'Status synthesis',
      'Follow-up & escalation',
      'L10 facilitation',
      'Rock tracking',
      'Quarterly planning',
    ],
    reportsTo: 'Micah',
    avatar: 'D',
    color: 'bg-emerald-500',
  },
  {
    name: 'Sloane',
    role: 'CMO',
    title: 'Chief Marketing Officer',
    status: 'active',
    currentFocus: 'Marketing strategy & content',
    owns: [
      'Marketing content',
      'Social strategy',
      'Campaigns',
      'Brand voice',
      'Email marketing',
      'Instagram',
    ],
    reportsTo: 'Dru',
    avatar: 'S',
    color: 'bg-purple-500',
  },
  {
    name: 'Reid',
    role: 'CIFO',
    title: 'Chief Intelligence & Financial Officer',
    status: 'parked',
    currentFocus: 'Parked — awaiting activation',
    owns: [
      'Pricing strategy',
      'Revenue analysis',
      'Data intelligence',
      'Financial reporting',
      'Analytics',
    ],
    reportsTo: 'Dru',
    avatar: 'R',
    color: 'bg-amber-500',
  },
  {
    name: 'Willow',
    role: 'Guest Comms',
    title: 'Guest Communications Manager',
    status: 'parked',
    currentFocus: 'Parked — awaiting activation',
    owns: [
      'Pre-booking inquiries',
      'Check-in/out messaging',
      'In-stay support',
      'Guest experience',
    ],
    reportsTo: 'Dru',
    avatar: 'W',
    color: 'bg-rose-500',
  },
];

export const missionStatement = `Build Short Mountain Holiday into a self-sustaining luxury retreat business — designed so well it eventually runs without Micah. AI agents carry the operational load. Systems replace manual effort. Revenue grows while time freedom increases.`;

export function getAgent(name: string): Agent | undefined {
  return agents.find(a => a.name.toLowerCase() === name.toLowerCase());
}
