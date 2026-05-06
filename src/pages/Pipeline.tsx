import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Filter } from 'lucide-react';
import { useAuth } from '../store/auth';
import { useData, getStages } from '../store/data';
import { fmtMoney, fmtRelative } from '../lib/format';
import { Avatar } from '../components/Avatar';
import { toast } from 'sonner';
import { cn } from '../lib/cn';
import type { Deal, StageId } from '../types';

export function Pipeline({ onNewDeal }: { onNewDeal: () => void }) {
  const auth = useAuth();
  const data = useData();
  const nav = useNavigate();
  const stages = getStages(data.settings);
  const role = auth.user?.role;

  const reps = data.users.filter((u) => u.role === 'rep');
  const [repFilter, setRepFilter] = useState<string>('all');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetCol, setDropTargetCol] = useState<StageId | null>(null);
  const [dropIndicator, setDropIndicator] = useState<{ col: StageId; before: string | null } | null>(null);

  const visibleDeals = useMemo(() => {
    let list = data.deals;
    if (role === 'rep' && auth.user) list = list.filter((d) => d.ownerUid === auth.user!.uid);
    if (repFilter !== 'all') list = list.filter((d) => d.ownerUid === repFilter);
    return list;
  }, [data.deals, role, auth.user, repFilter]);

  const grouped = useMemo(() => {
    const out: Record<StageId, Deal[]> = {} as any;
    for (const s of stages) out[s.id] = [];
    for (const d of visibleDeals) (out[d.stage] ??= []).push(d);
    for (const s of stages) out[s.id].sort((a, b) => b.order - a.order);
    return out;
  }, [visibleDeals, stages]);

  // Forecast (open pipeline, weighted)
  const forecast = useMemo(() => {
    const open = visibleDeals.filter((d) => {
      const st = stages.find((s) => s.id === d.stage);
      return st && !st.terminal;
    });
    const weighted = open.reduce((sum, d) => {
      const st = stages.find((s) => s.id === d.stage);
      return sum + (st ? d.amount * st.probability : 0);
    }, 0);
    const total = open.reduce((s, d) => s + d.amount, 0);
    const won = visibleDeals.filter((d) => d.stage === 'won').reduce((s, d) => s + d.amount, 0);
    return { weighted, total, openCount: open.length, won };
  }, [visibleDeals, stages]);

  function computeOrderAt(stage: StageId, insertIndex: number, draggedId: string) {
    const list = (grouped[stage] ?? []).filter((x) => x.id !== draggedId);
    const above = list[insertIndex - 1]; // higher order
    const below = list[insertIndex];     // lower order
    if (above && below) return (above.order + below.order) / 2;
    if (above) return above.order - 1000;
    if (below) return below.order + 1000;
    return Date.now();
  }

  function onCardDragStart(e: React.DragEvent, d: Deal) {
    setDraggingId(d.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', d.id);
  }

  function onCardDragEnd() {
    setDraggingId(null);
    setDropTargetCol(null);
    setDropIndicator(null);
  }

  function onColDragOver(e: React.DragEvent, col: StageId) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dropTargetCol !== col) setDropTargetCol(col);
    if (!dropIndicator || dropIndicator.col !== col) {
      setDropIndicator({ col, before: null });
    }
  }

  function onCardDragOver(e: React.DragEvent, target: Deal) {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (dropTargetCol !== target.stage) setDropTargetCol(target.stage);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const above = e.clientY < rect.top + rect.height / 2;
    if (above) {
      setDropIndicator({ col: target.stage, before: target.id });
    } else {
      const list = (grouped[target.stage] ?? []).filter((x) => x.id !== draggingId);
      const idx = list.findIndex((x) => x.id === target.id);
      const next = list[idx + 1];
      setDropIndicator({ col: target.stage, before: next ? next.id : null });
    }
  }

  function onColDrop(e: React.DragEvent, col: StageId) {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggingId;
    if (!id) return;
    const dragged = data.deals.find((d) => d.id === id);
    if (!dragged) return;
    const list = grouped[col] ?? [];
    const insertIndex = list.filter((x) => x.id !== id).length;
    const newOrder = computeOrderAt(col, insertIndex, id);
    data.moveDeal(id, col, newOrder, auth.user?.uid);
    if (dragged.stage !== col) toast.success(`Moved → ${col}`);
    onCardDragEnd();
  }

  function onCardDrop(e: React.DragEvent, target: Deal) {
    e.preventDefault();
    e.stopPropagation();
    const id = e.dataTransfer.getData('text/plain') || draggingId;
    if (!id || id === target.id) { onCardDragEnd(); return; }
    const dragged = data.deals.find((d) => d.id === id);
    if (!dragged) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const above = e.clientY < rect.top + rect.height / 2;
    const list = (grouped[target.stage] ?? []).filter((x) => x.id !== id);
    const idx = list.findIndex((x) => x.id === target.id);
    const insertIndex = above ? idx : idx + 1;
    const newOrder = computeOrderAt(target.stage, insertIndex, id);
    data.moveDeal(id, target.stage, newOrder, auth.user?.uid);
    if (dragged.stage !== target.stage) toast.success(`Moved → ${target.stage}`);
    onCardDragEnd();
  }

  return (
    <div>
      <header className="border-b border-line bg-bg-panel">
        <div className="px-6 lg:px-8 pt-6 pb-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="label">Pipeline</p>
              <h1 className="text-[28px] leading-[34px] font-semibold tracking-tight mt-1">
                {role === 'rep' ? 'My deals' : 'Team pipeline'}
              </h1>
            </div>
            <button onClick={onNewDeal} className="btn-primary">
              <Plus size={15} /> New deal
            </button>
          </div>

          {/* Forecast strip */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Metric label="Open deals" value={forecast.openCount.toString()} />
            <Metric label="Pipeline value" value={fmtMoney(forecast.total, { compact: true })} />
            <Metric label="Weighted forecast" value={fmtMoney(forecast.weighted, { compact: true })} accent />
            <Metric label="Won this view" value={fmtMoney(forecast.won, { compact: true })} />
          </div>

          {/* Filters (managers/admins) */}
          {role !== 'rep' && (
            <div className="mt-5 flex items-center gap-2 flex-wrap">
              <Filter size={13} className="text-fg-subtle" />
              <span className="label mr-1">Rep</span>
              <FilterChip label="All" active={repFilter === 'all'} onClick={() => setRepFilter('all')} />
              {reps.map((r) => (
                <FilterChip key={r.uid} label={r.name.split(' ')[0]} active={repFilter === r.uid} onClick={() => setRepFilter(r.uid)} />
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Kanban */}
      <div className="px-6 lg:px-8 py-6 overflow-x-auto">
        <div className="flex gap-4 min-w-fit pb-2" style={{ minWidth: `${stages.length * 296}px` }}>
          {stages.map((col) => {
            const colDeals = grouped[col.id] ?? [];
            const colTotal = colDeals.reduce((s, d) => s + d.amount, 0);
            const isDropTarget = dropTargetCol === col.id;
            return (
              <div
                key={col.id}
                onDragOver={(e) => onColDragOver(e, col.id)}
                onDragLeave={() => isDropTarget && setDropTargetCol(null)}
                onDrop={(e) => onColDrop(e, col.id)}
                className={cn(
                  'w-[280px] shrink-0 rounded-md border bg-bg-subtle/60 transition-colors',
                  isDropTarget ? 'border-accent ring-1 ring-accent/40' : 'border-line',
                )}
              >
                <div className="px-3 h-11 flex items-center justify-between border-b border-line">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={cn('h-1.5 w-1.5 rounded-full', stageColor(col.id))} />
                    <span className="text-[13px] font-medium truncate">{col.label}</span>
                    <span className="text-[11px] text-fg-subtle tabular-nums">{colDeals.length}</span>
                  </div>
                  <span className="text-[11px] text-fg-muted tabular-nums">{fmtMoney(colTotal, { compact: true })}</span>
                </div>

                <div className="p-2 space-y-2 min-h-[120px]">
                  {colDeals.length === 0 && draggingId && (
                    <div className="text-[11px] text-fg-subtle px-2 py-6 text-center border border-dashed border-line rounded-md">
                      Drop here
                    </div>
                  )}
                  {colDeals.length === 0 && !draggingId && (
                    <div className="text-[11px] text-fg-subtle px-2 py-6 text-center">No deals</div>
                  )}
                  {colDeals.map((d) => {
                    const owner = data.users.find((u) => u.uid === d.ownerUid);
                    const contact = data.contacts.find((c) => c.id === d.contactId);
                    return (
                      <div key={d.id}>
                        {dropIndicator?.col === col.id && dropIndicator.before === d.id && draggingId !== d.id && (
                          <div className="h-[3px] my-1 bg-accent rounded-full shadow-[0_0_8px_rgb(var(--accent))]" />
                        )}
                        <div
                          draggable
                          onDragStart={(e) => onCardDragStart(e, d)}
                          onDragEnd={onCardDragEnd}
                          onDragOver={(e) => onCardDragOver(e, d)}
                          onDrop={(e) => onCardDrop(e, d)}
                          onClick={() => nav(`/app/deals/${d.id}`)}
                          className={cn(
                            'group rounded-md border border-line bg-bg-panel p-3 cursor-grab active:cursor-grabbing',
                            'hover:border-line-strong hover:shadow-sm transition-all',
                            draggingId === d.id && 'opacity-40',
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="text-[13px] font-medium leading-snug line-clamp-2 group-hover:text-accent transition-colors">{d.name}</div>
                              <div className="text-[11px] text-fg-subtle mt-0.5 truncate">{contact?.name ?? d.companyName}</div>
                            </div>
                            <Avatar user={owner} size={20} />
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-[13px] font-semibold tabular-nums">{fmtMoney(d.amount, { compact: true })}</span>
                            <span className="text-[11px] text-fg-subtle tabular-nums">close {fmtRelative(d.closeDate)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {dropIndicator?.col === col.id && dropIndicator.before === null && draggingId && (
                    <div className="h-[3px] my-1 bg-accent rounded-full shadow-[0_0_8px_rgb(var(--accent))]" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-md border border-line bg-bg-panel p-4">
      <div className="text-[11px] uppercase tracking-wider text-fg-subtle font-medium">{label}</div>
      <div className={cn('text-[22px] leading-[28px] font-semibold tabular-nums tracking-tight mt-1', accent && 'text-accent')}>
        {value}
      </div>
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'h-7 px-2.5 rounded-md text-xs transition-colors border',
        active
          ? 'bg-accent/15 text-accent border-accent/40'
          : 'border-line text-fg-muted hover:bg-bg-hover hover:text-fg',
      )}
    >
      {label}
    </button>
  );
}

function stageColor(s: StageId): string {
  switch (s) {
    case 'lead':        return 'bg-fg-subtle';
    case 'contacted':   return 'bg-blue-400';
    case 'qualified':   return 'bg-cyan-400';
    case 'proposal':    return 'bg-violet-400';
    case 'negotiation': return 'bg-amber-400';
    case 'won':         return 'bg-success';
    case 'lost':        return 'bg-danger';
    default:            return 'bg-fg-subtle';
  }
}
