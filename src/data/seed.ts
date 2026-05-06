import type { Activity, Contact, Deal, Settings, Task, User } from '../types';

export const DEFAULT_STAGES = [
  { id: 'lead' as const,        label: 'Lead',        probability: 0.05 },
  { id: 'contacted' as const,   label: 'Contacted',   probability: 0.15 },
  { id: 'qualified' as const,   label: 'Qualified',   probability: 0.35 },
  { id: 'proposal' as const,    label: 'Proposal',    probability: 0.55 },
  { id: 'negotiation' as const, label: 'Negotiation', probability: 0.75 },
  { id: 'won' as const,         label: 'Won',         probability: 1.0, terminal: 'won' as const },
  { id: 'lost' as const,        label: 'Lost',        probability: 0.0, terminal: 'lost' as const },
];

export const SEED_USERS: User[] = [
  { uid: 'u_admin',   name: 'Alex Park',     email: 'admin@pipelineos.demo',   role: 'admin',   initials: 'AP', hue: 195 },
  { uid: 'u_manager', name: 'Maya Chen',     email: 'manager@pipelineos.demo', role: 'manager', initials: 'MC', hue: 280 },
  { uid: 'u_rep1',    name: 'Jordan Diaz',   email: 'rep@pipelineos.demo',     role: 'rep',     initials: 'JD', hue: 150, quota: 60000 },
  { uid: 'u_rep2',    name: 'Priya Shah',    email: 'priya@pipelineos.demo',   role: 'rep',     initials: 'PS', hue: 25,  quota: 60000 },
  { uid: 'u_rep3',    name: 'Sam Okafor',    email: 'sam@pipelineos.demo',     role: 'rep',     initials: 'SO', hue: 340, quota: 50000 },
];

const COMPANIES: { name: string; domain: string; emoji: string }[] = [
  { name: 'Northwind Logistics', domain: 'northwind.io',     emoji: '🚚' },
  { name: 'Helio Health',         domain: 'heliohealth.com',  emoji: '🩺' },
  { name: 'Vanta Robotics',       domain: 'vantarobotics.ai', emoji: '🤖' },
  { name: 'Cobalt Studios',       domain: 'cobaltstudios.co', emoji: '🎬' },
  { name: 'Meridian Bank',        domain: 'meridian.bank',    emoji: '🏦' },
  { name: 'Lumen Solar',          domain: 'lumensolar.energy',emoji: '☀️' },
  { name: 'Nimbus Security',      domain: 'nimbus.security',  emoji: '🛡️' },
  { name: 'Orchard Foods',        domain: 'orchardfoods.com', emoji: '🍎' },
  { name: 'Polar Analytics',      domain: 'polaranalytics.io',emoji: '📊' },
  { name: 'Quill & Co',           domain: 'quillco.com',      emoji: '📝' },
  { name: 'Rivet Manufacturing',  domain: 'rivet.industries', emoji: '🔩' },
  { name: 'Solstice Travel',      domain: 'solstice.travel',  emoji: '✈️' },
  { name: 'Tideline Media',       domain: 'tideline.media',   emoji: '🌊' },
  { name: 'Umbra Legal',          domain: 'umbralegal.com',   emoji: '⚖️' },
  { name: 'Vertex Climbing',      domain: 'vertexclimbing.co',emoji: '🧗' },
  { name: 'Willow Education',     domain: 'willowedu.org',    emoji: '📚' },
];

const CONTACT_NAMES = [
  ['Avery', 'Hughes', 'VP Operations'],
  ['Bridget', 'Lin', 'Head of RevOps'],
  ['Carlos', 'Mendez', 'Director of IT'],
  ['Dana', 'Petrov', 'COO'],
  ['Eli', 'Brooks', 'Procurement Lead'],
  ['Farah', 'Khan', 'Chief of Staff'],
  ['Gus', 'Nakamura', 'CFO'],
  ['Hana', 'Reyes', 'Founder'],
  ['Ivan', 'Sokolov', 'Head of Product'],
  ['Jules', 'Owen', 'VP Engineering'],
  ['Kara', 'Singh', 'CMO'],
  ['Leo', 'Hartwell', 'Director of Sales'],
  ['Maya', 'Adler', 'CTO'],
  ['Nico', 'Vasquez', 'VP Finance'],
  ['Omar', 'Diallo', 'Head of People'],
  ['Penny', 'Walsh', 'CEO'],
];

const SOURCES = ['Inbound — Website', 'Outbound', 'Referral', 'Conference: SaaStr', 'Partner: AWS', 'Cold email', 'LinkedIn'];

const DEAL_NAMES = [
  'Annual Platform License', 'Enterprise Expansion', 'Pilot — 25 seats', 'Multi-region rollout',
  'Q2 Renewal + Add-on', 'Security Tier Upgrade', 'POC — Data Connector', 'New BU Onboarding',
  'Premium Support Bundle', 'API Volume Tier', 'SSO + SCIM Add-on', 'Contract Renewal',
];

const NOTE_SAMPLES = [
  'Champion confirmed budget, pushed for procurement intro.',
  'Asked about SOC2 — sent the latest report.',
  'Demo went well; CFO has questions about pricing tiers.',
  'They want a 14-day pilot with read-only access first.',
  'Competing with Salesforce; differentiator is speed of onboarding.',
  'Legal review in flight, expect redlines next week.',
  'Confirmed signing authority sits with VP Ops.',
  'Decision pushed to next quarter due to hiring freeze.',
];

function rngFactory(seed: number) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xffffffff; };
}

function pick<T>(arr: T[], rnd: () => number): T { return arr[Math.floor(rnd() * arr.length)]; }
function initialsOf(first: string, last: string) { return (first[0] + last[0]).toUpperCase(); }

export function buildSeed(now: number = Date.now()) {
  const rnd = rngFactory(424242);

  const contacts: Contact[] = COMPANIES.flatMap((c, i) => {
    const n = 1 + Math.floor(rnd() * 2);
    const out: Contact[] = [];
    for (let k = 0; k < n; k++) {
      const [first, last, title] = CONTACT_NAMES[(i * 2 + k) % CONTACT_NAMES.length];
      out.push({
        id: `c_${c.domain.replace(/\W/g, '_')}_${k}`,
        name: `${first} ${last}`,
        title,
        email: `${first.toLowerCase()}.${last.toLowerCase()}@${c.domain}`,
        phone: `+1 (415) 555-${String(1000 + Math.floor(rnd() * 8999)).slice(0, 4)}`,
        company: c.name,
        initials: initialsOf(first, last),
      });
    }
    return out;
  });

  const reps = SEED_USERS.filter(u => u.role === 'rep');
  const stages = DEFAULT_STAGES.map(s => s.id);

  const deals: Deal[] = [];
  const activities: Activity[] = [];
  const NUM_DEALS = 36;

  for (let i = 0; i < NUM_DEALS; i++) {
    const company = COMPANIES[i % COMPANIES.length];
    const contact = contacts.find(c => c.company === company.name)!;
    const owner = reps[i % reps.length];
    // Distribute across stages with most in qualified/proposal/negotiation
    const stageWeights: [string, number][] = [
      ['lead', 5], ['contacted', 6], ['qualified', 8], ['proposal', 7], ['negotiation', 5], ['won', 3], ['lost', 2],
    ];
    let w = rnd() * stageWeights.reduce((s, [, x]) => s + x, 0);
    let stage: any = 'qualified';
    for (const [k, v] of stageWeights) { w -= v; if (w <= 0) { stage = k; break; } }

    const baseAmount = 5000 + Math.floor(rnd() * 95000);
    const amount = Math.round(baseAmount / 500) * 500;
    const createdAt = now - Math.floor(rnd() * 90) * 86400_000;
    const updatedAt = createdAt + Math.floor(rnd() * (now - createdAt));
    const closeDate = now + (Math.floor(rnd() * 90) - 15) * 86400_000;
    const closedAt = (stage === 'won' || stage === 'lost') ? updatedAt : undefined;

    const deal: Deal = {
      id: `d_${i.toString(36)}_${company.domain.split('.')[0]}`,
      name: `${company.name} · ${pick(DEAL_NAMES, rnd)}`,
      contactId: contact.id,
      companyName: company.name,
      amount,
      stage,
      ownerUid: owner.uid,
      source: pick(SOURCES, rnd),
      createdAt,
      updatedAt,
      closeDate,
      closedAt,
      order: createdAt + i,
    };
    deals.push(deal);

    // Activities
    activities.push({
      id: `a_${deal.id}_create`,
      dealId: deal.id,
      type: 'created',
      body: `Created deal · source: ${deal.source}`,
      authorUid: owner.uid,
      createdAt: createdAt,
    });
    const numActivities = 1 + Math.floor(rnd() * 5);
    for (let k = 0; k < numActivities; k++) {
      const t = createdAt + Math.floor(rnd() * (updatedAt - createdAt));
      const types: ActivityType[] = ['note', 'call', 'email', 'meeting'];
      const type = pick(types, rnd);
      let body = '';
      if (type === 'note') body = pick(NOTE_SAMPLES, rnd);
      else if (type === 'call') body = `Call with ${contact.name} — ${pick(['great fit', 'needs more info', 'looped in CFO', 'follow-up scheduled'], rnd)}.`;
      else if (type === 'email') body = `Sent ${pick(['pricing one-pager', 'security overview', 'mutual action plan', 'demo recording'], rnd)} to ${contact.name}.`;
      else body = `${pick(['Discovery', 'Demo', 'Pricing review', 'Procurement sync'], rnd)} with ${contact.company}.`;
      activities.push({ id: `a_${deal.id}_${k}`, dealId: deal.id, type, body, authorUid: owner.uid, createdAt: t });
    }
  }

  // Order deals within each stage
  const byStage: Record<string, Deal[]> = {};
  for (const s of stages) byStage[s] = [];
  for (const d of deals) byStage[d.stage].push(d);
  for (const s of stages) {
    byStage[s].sort((a, b) => b.updatedAt - a.updatedAt);
    byStage[s].forEach((d, i) => { d.order = (byStage[s].length - i) * 1000; });
  }

  // Tasks
  const tasks: Task[] = [];
  for (let i = 0; i < 12; i++) {
    const d = pick(deals.filter(x => x.stage !== 'won' && x.stage !== 'lost'), rnd);
    const owner = reps[i % reps.length];
    tasks.push({
      id: `t_${i}`,
      dealId: d.id,
      title: pick([
        `Follow up with ${d.companyName}`,
        `Send proposal to ${d.companyName}`,
        `Schedule demo — ${d.companyName}`,
        `Loop in legal on ${d.companyName} contract`,
        `Confirm pricing tier for ${d.companyName}`,
      ], rnd),
      dueAt: now + (Math.floor(rnd() * 14) - 3) * 86400_000,
      done: rnd() < 0.25,
      ownerUid: owner.uid,
      createdAt: now - Math.floor(rnd() * 7) * 86400_000,
    });
  }

  const settings: Settings = {
    stages: DEFAULT_STAGES,
    perms: {
      repsCanDeleteDeals: false,
      repsCanEditStages: false,
      managersCanInviteUsers: true,
    },
    company: { name: 'Acme SaaS Co.', domain: 'acmesaas.com', logoEmoji: '◢' },
  };

  return { users: SEED_USERS, contacts, deals, activities, tasks, settings };
}

type ActivityType = Activity['type'];
