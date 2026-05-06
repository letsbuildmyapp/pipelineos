import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Activity, Contact, Deal, Settings, Stage, StageId, Task, User } from '../types';
import { buildSeed, DEFAULT_STAGES } from '../data/seed';

interface DataState {
  hydrated: boolean;
  users: User[];
  contacts: Contact[];
  deals: Deal[];
  activities: Activity[];
  tasks: Task[];
  settings: Settings;
  // mutators
  reseed: () => void;
  upsertDeal: (d: Deal) => void;
  updateDeal: (id: string, patch: Partial<Deal>, authorUid?: string) => void;
  deleteDeal: (id: string) => void;
  moveDeal: (id: string, stage: StageId, order: number, authorUid?: string) => void;
  addActivity: (a: Omit<Activity, 'id' | 'createdAt'> & { createdAt?: number }) => void;
  addTask: (t: Omit<Task, 'id' | 'createdAt'>) => Task;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  upsertContact: (c: Contact) => void;
  setSettings: (patch: Partial<Settings>) => void;
  setStages: (stages: Stage[]) => void;
  upsertUser: (u: User) => void;
  removeUser: (uid: string) => void;
}

const initial = buildSeed();

export const useData = create<DataState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      users: initial.users,
      contacts: initial.contacts,
      deals: initial.deals,
      activities: initial.activities,
      tasks: initial.tasks,
      settings: initial.settings,

      reseed: () => {
        const fresh = buildSeed();
        set({ ...fresh, hydrated: true });
      },

      upsertDeal: (d) => set((s) => {
        const exists = s.deals.find((x) => x.id === d.id);
        return { deals: exists ? s.deals.map((x) => x.id === d.id ? d : x) : [d, ...s.deals] };
      }),

      updateDeal: (id, patch, authorUid) => set((s) => {
        const before = s.deals.find((d) => d.id === id);
        if (!before) return {};
        const after = { ...before, ...patch, updatedAt: Date.now() };
        const newActivities = [...s.activities];
        if (patch.stage && patch.stage !== before.stage) {
          newActivities.unshift({
            id: `a_${id}_${Date.now()}`,
            dealId: id,
            type: 'stage_change',
            body: `Stage changed: ${before.stage} → ${patch.stage}`,
            authorUid: authorUid ?? before.ownerUid,
            createdAt: Date.now(),
          });
          if (patch.stage === 'won' || patch.stage === 'lost') after.closedAt = Date.now();
          else after.closedAt = undefined;
        }
        return {
          deals: s.deals.map((d) => d.id === id ? after : d),
          activities: newActivities,
        };
      }),

      deleteDeal: (id) => set((s) => ({
        deals: s.deals.filter((d) => d.id !== id),
        activities: s.activities.filter((a) => a.dealId !== id),
        tasks: s.tasks.filter((t) => t.dealId !== id),
      })),

      moveDeal: (id, stage, order, authorUid) => {
        get().updateDeal(id, { stage, order }, authorUid);
      },

      addActivity: (a) => set((s) => ({
        activities: [{ id: `a_${a.dealId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, createdAt: a.createdAt ?? Date.now(), ...a }, ...s.activities],
      })),

      addTask: (t) => {
        const task: Task = { id: `t_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, createdAt: Date.now(), ...t };
        set((s) => ({ tasks: [task, ...s.tasks] }));
        return task;
      },

      toggleTask: (id) => set((s) => ({
        tasks: s.tasks.map((t) => t.id === id ? { ...t, done: !t.done } : t),
      })),

      deleteTask: (id) => set((s) => ({
        tasks: s.tasks.filter((t) => t.id !== id),
      })),

      upsertContact: (c) => set((s) => {
        const exists = s.contacts.find((x) => x.id === c.id);
        return { contacts: exists ? s.contacts.map((x) => x.id === c.id ? c : x) : [c, ...s.contacts] };
      }),

      setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      setStages: (stages) => set((s) => ({ settings: { ...s.settings, stages } })),

      upsertUser: (u) => set((s) => {
        const exists = s.users.find((x) => x.uid === u.uid);
        return { users: exists ? s.users.map((x) => x.uid === u.uid ? u : x) : [u, ...s.users] };
      }),

      removeUser: (uid) => set((s) => ({ users: s.users.filter((u) => u.uid !== uid) })),
    }),
    {
      name: 'pipelineos:data:v1',
      onRehydrateStorage: () => (state) => { if (state) state.hydrated = true; },
    },
  ),
);

export function getStages(s: Settings): Stage[] {
  return s.stages?.length ? s.stages : DEFAULT_STAGES;
}
