import { useMemo } from 'react';
import { useData } from '../store/data';
import { Avatar } from '../components/Avatar';
import { fmtMoney, fmtPct } from '../lib/format';
import { cn } from '../lib/cn';

export function Team() {
  const data = useData();
  const reps = data.users.filter((u) => u.role === 'rep');

  const rows = useMemo(() => {
    return reps.map((r) => {
      const all = data.deals.filter((d) => d.ownerUid === r.uid);
      const won = all.filter((d) => d.stage === 'won').reduce((s, d) => s + d.amount, 0);
      const lost = all.filter((d) => d.stage === 'lost').length;
      const wonCount = all.filter((d) => d.stage === 'won').length;
      const open = all.filter((d) => d.stage !== 'won' && d.stage !== 'lost');
      const openValue = open.reduce((s, d) => s + d.amount, 0);
      const quota = r.quota ?? 50000;
      const attainment = won / quota;
      const winRate = (wonCount + lost) ? wonCount / (wonCount + lost) : 0;
      return { rep: r, all: all.length, open: open.length, openValue, won, wonCount, lost, quota, attainment, winRate };
    }).sort((a, b) => b.attainment - a.attainment);
  }, [reps, data.deals]);

  return (
    <div>
      <header className="border-b border-line bg-bg-panel">
        <div className="px-6 lg:px-8 pt-6 pb-5">
          <p className="label">Team</p>
          <h1 className="text-[28px] leading-[34px] font-semibold tracking-tight mt-1">Sales reps</h1>
          <p className="text-sm text-fg-muted mt-1">{reps.length} reps · ranked by quota attainment</p>
        </div>
      </header>

      <div className="px-6 lg:px-8 py-6 space-y-3">
        {rows.map((r, i) => (
          <div key={r.rep.uid} className="card p-5">
            <div className="flex items-center gap-4">
              <div className="text-[28px] font-semibold tabular-nums text-fg-subtle w-8 text-center">{i + 1}</div>
              <Avatar user={r.rep} size={44} />
              <div className="min-w-0 flex-1">
                <div className="text-[16px] font-semibold tracking-tight">{r.rep.name}</div>
                <div className="text-[12px] text-fg-subtle">{r.rep.email}</div>
              </div>
              <div className="hidden sm:grid grid-cols-4 gap-6 text-right">
                <Mini label="Open" value={`${r.open}`} sub={fmtMoney(r.openValue, { compact: true })} />
                <Mini label="Won" value={`${r.wonCount}`} sub={fmtMoney(r.won, { compact: true })} />
                <Mini label="Win rate" value={fmtPct(r.winRate)} />
                <Mini label="Attainment" value={fmtPct(r.attainment)} accent={r.attainment >= 1} />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-[11px] text-fg-subtle mb-1.5">
                <span>Quota progress</span>
                <span className="tabular-nums">{fmtMoney(r.won, { compact: true })} / {fmtMoney(r.quota, { compact: true })}</span>
              </div>
              <div className="h-2 rounded-full bg-bg-subtle overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', r.attainment >= 1 ? 'bg-success' : 'bg-accent')}
                  style={{ width: `${Math.min(100, r.attainment * 100)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Mini({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-fg-subtle">{label}</div>
      <div className={cn('text-[15px] font-semibold tabular-nums mt-0.5', accent && 'text-success')}>{value}</div>
      {sub && <div className="text-[11px] text-fg-subtle tabular-nums">{sub}</div>}
    </div>
  );
}
