import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Trash2, Phone, Mail, Calendar, MessageSquare, FileText, CheckSquare, Square, Plus } from 'lucide-react';
import { useAuth } from '../store/auth';
import { useData, getStages } from '../store/data';
import { fmtMoney, fmtRelative, fmtDate } from '../lib/format';
import { Avatar } from '../components/Avatar';
import { useConfirm } from '../components/ConfirmDialog';
import { toast } from 'sonner';
import type { ActivityType, StageId } from '../types';
import { cn } from '../lib/cn';

export function DealDetail() {
  const { id } = useParams<{ id: string }>();
  const auth = useAuth();
  const data = useData();
  const nav = useNavigate();
  const confirm = useConfirm();
  const stages = getStages(data.settings);
  const deal = data.deals.find((d) => d.id === id);

  const [tab, setTab] = useState<'activity' | 'tasks' | 'details'>('activity');
  const [noteType, setNoteType] = useState<ActivityType>('note');
  const [noteBody, setNoteBody] = useState('');
  const [newTask, setNewTask] = useState('');

  const owner = data.users.find((u) => u.uid === deal?.ownerUid);
  const contact = data.contacts.find((c) => c.id === deal?.contactId);
  const activities = useMemo(() => deal ? data.activities.filter((a) => a.dealId === deal.id).sort((a, b) => b.createdAt - a.createdAt) : [], [data.activities, deal]);
  const tasks = useMemo(() => deal ? data.tasks.filter((t) => t.dealId === deal.id).sort((a, b) => +a.done - +b.done || a.dueAt - b.dueAt) : [], [data.tasks, deal]);

  if (!deal) {
    return (
      <div className="p-12 text-center">
        <p className="text-fg-muted">Deal not found.</p>
        <Link to="/app/deals" className="btn-ghost mt-4 inline-flex">Back to deals</Link>
      </div>
    );
  }

  const role = auth.user?.role;
  const canDelete = role === 'admin' || (role === 'manager') || (role === 'rep' && data.settings.perms.repsCanDeleteDeals && deal.ownerUid === auth.user?.uid);
  const dealId = deal.id;
  const dealName = deal.name;

  const changeStage = (stage: StageId) => {
    if (stage === deal.stage) return;
    data.updateDeal(dealId, { stage }, auth.user?.uid);
    toast.success(`Stage → ${stages.find((s) => s.id === stage)?.label}`);
  };

  const addNote = () => {
    if (!noteBody.trim() || !auth.user) return;
    data.addActivity({ dealId, type: noteType, body: noteBody.trim(), authorUid: auth.user.uid });
    setNoteBody('');
    toast.success('Logged');
  };

  const addNewTask = () => {
    if (!newTask.trim() || !auth.user) return;
    data.addTask({
      dealId,
      title: newTask.trim(),
      dueAt: Date.now() + 3 * 86400_000,
      done: false,
      ownerUid: auth.user.uid,
    });
    setNewTask('');
    toast.success('Task added');
  };

  const onDelete = async () => {
    if (!(await confirm({ title: 'Delete this deal?', message: `${dealName} will be permanently removed, along with its activities and tasks.`, confirmLabel: 'Delete deal', destructive: true }))) return;
    data.deleteDeal(dealId);
    toast.success('Deal deleted');
    nav('/app/deals');
  };

  return (
    <div>
      <header className="border-b border-line bg-bg-panel">
        <div className="px-6 lg:px-8 pt-5 pb-5">
          <Link to="/app/deals" className="inline-flex items-center gap-1.5 text-xs text-fg-muted hover:text-fg">
            <ArrowLeft size={13} /> Deals
          </Link>
          <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-[24px] leading-[30px] font-semibold tracking-tight">{deal.name}</h1>
              <p className="text-sm text-fg-muted mt-1">{deal.companyName} · {deal.source}</p>
            </div>
            <div className="flex items-center gap-2">
              {canDelete && (
                <button onClick={onDelete} className="btn-ghost text-sm h-9 text-danger hover:bg-danger/10">
                  <Trash2 size={14} /> Delete
                </button>
              )}
            </div>
          </div>

          {/* Stage stepper */}
          <div className="mt-6 flex items-center gap-1.5 overflow-x-auto pb-1">
            {stages.filter((s) => !s.terminal || s.terminal === 'won' || s.id === deal.stage).map((s) => {
              const isCurrent = deal.stage === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => changeStage(s.id)}
                  className={cn(
                    'h-8 px-3 rounded-md text-xs font-medium whitespace-nowrap transition-colors border',
                    isCurrent
                      ? 'bg-accent text-[rgb(var(--accent-fg))] border-accent'
                      : 'border-line text-fg-muted hover:bg-bg-hover hover:text-fg',
                  )}
                >
                  {s.label}
                </button>
              );
            })}
            {!stages.filter((s) => s.terminal === 'lost').some((s) => s.id === deal.stage) && (
              <button
                onClick={() => changeStage('lost')}
                className="h-8 px-3 rounded-md text-xs font-medium border border-line text-fg-subtle hover:bg-danger/10 hover:text-danger transition-colors whitespace-nowrap"
              >
                Mark Lost
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="px-6 lg:px-8 py-6 grid lg:grid-cols-[1fr_320px] gap-6">
        {/* Main: tabs */}
        <div>
          <div className="flex items-center gap-1 border-b border-line">
            {(['activity', 'tasks', 'details'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  'h-10 px-3.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                  tab === t ? 'border-accent text-fg' : 'border-transparent text-fg-muted hover:text-fg',
                )}
              >
                {t === 'activity' ? 'Activity' : t === 'tasks' ? `Tasks · ${tasks.length}` : 'Details'}
              </button>
            ))}
          </div>

          {tab === 'activity' && (
            <div className="mt-5">
              <div className="card p-4">
                <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                  {([
                    { id: 'note', label: 'Note', icon: FileText },
                    { id: 'call', label: 'Call', icon: Phone },
                    { id: 'email', label: 'Email', icon: Mail },
                    { id: 'meeting', label: 'Meeting', icon: Calendar },
                  ] as const).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setNoteType(t.id)}
                      className={cn(
                        'h-8 px-2.5 rounded-md text-xs font-medium inline-flex items-center gap-1.5 transition-colors border',
                        noteType === t.id ? 'bg-accent/15 text-accent border-accent/40' : 'border-line text-fg-muted hover:text-fg hover:bg-bg-hover',
                      )}
                    >
                      <t.icon size={12} /> {t.label}
                    </button>
                  ))}
                </div>
                <textarea
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                  rows={3}
                  placeholder={noteType === 'note' ? 'Log a note…' : `Log a ${noteType}…`}
                  className="input min-h-[88px] resize-y py-2"
                />
                <div className="mt-3 flex justify-end">
                  <button onClick={addNote} disabled={!noteBody.trim()} className="btn-primary text-sm h-9 px-4">Log {noteType}</button>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {activities.length === 0 ? (
                  <p className="text-sm text-fg-subtle text-center py-8">No activity yet.</p>
                ) : activities.map((a) => {
                  const author = data.users.find((u) => u.uid === a.authorUid);
                  return (
                    <div key={a.id} className="flex gap-3">
                      <div className="pt-0.5"><ActivityIcon type={a.type} /></div>
                      <div className="flex-1 min-w-0 pb-3 border-b border-line last:border-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Avatar user={author} size={18} />
                          <span className="text-[13px] font-medium">{author?.name}</span>
                          <span className="text-[11px] uppercase tracking-wider text-fg-subtle font-medium">{a.type === 'stage_change' ? 'Stage' : a.type === 'created' ? 'Created' : a.type}</span>
                          <span className="text-[12px] text-fg-subtle ml-auto tabular-nums">{fmtRelative(a.createdAt)}</span>
                        </div>
                        <p className="text-[14px] text-fg-muted mt-1.5 leading-relaxed">{a.body}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'tasks' && (
            <div className="mt-5">
              <div className="card p-4">
                <div className="flex items-center gap-2">
                  <input
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') addNewTask(); }}
                    className="input flex-1"
                    placeholder="Add a task…"
                  />
                  <button onClick={addNewTask} disabled={!newTask.trim()} className="btn-primary text-sm h-10 px-3">
                    <Plus size={14} /> Add
                  </button>
                </div>
              </div>
              <ul className="mt-4 divide-y divide-line card overflow-hidden">
                {tasks.length === 0 && <li className="p-6 text-sm text-fg-subtle text-center">No tasks for this deal.</li>}
                {tasks.map((t) => {
                  const overdue = !t.done && t.dueAt < Date.now();
                  return (
                    <li key={t.id} className="flex items-center gap-3 px-4 h-12">
                      <button onClick={() => data.toggleTask(t.id)} className="text-fg-muted hover:text-accent" aria-label="Toggle task">
                        {t.done ? <CheckSquare size={16} className="text-accent" /> : <Square size={16} />}
                      </button>
                      <span className={cn('flex-1 text-[14px] truncate', t.done && 'line-through text-fg-subtle')}>{t.title}</span>
                      <span className={cn('text-[12px] tabular-nums', overdue ? 'text-danger' : 'text-fg-subtle')}>
                        {fmtRelative(t.dueAt)}
                      </span>
                      <button onClick={() => data.deleteTask(t.id)} className="text-fg-subtle hover:text-danger" aria-label="Delete task">
                        <Trash2 size={14} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {tab === 'details' && (
            <div className="mt-5 card divide-y divide-line">
              <DetailRow label="Amount" value={fmtMoney(deal.amount)} />
              <DetailRow label="Source" value={deal.source} />
              <DetailRow label="Owner" value={owner?.name ?? '—'} />
              <DetailRow label="Created" value={fmtDate(deal.createdAt)} />
              <DetailRow label="Expected close" value={fmtDate(deal.closeDate)} />
              {deal.closedAt && <DetailRow label={deal.stage === 'won' ? 'Won on' : 'Closed on'} value={fmtDate(deal.closedAt)} />}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-6 self-start">
          <div className="card p-5">
            <p className="label mb-2">Amount</p>
            <p className="text-[28px] leading-[34px] font-semibold tabular-nums tracking-tight">{fmtMoney(deal.amount)}</p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Mini label="Stage" value={stages.find((s) => s.id === deal.stage)?.label ?? ''} />
              <Mini label="Owner" value={owner?.name.split(' ')[0] ?? '—'} />
              <Mini label="Close" value={fmtDate(deal.closeDate)} />
              <Mini label="Updated" value={fmtRelative(deal.updatedAt)} />
            </div>
          </div>

          {contact && (
            <div className="card p-5">
              <p className="label mb-3">Primary contact</p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-md bg-bg-subtle border border-line grid place-items-center font-semibold text-[13px]">
                  {contact.initials}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{contact.name}</div>
                  <div className="text-[12px] text-fg-subtle truncate">{contact.title || contact.company}</div>
                </div>
              </div>
              <div className="mt-4 space-y-1.5 text-[13px]">
                <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-fg-muted hover:text-accent">
                  <Mail size={13} /> <span className="truncate">{contact.email}</span>
                </a>
                {contact.phone && (
                  <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-fg-muted hover:text-accent">
                    <Phone size={13} /> <span className="tabular-nums">{contact.phone}</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3 grid grid-cols-[140px_1fr] gap-3 items-center">
      <span className="text-[12px] uppercase tracking-wider text-fg-subtle font-medium">{label}</span>
      <span className="text-[14px]">{value}</span>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-fg-subtle">{label}</div>
      <div className="text-[13px] font-medium mt-0.5">{value}</div>
    </div>
  );
}

function ActivityIcon({ type }: { type: ActivityType }) {
  const cls = 'h-7 w-7 rounded-md grid place-items-center border';
  switch (type) {
    case 'call':         return <div className={cn(cls, 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400')}><Phone size={13} /></div>;
    case 'email':        return <div className={cn(cls, 'bg-blue-500/10 border-blue-500/30 text-blue-400')}><Mail size={13} /></div>;
    case 'meeting':      return <div className={cn(cls, 'bg-violet-500/10 border-violet-500/30 text-violet-400')}><Calendar size={13} /></div>;
    case 'note':         return <div className={cn(cls, 'bg-bg-subtle border-line text-fg-muted')}><MessageSquare size={13} /></div>;
    case 'stage_change': return <div className={cn(cls, 'bg-accent/15 border-accent/30 text-accent')}><FileText size={13} /></div>;
    default:             return <div className={cn(cls, 'bg-bg-subtle border-line text-fg-muted')}><Plus size={13} /></div>;
  }
}
