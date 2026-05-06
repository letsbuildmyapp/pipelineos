import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { Kanban, BarChart3, Users as UsersIcon, Building2, ListChecks, Sun, Moon, LogOut, Settings as SettingsIcon, ShieldCheck, RefreshCw, Plus, Search } from 'lucide-react';
import { useAuth } from '../store/auth';
import { useTheme } from '../store/theme';
import { useData } from '../store/data';
import { toast } from 'sonner';
import { fmtMoney } from '../lib/format';
import { Avatar } from './Avatar';

export function CommandPalette({ open, onOpenChange, onNewDeal }: { open: boolean; onOpenChange: (v: boolean) => void; onNewDeal: () => void }) {
  const nav = useNavigate();
  const auth = useAuth();
  const theme = useTheme();
  const data = useData();
  const [query, setQuery] = useState('');

  useEffect(() => { if (!open) setQuery(''); }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onOpenChange(false); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onOpenChange]);

  if (!open || !auth.user) return null;

  const close = () => onOpenChange(false);
  const go = (to: string) => { close(); nav(to); };

  const role = auth.user.role;
  const recentDeals = [...data.deals]
    .filter((d) => role === 'rep' ? d.ownerUid === auth.user!.uid : true)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 8);

  return (
    <div className="fixed inset-0 z-[150] grid place-items-start pt-[12vh] px-4 bg-black/60 backdrop-blur-sm" onClick={close}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-xl">
        <Command className="card shadow-panel overflow-hidden" loop>
          <div className="flex items-center gap-2 border-b border-line px-4 h-12">
            <Search size={15} className="text-fg-subtle" />
            <Command.Input
              autoFocus
              value={query}
              onValueChange={setQuery}
              placeholder="Search deals, contacts, or jump to a page…"
              className="flex-1 h-full bg-transparent outline-none text-sm placeholder:text-fg-subtle"
            />
            <span className="kbd">esc</span>
          </div>
          <Command.List className="max-h-[420px] overflow-y-auto p-2">
            <Command.Empty className="py-10 text-center text-sm text-fg-subtle">No results.</Command.Empty>

            <Command.Group heading="Quick actions" className="text-[11px] uppercase tracking-wider text-fg-subtle px-2 py-1.5">
              <PaletteItem icon={Plus} label="New deal" onSelect={() => { close(); onNewDeal(); }} />
              {role === 'admin' && <PaletteItem icon={RefreshCw} label="Reseed demo data" onSelect={() => { data.reseed(); close(); toast.success('Demo data reseeded'); }} />}
            </Command.Group>

            <Command.Group heading="Navigate" className="text-[11px] uppercase tracking-wider text-fg-subtle px-2 py-1.5 mt-1">
              <PaletteItem icon={Kanban}     label="Pipeline"  onSelect={() => go('/app/pipeline')} />
              <PaletteItem icon={ListChecks} label="Deals"     onSelect={() => go('/app/deals')} />
              <PaletteItem icon={Building2}  label="Contacts"  onSelect={() => go('/app/contacts')} />
              {(role === 'manager' || role === 'admin') && <PaletteItem icon={BarChart3} label="Reports" onSelect={() => go('/app/reports')} />}
              {(role === 'manager' || role === 'admin') && <PaletteItem icon={UsersIcon} label="Team" onSelect={() => go('/app/team')} />}
              {role === 'admin' && <PaletteItem icon={ShieldCheck} label="Admin" onSelect={() => go('/app/admin')} />}
            </Command.Group>

            {recentDeals.length > 0 && (
              <Command.Group heading="Recent deals" className="text-[11px] uppercase tracking-wider text-fg-subtle px-2 py-1.5 mt-1">
                {recentDeals.map((d) => {
                  const owner = data.users.find((u) => u.uid === d.ownerUid);
                  return (
                    <Command.Item
                      key={d.id}
                      value={`${d.name} ${d.companyName}`}
                      onSelect={() => go(`/app/deals/${d.id}`)}
                      className="flex items-center gap-3 px-2 h-10 rounded-md cursor-pointer data-[selected=true]:bg-bg-hover text-sm"
                    >
                      <Avatar user={owner} size={20} />
                      <span className="flex-1 truncate">{d.name}</span>
                      <span className="text-fg-subtle tabular-nums text-xs">{fmtMoney(d.amount, { compact: true })}</span>
                    </Command.Item>
                  );
                })}
              </Command.Group>
            )}

            <Command.Group heading="Account" className="text-[11px] uppercase tracking-wider text-fg-subtle px-2 py-1.5 mt-1">
              <PaletteItem
                icon={theme.theme === 'dark' ? Sun : Moon}
                label={theme.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                onSelect={() => { theme.toggle(); close(); }}
              />
              <PaletteItem icon={LogOut} label="Sign out" onSelect={() => { auth.signOut(); close(); nav('/login'); }} />
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}

function PaletteItem({ icon: Icon, label, onSelect }: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; onSelect: () => void }) {
  return (
    <Command.Item
      onSelect={onSelect}
      value={label}
      className="flex items-center gap-2.5 px-2 h-9 rounded-md cursor-pointer data-[selected=true]:bg-bg-hover text-sm"
    >
      <Icon size={14} className="text-fg-subtle" />
      <span>{label}</span>
    </Command.Item>
  );
}
