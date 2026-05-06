import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Kanban, BarChart3, Users as UsersIcon, Settings as SettingsIcon, Building2, ListChecks,
  Search, Sun, Moon, LogOut, Menu, X, ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../store/auth';
import { useTheme } from '../store/theme';
import { Avatar } from './Avatar';
import { cn } from '../lib/cn';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  roles: ('rep' | 'manager' | 'admin')[];
  tour?: string;
}

const NAV: NavItem[] = [
  { to: '/app/pipeline', label: 'Pipeline',  icon: Kanban,        roles: ['rep', 'manager', 'admin'], tour: 'nav-pipeline' },
  { to: '/app/deals',    label: 'Deals',     icon: ListChecks,    roles: ['rep', 'manager', 'admin'] },
  { to: '/app/contacts', label: 'Contacts',  icon: Building2,     roles: ['rep', 'manager', 'admin'] },
  { to: '/app/reports',  label: 'Reports',   icon: BarChart3,     roles: ['manager', 'admin'], tour: 'nav-reports' },
  { to: '/app/team',     label: 'Team',      icon: UsersIcon,     roles: ['manager', 'admin'] },
  { to: '/app/admin',    label: 'Admin',     icon: ShieldCheck,   roles: ['admin'] },
];

export function AppShell({ children, onOpenPalette }: { children: React.ReactNode; onOpenPalette: () => void }) {
  const auth = useAuth();
  const theme = useTheme();
  const nav = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const user = auth.user;
  if (!user) return null;
  const items = NAV.filter((n) => n.roles.includes(user.role));

  function signOutAndGo() {
    auth.signOut();
    nav('/login');
  }

  return (
    <div className="min-h-screen flex bg-bg text-fg">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-[232px] flex-col border-r border-line bg-bg-panel">
        <div className="h-14 flex items-center gap-2.5 px-5 border-b border-line" data-tour="brand">
          <div className="h-7 w-7 rounded-md bg-accent grid place-items-center text-[rgb(var(--accent-fg))] font-bold tracking-tight">
            <span className="text-[15px]">◢</span>
          </div>
          <div className="font-semibold text-[15px] tracking-tight">PipelineOS</div>
        </div>

        <button
          data-tour="search"
          onClick={onOpenPalette}
          className="mx-3 mt-3 h-9 px-3 flex items-center gap-2 rounded-md border border-line-strong bg-bg-subtle hover:bg-bg-hover text-sm text-fg-subtle transition-colors"
        >
          <Search size={14} />
          <span className="flex-1 text-left">Search…</span>
          <span className="kbd">⌘K</span>
        </button>

        <nav className="mt-4 px-2 flex-1 overflow-y-auto" data-tour="workspace-nav">
          <div className="label px-3 mb-2">Workspace</div>
          <ul className="space-y-0.5">
            {items.map((it) => (
              <li key={it.to}>
                <NavLink
                  to={it.to}
                  data-tour={it.tour}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 h-10 px-3 rounded-md text-sm transition-colors',
                      isActive
                        ? 'bg-bg-hover text-fg font-medium'
                        : 'text-fg-muted hover:bg-bg-hover hover:text-fg',
                    )
                  }
                >
                  <it.icon size={15} />
                  <span>{it.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-line p-3 space-y-1" data-tour="account">
          <div className="flex items-center gap-2.5 px-2 h-11">
            <Avatar user={user} size={28} />
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-medium truncate">{user.name}</div>
              <div className="text-[11px] text-fg-subtle uppercase tracking-wider">{user.role}</div>
            </div>
          </div>
          <button onClick={theme.toggle} className="w-full flex items-center gap-2.5 h-9 px-2 rounded-md text-[13px] text-fg-muted hover:bg-bg-hover hover:text-fg transition-colors">
            {theme.theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            <span>{theme.theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          </button>
          <button onClick={signOutAndGo} className="w-full flex items-center gap-2.5 h-9 px-2 rounded-md text-[13px] text-fg-muted hover:bg-bg-hover hover:text-fg transition-colors">
            <LogOut size={14} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Mobile header + drawer */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden h-14 px-4 border-b border-line bg-bg-panel flex items-center justify-between">
          <button onClick={() => setMobileOpen(true)} className="p-2 -ml-2 rounded-md hover:bg-bg-hover" aria-label="Open menu">
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-accent grid place-items-center text-[rgb(var(--accent-fg))] font-bold text-xs">◢</div>
            <span className="font-semibold tracking-tight">PipelineOS</span>
          </div>
          <button onClick={onOpenPalette} className="p-2 -mr-2 rounded-md hover:bg-bg-hover" aria-label="Search">
            <Search size={18} />
          </button>
        </header>

        {mobileOpen && (
          <div className="md:hidden fixed inset-0 z-40">
            <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
            <div className="absolute inset-y-0 left-0 w-[260px] bg-bg-panel border-r border-line flex flex-col">
              <div className="h-14 flex items-center justify-between px-5 border-b border-line">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-md bg-accent grid place-items-center text-[rgb(var(--accent-fg))] font-bold text-xs">◢</div>
                  <span className="font-semibold">PipelineOS</span>
                </div>
                <button onClick={() => setMobileOpen(false)} className="p-2 -mr-2 rounded-md hover:bg-bg-hover" aria-label="Close menu">
                  <X size={18} />
                </button>
              </div>
              <nav className="p-3 flex-1 overflow-y-auto">
                {items.map((it) => (
                  <NavLink
                    key={it.to}
                    to={it.to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 h-12 px-3 rounded-md text-sm',
                        isActive ? 'bg-bg-hover text-fg font-medium' : 'text-fg-muted',
                      )
                    }
                  >
                    <it.icon size={16} />
                    <span>{it.label}</span>
                  </NavLink>
                ))}
              </nav>
              <div className="p-3 border-t border-line space-y-1">
                <div className="flex items-center gap-3 px-3 h-12">
                  <Avatar user={user} size={32} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{user.name}</div>
                    <div className="text-[11px] text-fg-subtle uppercase tracking-wider">{user.role}</div>
                  </div>
                </div>
                <button onClick={theme.toggle} className="w-full flex items-center gap-3 h-11 px-3 rounded-md text-sm text-fg-muted hover:bg-bg-hover">
                  {theme.theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                  <span>{theme.theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
                </button>
                <button onClick={signOutAndGo} className="w-full flex items-center gap-3 h-11 px-3 rounded-md text-sm text-fg-muted hover:bg-bg-hover">
                  <LogOut size={15} />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 min-w-0 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
