import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowUpDown } from 'lucide-react';
import { useAuth } from '../store/auth';
import { useData, getStages } from '../store/data';
import { fmtMoney, fmtRelative, fmtShortDate } from '../lib/format';
import { Avatar } from '../components/Avatar';
import { cn } from '../lib/cn';
import type { Deal, StageId } from '../types';

type SortKey = 'updated' | 'amount' | 'closeDate' | 'name';

export function Deals({ onNewDeal }: { onNewDeal: () => void }) {
  const auth = useAuth();
  const data = useData();
  const nav = useNavigate();
  const stages = getStages(data.settings);
  const role = auth.user?.role;

  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<'all' | StageId>('all');
  const [sortKey, setSortKey] = useState<SortKey>('updated');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const list = useMemo(() => {
    let l = data.deals;
    if (role === 'rep' && auth.user) l = l.filter((d) => d.ownerUid === auth.user!.uid);
    if (stageFilter !== 'all') l = l.filter((d) => d.stage === stageFilter);
    if (search) {
      const s = search.toLowerCase();
      l = l.filter((d) => d.name.toLowerCase().includes(s) || d.companyName.toLowerCase().includes(s));
    }
    l = [...l].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'updated') cmp = a.updatedAt - b.updatedAt;
      else if (sortKey === 'amount') cmp = a.amount - b.amount;
      else if (sortKey === 'closeDate') cmp = a.closeDate - b.closeDate;
      else if (sortKey === 'name') cmp = a.name.localeCompare(b.name);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return l;
  }, [data.deals, role, auth.user, stageFilter, search, sortKey, sortDir]);

  function toggleSort(k: SortKey) {
    if (k === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(k); setSortDir(k === 'name' ? 'asc' : 'desc'); }
  }

  return (
    <div>
      <header className="border-b border-line bg-bg-panel">
        <div className="px-6 lg:px-8 pt-6 pb-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="label">Deals</p>
              <h1 className="text-[28px] leading-[34px] font-semibold tracking-tight mt-1">All deals</h1>
              <p className="text-sm text-fg-muted mt-1">{list.length} {list.length === 1 ? 'deal' : 'deals'}</p>
            </div>
            <button onClick={onNewDeal} className="btn-primary"><Plus size={15} /> New deal</button>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <input
              className="input max-w-xs"
              placeholder="Search deals or companies…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select className="input max-w-[160px]" value={stageFilter} onChange={(e) => setStageFilter(e.target.value as any)}>
              <option value="all">All stages</option>
              {stages.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
        </div>
      </header>

      <div className="px-6 lg:px-8 py-6">
        <div className="card overflow-hidden">
          {/* Header row */}
          <div className="hidden md:grid grid-cols-[minmax(0,2fr)_120px_minmax(0,1fr)_120px_120px_120px] items-center gap-4 px-4 h-10 border-b border-line bg-bg-subtle/60 text-[11px] uppercase tracking-wider text-fg-subtle font-medium">
            <SortBtn label="Deal" k="name" cur={sortKey} dir={sortDir} onClick={() => toggleSort('name')} />
            <SortBtn label="Amount" k="amount" cur={sortKey} dir={sortDir} onClick={() => toggleSort('amount')} />
            <span>Stage</span>
            <span>Owner</span>
            <SortBtn label="Close" k="closeDate" cur={sortKey} dir={sortDir} onClick={() => toggleSort('closeDate')} />
            <SortBtn label="Updated" k="updated" cur={sortKey} dir={sortDir} onClick={() => toggleSort('updated')} />
          </div>

          {list.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-fg-muted">No deals match those filters.</p>
              <button onClick={() => { setSearch(''); setStageFilter('all'); }} className="btn-ghost mt-4 text-sm">Clear filters</button>
            </div>
          ) : (
            <div className="divide-y divide-line">
              {list.map((d) => <DealRow key={d.id} d={d} onClick={() => nav(`/app/deals/${d.id}`)} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DealRow({ d, onClick }: { d: Deal; onClick: () => void }) {
  const data = useData();
  const owner = data.users.find((u) => u.uid === d.ownerUid);
  const stage = getStages(data.settings).find((s) => s.id === d.stage);
  return (
    <button
      onClick={onClick}
      className="w-full text-left grid md:grid-cols-[minmax(0,2fr)_120px_minmax(0,1fr)_120px_120px_120px] gap-4 px-4 py-3 md:h-12 md:py-0 items-center hover:bg-bg-hover transition-colors"
    >
      <div className="min-w-0">
        <div className="text-[14px] font-medium truncate">{d.name}</div>
        <div className="text-[12px] text-fg-subtle truncate md:hidden">{d.companyName} · {fmtMoney(d.amount, { compact: true })}</div>
      </div>
      <div className="hidden md:block text-[14px] tabular-nums">{fmtMoney(d.amount, { compact: true })}</div>
      <div className="hidden md:flex items-center gap-2">
        <span className={cn('h-1.5 w-1.5 rounded-full', stageDotColor(d.stage))} />
        <span className="text-[13px] text-fg-muted">{stage?.label}</span>
      </div>
      <div className="hidden md:flex items-center gap-2 min-w-0">
        <Avatar user={owner} size={20} />
        <span className="text-[13px] text-fg-muted truncate">{owner?.name.split(' ')[0]}</span>
      </div>
      <div className="hidden md:block text-[13px] text-fg-muted tabular-nums">{fmtShortDate(d.closeDate)}</div>
      <div className="hidden md:block text-[13px] text-fg-subtle tabular-nums">{fmtRelative(d.updatedAt)}</div>
    </button>
  );
}

function SortBtn({ label, k, cur, dir, onClick }: { label: string; k: SortKey; cur: SortKey; dir: 'asc' | 'desc'; onClick: () => void }) {
  const active = cur === k;
  return (
    <button onClick={onClick} className={cn('flex items-center gap-1 hover:text-fg', active && 'text-fg')}>
      {label} <ArrowUpDown size={11} className={cn(active ? 'opacity-100' : 'opacity-40')} />
      {active && <span className="text-[10px]">{dir === 'asc' ? '↑' : '↓'}</span>}
    </button>
  );
}

function stageDotColor(s: StageId): string {
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
