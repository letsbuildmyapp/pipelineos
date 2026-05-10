import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2, ShieldCheck, Briefcase, UserRound } from 'lucide-react';
import { useAuth } from '../store/auth';
import { useData } from '../store/data';
import { toast } from 'sonner';

const DEMO_PASSWORD = 'demo1234';

const ROLE_META: Record<string, { icon: any; color: string; description: string }> = {
  admin: { icon: ShieldCheck, color: 'from-indigo-500 to-violet-500', description: 'Full pipeline + settings' },
  manager: { icon: Briefcase, color: 'from-emerald-500 to-teal-500', description: 'Forecasts + leaderboards' },
  rep: { icon: UserRound, color: 'from-amber-500 to-orange-500', description: 'My deals + activities' },
};

export function Login() {
  const auth = useAuth();
  const data = useData();
  const nav = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);

  const demoUsers = data.users.filter((u) => u.role !== 'rep' || u.uid === 'u_rep1');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await auth.signIn(email, password);
      toast.success('Signed in');
      nav('/app/pipeline');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function onDemoLogin(uid: string) {
    const u = data.users.find((x) => x.uid === uid);
    if (!u) return;
    setEmail(u.email);
    setPassword(DEMO_PASSWORD);
    setDemoLoading(uid);
    try {
      await auth.signIn(u.email, DEMO_PASSWORD);
      toast.success(`Signed in as ${u.role}`);
      nav('/app/pipeline');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setDemoLoading(null);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-bg">

      <main className="relative z-10 flex flex-1 items-start justify-center px-6 pt-8 sm:pt-12 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-[440px]"
        >
          <div className="rounded-md border border-line bg-bg-panel/80 p-8 shadow-2xl backdrop-blur-sm">
            <div className="space-y-1.5">
              <h1 className="text-2xl font-semibold tracking-tight">Sign in to PipelineOS</h1>
              <p className="text-sm text-fg-muted">Move faster than your deals close.</p>
            </div>

            <div className="my-6 grid gap-2">
              <div className="mb-1 flex items-center justify-between">
                <span className="label">One-click demo logins</span>
                <span className="text-[10px] text-fg-subtle">No password needed</span>
              </div>
              {demoUsers.map((u) => {
                const meta = ROLE_META[u.role] ?? ROLE_META.rep;
                const Icon = meta.icon;
                return (
                  <button
                    key={u.uid}
                    type="button"
                    onClick={() => onDemoLogin(u.uid)}
                    disabled={demoLoading !== null || loading}
                    className="group flex items-center gap-3 rounded-md border border-line-strong bg-bg-panel hover:bg-bg-hover p-3 text-left transition-colors disabled:opacity-50"
                  >
                    <div className={`flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br ${meta.color} text-white shadow-sm`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{u.name}</div>
                      <div className="truncate text-xs text-fg-subtle uppercase tracking-wider">{u.role} · <span className="normal-case tracking-normal">{meta.description}</span></div>
                    </div>
                    {demoLoading === u.uid ? (
                      <Loader2 size={14} className="animate-spin text-fg-subtle" />
                    ) : (
                      <ArrowRight size={14} className="text-fg-subtle transition-transform group-hover:translate-x-0.5" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-line" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wider">
                <span className="bg-bg-panel px-3 text-fg-subtle">or sign in with email</span>
              </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="label block mb-1.5">Email</label>
                <input className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="rep@pipelineos.demo" />
              </div>
              <div>
                <label className="label block mb-1.5">Password</label>
                <input className="input" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <button disabled={loading} className="btn-primary w-full">
                {loading ? <Loader2 size={15} className="animate-spin" /> : <>Sign in <ArrowRight size={15} /></>}
              </button>
            </form>
          </div>
        </motion.div>
      </main>

      <footer className="relative z-10 px-6 pb-8 text-center text-xs text-fg-subtle sm:px-10">
        <a href="https://letsbuildmyapp.com" target="_blank" rel="noreferrer" className="font-medium text-fg underline-offset-4 hover:underline">
          Let&apos;s Build My App
        </a>
      </footer>
    </div>
  );
}
