import { useMemo, useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useData, getStages } from '../store/data';
import { fmtMoney } from '../lib/format';
import { cn } from '../lib/cn';

type Range = '30d' | '90d' | 'qtr' | 'all';

export function Reports() {
  const data = useData();
  const stages = getStages(data.settings);
  const [range, setRange] = useState<Range>('90d');

  const cutoff = useMemo(() => {
    const now = Date.now();
    if (range === '30d') return now - 30 * 86400_000;
    if (range === '90d') return now - 90 * 86400_000;
    if (range === 'qtr') return new Date(new Date().getFullYear(), Math.floor(new Date().getMonth() / 3) * 3, 1).getTime();
    return 0;
  }, [range]);

  const dealsInRange = useMemo(() => data.deals.filter((d) => d.updatedAt >= cutoff), [data.deals, cutoff]);

  // 1. Deals by stage (bar)
  const byStage = useMemo(() => stages.map((s) => ({
    stage: s.label,
    count: dealsInRange.filter((d) => d.stage === s.id).length,
    value: dealsInRange.filter((d) => d.stage === s.id).reduce((sum, d) => sum + d.amount, 0),
  })), [dealsInRange, stages]);

  // 2. Win rate (closed = won + lost)
  const winRate = useMemo(() => {
    const closed = dealsInRange.filter((d) => d.stage === 'won' || d.stage === 'lost');
    const won = closed.filter((d) => d.stage === 'won').length;
    return { rate: closed.length ? won / closed.length : 0, won, lost: closed.length - won, closed: closed.length };
  }, [dealsInRange]);

  // 3. Cycle time by stage (avg days from createdAt to closedAt for won)
  const cycleTime = useMemo(() => {
    const won = dealsInRange.filter((d) => d.stage === 'won' && d.closedAt);
    if (!won.length) return 0;
    const avg = won.reduce((s, d) => s + (d.closedAt! - d.createdAt), 0) / won.length;
    return avg / 86400_000;
  }, [dealsInRange]);

  // 4. Forecast over time — group by week
  const forecastSeries = useMemo(() => {
    const weeks: { week: string; weighted: number; total: number }[] = [];
    const now = Date.now();
    for (let w = 11; w >= 0; w--) {
      const start = now - (w + 1) * 7 * 86400_000;
      const end = now - w * 7 * 86400_000;
      const open = data.deals.filter((d) => d.createdAt <= end && (!d.closedAt || d.closedAt > end) && d.stage !== 'won' && d.stage !== 'lost');
      const weighted = open.reduce((sum, d) => {
        const st = stages.find((s) => s.id === d.stage);
        return sum + (st ? d.amount * st.probability : 0);
      }, 0);
      const total = open.reduce((s, d) => s + d.amount, 0);
      weeks.push({
        week: new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        weighted: Math.round(weighted),
        total: Math.round(total),
      });
    }
    return weeks;
  }, [data.deals, stages]);

  // 5. Pipeline by source
  const bySource = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of dealsInRange) map.set(d.source, (map.get(d.source) ?? 0) + d.amount);
    return [...map.entries()].map(([source, value]) => ({ source, value })).sort((a, b) => b.value - a.value);
  }, [dealsInRange]);

  // 6. Rep leaderboard (won amount)
  const leaderboard = useMemo(() => {
    const reps = data.users.filter((u) => u.role === 'rep');
    return reps.map((r) => {
      const wonAmt = dealsInRange.filter((d) => d.ownerUid === r.uid && d.stage === 'won').reduce((s, d) => s + d.amount, 0);
      const openAmt = dealsInRange.filter((d) => d.ownerUid === r.uid && d.stage !== 'won' && d.stage !== 'lost').reduce((s, d) => s + d.amount, 0);
      return { rep: r.name.split(' ')[0], won: wonAmt, open: openAmt, quota: r.quota ?? 50000 };
    }).sort((a, b) => b.won - a.won);
  }, [data.users, dealsInRange]);

  const pieColors = ['#22d3ee', '#a78bfa', '#34d399', '#fbbf24', '#f87171', '#60a5fa', '#f472b6'];
  const tooltipStyle = {
    background: 'rgb(var(--bg-panel))',
    border: '1px solid rgb(var(--line-strong))',
    borderRadius: 6,
    fontSize: 12,
  } as const;

  return (
    <div>
      <header className="border-b border-line bg-bg-panel">
        <div className="px-6 lg:px-8 pt-6 pb-5">
          <p className="label">Reports</p>
          <h1 className="text-[28px] leading-[34px] font-semibold tracking-tight mt-1">Pipeline analytics</h1>
          <div className="mt-5 flex items-center gap-2 flex-wrap">
            <span className="label mr-1">Range</span>
            {(['30d', '90d', 'qtr', 'all'] as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={cn(
                  'h-8 px-3 rounded-md text-xs font-medium border transition-colors',
                  range === r ? 'bg-accent/15 text-accent border-accent/40' : 'border-line text-fg-muted hover:bg-bg-hover hover:text-fg',
                )}
              >
                {r === '30d' ? 'Last 30 days' : r === '90d' ? 'Last 90 days' : r === 'qtr' ? 'This quarter' : 'All time'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="px-6 lg:px-8 py-6 space-y-4">
        {/* Top stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat label="Total deals" value={dealsInRange.length.toString()} />
          <Stat label="Win rate" value={`${(winRate.rate * 100).toFixed(0)}%`} sub={`${winRate.won} won · ${winRate.lost} lost`} />
          <Stat label="Avg cycle time" value={`${cycleTime.toFixed(0)}d`} />
          <Stat label="Pipeline value" value={fmtMoney(dealsInRange.filter((d) => d.stage !== 'won' && d.stage !== 'lost').reduce((s, d) => s + d.amount, 0), { compact: true })} />
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          {/* Chart 1: Deals by stage */}
          <ChartCard title="Deals by stage" subtitle="Count of deals currently in each stage">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={byStage} margin={{ top: 6, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--line))" />
                <XAxis dataKey="stage" tick={{ fontSize: 11, fill: 'rgb(var(--fg-muted))' }} stroke="rgb(var(--line))" />
                <YAxis tick={{ fontSize: 11, fill: 'rgb(var(--fg-muted))' }} stroke="rgb(var(--line))" />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgb(var(--bg-hover))' }} />
                <Bar dataKey="count" fill="rgb(var(--accent))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Chart 2: Pipeline value by stage */}
          <ChartCard title="Pipeline value by stage" subtitle="Sum of deal amounts">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={byStage} margin={{ top: 6, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--line))" />
                <XAxis dataKey="stage" tick={{ fontSize: 11, fill: 'rgb(var(--fg-muted))' }} stroke="rgb(var(--line))" />
                <YAxis tick={{ fontSize: 11, fill: 'rgb(var(--fg-muted))' }} stroke="rgb(var(--line))" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgb(var(--bg-hover))' }} formatter={((v: any) => fmtMoney(Number(v))) as any} />
                <Bar dataKey="value" fill="#a78bfa" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Chart 3: Forecast over time */}
          <ChartCard title="Weighted forecast (12w)" subtitle="Open pipeline × stage probability, weekly">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={forecastSeries} margin={{ top: 6, right: 8, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="fc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(var(--accent))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="rgb(var(--accent))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--line))" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'rgb(var(--fg-muted))' }} stroke="rgb(var(--line))" />
                <YAxis tick={{ fontSize: 11, fill: 'rgb(var(--fg-muted))' }} stroke="rgb(var(--line))" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={tooltipStyle} formatter={((v: any) => fmtMoney(Number(v))) as any} />
                <Area type="monotone" dataKey="weighted" stroke="rgb(var(--accent))" strokeWidth={2} fill="url(#fc)" />
                <Line type="monotone" dataKey="total" stroke="#a78bfa" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Chart 4: Pipeline by source (pie) */}
          <ChartCard title="Pipeline by source" subtitle="Deal value attribution">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={bySource} dataKey="value" nameKey="source" innerRadius={48} outerRadius={84} paddingAngle={2}>
                  {bySource.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} stroke="rgb(var(--bg-panel))" strokeWidth={2} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={((v: any) => fmtMoney(Number(v))) as any} />
              </PieChart>
            </ResponsiveContainer>
            <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[12px]">
              {bySource.map((s, i) => (
                <li key={s.source} className="flex items-center gap-1.5 min-w-0">
                  <span className="h-2 w-2 rounded-sm shrink-0" style={{ background: pieColors[i % pieColors.length] }} />
                  <span className="truncate text-fg-muted">{s.source}</span>
                </li>
              ))}
            </ul>
          </ChartCard>

          {/* Chart 5: Win rate trend */}
          <ChartCard title="Win-rate funnel" subtitle="Conversion through pipeline stages">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart layout="vertical" data={byStage.filter((s) => !['Won', 'Lost'].includes(s.stage))} margin={{ top: 6, right: 16, left: 16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--line))" />
                <XAxis type="number" tick={{ fontSize: 11, fill: 'rgb(var(--fg-muted))' }} stroke="rgb(var(--line))" />
                <YAxis type="category" dataKey="stage" tick={{ fontSize: 11, fill: 'rgb(var(--fg-muted))' }} stroke="rgb(var(--line))" width={88} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgb(var(--bg-hover))' }} />
                <Bar dataKey="count" fill="#34d399" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Chart 6: Rep leaderboard */}
          <ChartCard title="Rep leaderboard" subtitle="Won deal value vs. quota">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={leaderboard} margin={{ top: 6, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--line))" />
                <XAxis dataKey="rep" tick={{ fontSize: 11, fill: 'rgb(var(--fg-muted))' }} stroke="rgb(var(--line))" />
                <YAxis tick={{ fontSize: 11, fill: 'rgb(var(--fg-muted))' }} stroke="rgb(var(--line))" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgb(var(--bg-hover))' }} formatter={((v: any) => fmtMoney(Number(v))) as any} />
                <Bar dataKey="won" fill="rgb(var(--accent))" radius={[3, 3, 0, 0]} />
                <Bar dataKey="quota" fill="rgb(var(--line-strong))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <div className="mb-4">
        <h3 className="text-[15px] font-semibold tracking-tight">{title}</h3>
        {subtitle && <p className="text-[12px] text-fg-subtle mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card p-4">
      <div className="text-[11px] uppercase tracking-wider text-fg-subtle font-medium">{label}</div>
      <div className="text-[24px] leading-[28px] font-semibold tabular-nums tracking-tight mt-1">{value}</div>
      {sub && <div className="text-[12px] text-fg-subtle mt-0.5 tabular-nums">{sub}</div>}
    </div>
  );
}
