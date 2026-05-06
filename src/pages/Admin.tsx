import { useState } from 'react';
import { Plus, Trash2, RefreshCw, Edit2, Check, X } from 'lucide-react';
import { useData } from '../store/data';
import { useAuth } from '../store/auth';
import { useConfirm } from '../components/ConfirmDialog';
import { Avatar } from '../components/Avatar';
import { toast } from 'sonner';
import type { Role, Stage, User } from '../types';
import { cn } from '../lib/cn';

export function Admin() {
  const data = useData();
  const auth = useAuth();
  const confirm = useConfirm();

  const [tab, setTab] = useState<'users' | 'stages' | 'permissions'>('users');

  // New user form
  const [nuName, setNuName] = useState('');
  const [nuEmail, setNuEmail] = useState('');
  const [nuRole, setNuRole] = useState<Role>('rep');
  const [nuQuota, setNuQuota] = useState('50000');

  function addUser() {
    if (!nuName.trim() || !nuEmail.trim()) { toast.error('Name and email are required'); return; }
    const initials = nuName.trim().split(/\s+/).slice(0, 2).map((s) => s[0]).join('').toUpperCase();
    const u: User = {
      uid: `u_${Date.now().toString(36)}`,
      name: nuName.trim(),
      email: nuEmail.trim().toLowerCase(),
      role: nuRole,
      initials,
      hue: Math.floor(Math.random() * 360),
      quota: nuRole === 'rep' ? Number(nuQuota) || undefined : undefined,
    };
    data.upsertUser(u);
    setNuName(''); setNuEmail(''); setNuRole('rep'); setNuQuota('50000');
    toast.success(`${u.name} added`);
  }

  async function removeUser(u: User) {
    if (u.uid === auth.user?.uid) { toast.error("You can't remove your own account."); return; }
    if (!(await confirm({ title: `Remove ${u.name}?`, message: `Their deals stay in the system but become unowned. This cannot be undone.`, confirmLabel: 'Remove user', destructive: true }))) return;
    data.removeUser(u.uid);
    toast.success(`${u.name} removed`);
  }

  async function reseed() {
    if (!(await confirm({ title: 'Reseed demo data?', message: 'This wipes your local edits and restores the original demo data.', confirmLabel: 'Reseed', destructive: true }))) return;
    data.reseed();
    toast.success('Demo data reseeded');
  }

  return (
    <div>
      <header className="border-b border-line bg-bg-panel">
        <div className="px-6 lg:px-8 pt-6 pb-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="label">Admin</p>
              <h1 className="text-[28px] leading-[34px] font-semibold tracking-tight mt-1">Workspace settings</h1>
            </div>
            <button onClick={reseed} className="btn-outline text-sm h-9">
              <RefreshCw size={14} /> Reseed demo data
            </button>
          </div>
          <div className="mt-5 flex items-center gap-1 border-b border-line -mb-5">
            {(['users', 'stages', 'permissions'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  'h-10 px-3.5 text-sm font-medium border-b-2 -mb-px transition-colors capitalize',
                  tab === t ? 'border-accent text-fg' : 'border-transparent text-fg-muted hover:text-fg',
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="px-6 lg:px-8 py-6">
        {tab === 'users' && (
          <div className="space-y-4">
            <div className="card p-5">
              <p className="label mb-4">Invite user</p>
              <div className="grid sm:grid-cols-[1fr_1fr_140px_140px_auto] gap-3">
                <input className="input" placeholder="Full name" value={nuName} onChange={(e) => setNuName(e.target.value)} />
                <input className="input" placeholder="email@company.com" value={nuEmail} onChange={(e) => setNuEmail(e.target.value)} />
                <select className="input" value={nuRole} onChange={(e) => setNuRole(e.target.value as Role)}>
                  <option value="rep">Rep</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
                <input className="input tabular-nums" type="number" min={0} step={1000} value={nuQuota} onChange={(e) => setNuQuota(e.target.value)} disabled={nuRole !== 'rep'} placeholder="Quota" />
                <button onClick={addUser} className="btn-primary text-sm h-10"><Plus size={14} /> Add</button>
              </div>
            </div>

            <div className="card overflow-hidden">
              <div className="px-5 h-11 border-b border-line flex items-center"><p className="label">Users · {data.users.length}</p></div>
              <ul className="divide-y divide-line">
                {data.users.map((u) => (
                  <li key={u.uid} className="px-5 py-3 flex items-center gap-4">
                    <Avatar user={u} size={32} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] font-medium truncate">{u.name}</div>
                      <div className="text-[12px] text-fg-subtle truncate">{u.email}</div>
                    </div>
                    <span className="chip border border-line bg-bg-subtle text-fg-muted">{u.role}</span>
                    {u.role === 'rep' && (
                      <span className="text-[12px] text-fg-muted tabular-nums hidden sm:inline">
                        ${(u.quota ?? 0).toLocaleString()} quota
                      </span>
                    )}
                    <button
                      onClick={() => removeUser(u)}
                      disabled={u.uid === auth.user?.uid}
                      className="text-fg-subtle hover:text-danger disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Remove user"
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {tab === 'stages' && <StagesEditor />}

        {tab === 'permissions' && (
          <div className="card divide-y divide-line max-w-2xl">
            <PermRow
              title="Reps can delete deals"
              description="When off, only managers and admins can delete deals (recommended)."
              checked={data.settings.perms.repsCanDeleteDeals}
              onChange={(v) => data.setSettings({ perms: { ...data.settings.perms, repsCanDeleteDeals: v } })}
            />
            <PermRow
              title="Reps can edit pipeline stages"
              description="Lets reps add or rename stages on the workspace level."
              checked={data.settings.perms.repsCanEditStages}
              onChange={(v) => data.setSettings({ perms: { ...data.settings.perms, repsCanEditStages: v } })}
            />
            <PermRow
              title="Managers can invite users"
              description="When off, only admins can invite or remove users."
              checked={data.settings.perms.managersCanInviteUsers}
              onChange={(v) => data.setSettings({ perms: { ...data.settings.perms, managersCanInviteUsers: v } })}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function PermRow({ title, description, checked, onChange }: { title: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="px-5 py-4 flex items-start justify-between gap-6">
      <div className="min-w-0">
        <p className="text-[14px] font-medium">{title}</p>
        <p className="text-[12px] text-fg-muted mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        role="switch"
        aria-checked={checked}
        className={cn(
          'shrink-0 h-6 w-10 rounded-full relative transition-colors',
          checked ? 'bg-accent' : 'bg-line-strong',
        )}
      >
        <span className={cn(
          'absolute top-0.5 left-0.5 h-5 w-5 bg-white rounded-full shadow-sm transition-transform',
          checked && 'translate-x-4',
        )} />
      </button>
    </div>
  );
}

function StagesEditor() {
  const data = useData();
  const stages = data.settings.stages;
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ label: string; probability: string }>({ label: '', probability: '0' });

  function startEdit(s: Stage) {
    setEditing(s.id);
    setDraft({ label: s.label, probability: String(s.probability) });
  }

  function save(s: Stage) {
    const prob = Math.max(0, Math.min(1, Number(draft.probability)));
    const next = stages.map((x) => x.id === s.id ? { ...x, label: draft.label.trim() || s.label, probability: prob } : x);
    data.setStages(next);
    setEditing(null);
    toast.success('Stage updated');
  }

  return (
    <div className="card overflow-hidden max-w-2xl">
      <div className="px-5 h-11 border-b border-line flex items-center justify-between">
        <p className="label">Pipeline stages</p>
        <span className="text-[12px] text-fg-subtle">Probability feeds the weighted forecast</span>
      </div>
      <ul className="divide-y divide-line">
        {stages.map((s) => {
          const isEditing = editing === s.id;
          return (
            <li key={s.id} className="px-5 py-3 flex items-center gap-4">
              <span className="font-mono text-[12px] text-fg-subtle w-20">{s.id}</span>
              {isEditing ? (
                <>
                  <input className="input flex-1 max-w-[180px]" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
                  <input className="input w-20 tabular-nums" type="number" min={0} max={1} step={0.05} value={draft.probability} onChange={(e) => setDraft({ ...draft, probability: e.target.value })} />
                  <button onClick={() => save(s)} className="text-success p-1.5 rounded hover:bg-bg-hover" aria-label="Save"><Check size={15} /></button>
                  <button onClick={() => setEditing(null)} className="text-fg-subtle p-1.5 rounded hover:bg-bg-hover" aria-label="Cancel"><X size={15} /></button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-[14px] font-medium">{s.label}</span>
                  <span className="text-[13px] tabular-nums text-fg-muted w-16 text-right">{(s.probability * 100).toFixed(0)}%</span>
                  {s.terminal && <span className="chip border border-line bg-bg-subtle text-fg-subtle">{s.terminal}</span>}
                  <button onClick={() => startEdit(s)} className="text-fg-subtle hover:text-fg p-1.5 rounded hover:bg-bg-hover" aria-label="Edit"><Edit2 size={14} /></button>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
