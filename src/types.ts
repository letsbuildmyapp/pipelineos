export type Role = 'rep' | 'manager' | 'admin';

export type StageId = 'lead' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';

export interface Stage {
  id: StageId;
  label: string;
  /** Win probability used by the weighted forecast. 1 = won, 0 = lost. */
  probability: number;
  /** terminal stages are not part of the open pipeline */
  terminal?: 'won' | 'lost';
}

export interface User {
  uid: string;
  name: string;
  email: string;
  role: Role;
  initials: string;
  /** Hue used for avatar background, 0–360 */
  hue: number;
  quota?: number; // monthly quota for reps
}

export interface Company {
  name: string;
  domain: string;
  logoEmoji: string;
}

export interface Contact {
  id: string;
  name: string;
  title: string;
  email: string;
  phone?: string;
  company: string; // company name
  initials: string;
}

export interface Deal {
  id: string;
  name: string;
  contactId: string;
  companyName: string;
  amount: number; // ARR USD
  stage: StageId;
  ownerUid: string;
  source: string;
  createdAt: number;
  updatedAt: number;
  closeDate: number; // expected close
  closedAt?: number;
  order: number; // for kanban ordering within a stage
  notes?: string;
}

export type ActivityType = 'note' | 'call' | 'email' | 'meeting' | 'stage_change' | 'created';

export interface Activity {
  id: string;
  dealId: string;
  type: ActivityType;
  body: string;
  authorUid: string;
  createdAt: number;
}

export interface Task {
  id: string;
  dealId?: string;
  title: string;
  dueAt: number;
  done: boolean;
  ownerUid: string;
  createdAt: number;
}

export interface Settings {
  /** Custom stage list (replaces defaults if set) */
  stages: Stage[];
  /** Permission toggles */
  perms: {
    repsCanDeleteDeals: boolean;
    repsCanEditStages: boolean;
    managersCanInviteUsers: boolean;
  };
  company: Company;
}
