import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, Building2 } from 'lucide-react';
import { useData } from '../store/data';
import { fmtMoney } from '../lib/format';

export function Contacts() {
  const data = useData();
  const nav = useNavigate();
  const [search, setSearch] = useState('');

  const grouped = useMemo(() => {
    const map = new Map<string, typeof data.contacts>();
    for (const c of data.contacts) {
      const k = c.company;
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(c);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [data.contacts]);

  const filtered = useMemo(() => {
    if (!search) return grouped;
    const s = search.toLowerCase();
    return grouped
      .map(([co, list]) => [co, list.filter((c) => c.name.toLowerCase().includes(s) || c.email.toLowerCase().includes(s) || co.toLowerCase().includes(s))] as const)
      .filter(([, list]) => list.length > 0);
  }, [grouped, search]);

  function dealCount(company: string) {
    return data.deals.filter((d) => d.companyName === company).length;
  }
  function dealValue(company: string) {
    return data.deals.filter((d) => d.companyName === company).reduce((s, d) => s + d.amount, 0);
  }

  return (
    <div>
      <header className="border-b border-line bg-bg-panel">
        <div className="px-6 lg:px-8 pt-6 pb-5">
          <p className="label">Contacts</p>
          <h1 className="text-[28px] leading-[34px] font-semibold tracking-tight mt-1">Companies &amp; people</h1>
          <p className="text-sm text-fg-muted mt-1">{data.contacts.length} contacts across {grouped.length} companies</p>
          <input
            className="input max-w-sm mt-5"
            placeholder="Search name, email, company…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      <div className="px-6 lg:px-8 py-6 space-y-4">
        {filtered.map(([company, contacts]) => {
          const count = dealCount(company);
          const value = dealValue(company);
          return (
            <div key={company} className="card overflow-hidden">
              <div className="px-5 h-12 border-b border-line flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-7 w-7 rounded-md bg-bg-subtle border border-line grid place-items-center text-fg-muted">
                    <Building2 size={14} />
                  </div>
                  <span className="font-medium text-[14px] truncate">{company}</span>
                </div>
                <div className="flex items-center gap-3 text-[12px] text-fg-subtle tabular-nums">
                  <span>{count} {count === 1 ? 'deal' : 'deals'}</span>
                  <span>·</span>
                  <span>{fmtMoney(value, { compact: true })}</span>
                </div>
              </div>
              <ul className="divide-y divide-line">
                {contacts.map((c) => {
                  const dealsForContact = data.deals.filter((d) => d.contactId === c.id);
                  return (
                    <li key={c.id} className="px-5 py-3 flex items-center gap-4 hover:bg-bg-hover transition-colors">
                      <div className="h-9 w-9 rounded-md bg-bg-subtle border border-line grid place-items-center text-[13px] font-semibold">
                        {c.initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[14px] font-medium truncate">{c.name}</div>
                        <div className="text-[12px] text-fg-subtle truncate">{c.title}</div>
                      </div>
                      <div className="hidden md:flex items-center gap-4 text-[13px] text-fg-muted">
                        <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 hover:text-accent"><Mail size={12} /> <span className="truncate max-w-[180px]">{c.email}</span></a>
                        {c.phone && <a href={`tel:${c.phone}`} className="flex items-center gap-1.5 hover:text-accent tabular-nums"><Phone size={12} /> {c.phone}</a>}
                      </div>
                      {dealsForContact.length > 0 && (
                        <button
                          onClick={() => nav(`/app/deals/${dealsForContact[0].id}`)}
                          className="text-[12px] text-accent hover:underline shrink-0"
                        >
                          View deal →
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-center text-fg-subtle py-12">No contacts match.</p>
        )}
      </div>
    </div>
  );
}
