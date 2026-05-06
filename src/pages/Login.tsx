import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../store/auth';
import { useData } from '../store/data';
import { Avatar } from '../components/Avatar';
import { toast } from 'sonner';

export function Login() {
  const auth = useAuth();
  const data = useData();
  const nav = useNavigate();

  const [email, setEmail] = useState('rep@pipelineos.demo');
  const [password, setPassword] = useState('demo1234');
  const [pending, setPending] = useState(false);

  const demoUsers = data.users.filter((u) => u.role !== 'rep' || u.uid === 'u_rep1');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      await auth.signIn(email, password);
      toast.success('Signed in');
      nav('/app/pipeline');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setPending(false);
    }
  }

  async function quick(uid: string) {
    setPending(true);
    try {
      const u = data.users.find((x) => x.uid === uid)!;
      await auth.signIn(u.email, 'demo1234');
      toast.success(`Signed in as ${u.role}`);
      nav('/app/pipeline');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setPending(false);
    }
  }

  async function googleIn() {
    setPending(true);
    try { await auth.signInGoogle(); nav('/app/pipeline'); } finally { setPending(false); }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-bg">
      {/* Left — pitch */}
      <div className="hidden lg:flex flex-col justify-between p-12 border-r border-line bg-bg-panel">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-md bg-accent grid place-items-center text-[rgb(var(--accent-fg))] font-bold">◢</div>
          <span className="font-semibold tracking-tight text-lg">PipelineOS</span>
        </div>

        <div className="max-w-md">
          <p className="label mb-3">B2B SaaS sales pipeline</p>
          <h1 className="text-[44px] leading-[1.05] font-semibold tracking-tight">
            Move faster than your<br />
            <span className="text-accent">deals close.</span>
          </h1>
          <p className="text-fg-muted mt-5 text-base leading-relaxed">
            A keyboard-first CRM for B2B sales teams. Drag-and-drop pipeline, weighted forecasts,
            per-rep leaderboards, and the speed of a native app.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3">
            <Stat label="Avg. cycle time" value="38d" />
            <Stat label="Win rate" value="22%" />
            <Stat label="Forecast accuracy" value="91%" />
          </div>
        </div>

        <p className="text-xs text-fg-subtle">
          Built by <a href="https://letsbuildmyapp.com" className="text-fg-muted hover:text-accent">letsbuildmyapp.com</a>
        </p>
      </div>

      {/* Right — auth */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-10">
            <div className="h-7 w-7 rounded-md bg-accent grid place-items-center text-[rgb(var(--accent-fg))] font-bold text-sm">◢</div>
            <span className="font-semibold tracking-tight">PipelineOS</span>
          </Link>

          <p className="label mb-2">Sign in</p>
          <h2 className="text-2xl font-semibold tracking-tight mb-8">Welcome back.</h2>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label block mb-1.5">Email</label>
              <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="label block mb-1.5">Password</label>
              <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <button disabled={pending} className="btn-primary w-full">
              {pending ? <Loader2 size={15} className="animate-spin" /> : <>Sign in <ArrowRight size={15} /></>}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-fg-subtle">
            <div className="flex-1 h-px bg-line" />
            <span className="uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-line" />
          </div>

          <button onClick={googleIn} disabled={pending} className="btn-outline w-full">
            <GoogleMark /> Continue with Google
          </button>

          <p className="label mt-8 mb-3">Try a demo role</p>
          <div className="space-y-2">
            {demoUsers.map((u) => (
              <button
                key={u.uid}
                onClick={() => quick(u.uid)}
                disabled={pending}
                className="w-full flex items-center gap-3 h-12 px-3 rounded-md border border-line-strong bg-bg-panel hover:bg-bg-hover transition-colors text-left"
              >
                <Avatar user={u} size={28} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{u.name}</div>
                  <div className="text-[11px] text-fg-subtle uppercase tracking-wider">{u.role}</div>
                </div>
                <ArrowRight size={14} className="text-fg-subtle" />
              </button>
            ))}
          </div>

          <p className="mt-6 text-xs text-fg-subtle">
            Demo password: <code className="font-mono text-fg-muted">demo1234</code> · No real data leaves this device.
          </p>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-bg-subtle p-3">
      <div className="text-xl font-semibold tracking-tight tabular-nums">{value}</div>
      <div className="text-[11px] uppercase tracking-wider text-fg-subtle mt-0.5">{label}</div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="15" height="15" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.6 16 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.6 8.6 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.3 0 10.1-2 13.8-5.3l-6.4-5.4c-2 1.5-4.5 2.4-7.4 2.4-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.4 39.4 16.1 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4 5.6v.1l6.4 5.4C37.4 41 44 35 44 24c0-1.3-.1-2.4-.4-3.5z"/>
    </svg>
  );
}
