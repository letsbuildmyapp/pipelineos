export function fmtMoney(n: number, opts: { compact?: boolean } = {}) {
  if (opts.compact && Math.abs(n) >= 1000) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(n);
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export function fmtNumber(n: number) {
  return new Intl.NumberFormat('en-US').format(n);
}

export function fmtPct(n: number, decimals = 0) {
  return `${(n * 100).toFixed(decimals)}%`;
}

export function fmtRelative(ts: number) {
  const diff = Date.now() - ts;
  const abs = Math.abs(diff);
  const future = diff < 0;
  const min = 60_000, hr = 3600_000, day = 86400_000;
  let val: string;
  if (abs < hr) val = `${Math.max(1, Math.round(abs / min))}m`;
  else if (abs < day) val = `${Math.round(abs / hr)}h`;
  else if (abs < 30 * day) val = `${Math.round(abs / day)}d`;
  else val = new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return future ? `in ${val}` : `${val} ago`;
}

export function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function fmtShortDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
