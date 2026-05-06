import { useState, useEffect, useLayoutEffect, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Sparkles, Search, ArrowRight, ArrowLeft, X, Kanban, BarChart3, Users as UsersIcon, ShieldCheck, ListChecks,
} from 'lucide-react';
import { useAuth } from '../store/auth';

const KEY_PREFIX = 'pipelineos:tutorial_seen:';
const MOBILE_BREAKPOINT = 768;

type Step = {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  body: React.ReactNode;
  target?: string;
  placement?: 'right' | 'left' | 'top' | 'bottom';
};

const REP_STEPS: Step[] = [
  { icon: Sparkles, title: 'Welcome to PipelineOS', body: 'Your personal sales workspace. 30 seconds to get oriented.' },
  { icon: ListChecks, title: "You're a sales rep", body: <>You see only <span className="text-fg font-medium">your own deals</span>. Managers see the whole team; admins manage settings.</>, target: 'brand', placement: 'right' },
  { icon: Search, title: 'Press ⌘K to jump anywhere', body: 'Open the command palette from any screen — search deals, navigate, create new.', target: 'search', placement: 'right' },
  { icon: Kanban, title: 'Pipeline kanban', body: <>Drag deals between stages. The <span className="text-fg font-medium">cyan insertion line</span> shows exactly where the card will land. Stage changes are logged automatically.</>, target: 'nav-pipeline', placement: 'right' },
  { icon: ListChecks, title: 'Deal detail', body: 'Open any deal to log notes, calls, emails, meetings, and tasks. Every change shows up in the activity timeline.' },
  { icon: Sparkles, title: "You're set", body: <>Built by <a href="https://letsbuildmyapp.com" className="text-accent hover:underline">letsbuildmyapp.com</a>.</> },
];

const MANAGER_STEPS: Step[] = [
  { icon: Sparkles, title: 'Welcome, manager', body: 'Team-wide visibility into your sales pipeline. Quick tour.' },
  { icon: UsersIcon, title: 'See every rep', body: <>Filter by individual rep, or watch the whole team. The <span className="text-fg font-medium">Team</span> page surfaces a leaderboard.</>, target: 'brand', placement: 'right' },
  { icon: Search, title: '⌘K jumps anywhere', body: 'Recent deals, navigation, and quick actions all live in the command palette.', target: 'search', placement: 'right' },
  { icon: Kanban, title: 'Pipeline view', body: 'Drag any rep\'s deal across stages. The weighted forecast at the top updates in real time.', target: 'nav-pipeline', placement: 'right' },
  { icon: BarChart3, title: 'Reports', body: 'Win rate, cycle time, deals by stage, and rep leaderboard. Filter by quarter.', target: 'nav-reports', placement: 'right' },
  { icon: Sparkles, title: "You're set", body: <>Built by <a href="https://letsbuildmyapp.com" className="text-accent hover:underline">letsbuildmyapp.com</a>.</> },
];

const ADMIN_STEPS: Step[] = [
  { icon: Sparkles, title: 'Welcome, admin', body: 'Full control of users, stages, and permissions.' },
  { icon: ShieldCheck, title: 'Manage users', body: <>Invite, edit, or remove sales reps and managers. Set quotas per rep.</>, target: 'brand', placement: 'right' },
  { icon: Search, title: '⌘K is everywhere', body: 'Search deals, jump to settings, reseed demo data — all from the palette.', target: 'search', placement: 'right' },
  { icon: Kanban, title: 'Customize stages', body: 'Rename or reorder pipeline stages from the Admin page. Probabilities feed the weighted forecast.', target: 'nav-pipeline', placement: 'right' },
  { icon: BarChart3, title: 'Reports & permissions', body: 'Toggle what reps can edit, who can invite, and view team-wide reporting.', target: 'nav-reports', placement: 'right' },
  { icon: Sparkles, title: "You're set", body: <>Built by <a href="https://letsbuildmyapp.com" className="text-accent hover:underline">letsbuildmyapp.com</a>.</> },
];

type Rect = { top: number; left: number; width: number; height: number };

export function Tutorial() {
  const auth = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window === 'undefined' ? false : window.innerWidth < MOBILE_BREAKPOINT,
  );

  const role = auth.user?.role;
  const STEPS = useMemo<Step[]>(() => {
    if (role === 'admin') return ADMIN_STEPS;
    if (role === 'manager') return MANAGER_STEPS;
    return REP_STEPS;
  }, [role]);

  useEffect(() => { setStep(0); }, [STEPS]);

  useEffect(() => {
    if (!role) { setOpen(false); return; }
    const seen = localStorage.getItem(KEY_PREFIX + role);
    setOpen(!seen);
    setStep(0);
  }, [role]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  const close = useCallback(() => {
    if (role) localStorage.setItem(KEY_PREFIX + role, '1');
    setOpen(false);
  }, [role]);

  const next = useCallback(() => {
    setStep((s) => {
      if (s < STEPS.length - 1) return s + 1;
      close();
      return s;
    });
  }, [close, STEPS.length]);

  const back = useCallback(() => setStep((s) => Math.max(0, s - 1)), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); back(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close, next, back]);

  const currentStep = STEPS[step];
  const targetSel = currentStep?.target;

  useLayoutEffect(() => {
    if (!open || isMobile || !targetSel) { setRect(null); return; }
    const compute = () => {
      const el = document.querySelector(`[data-tour="${targetSel}"]`) as HTMLElement | null;
      if (!el) { setRect(null); return; }
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    compute();
    const onResize = () => compute();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [open, isMobile, targetSel, step]);

  if (!open || !currentStep) return null;

  const hasTarget = !!rect && !!targetSel;
  if (isMobile || !hasTarget) {
    return <CenteredModal steps={STEPS} step={step} onClose={close} onNext={next} onBack={back} onJump={setStep} />;
  }

  const Icon = currentStep.icon;
  const isLast = step === STEPS.length - 1;

  const PAD = 16;
  const TOOLTIP_W = 360;
  const TOOLTIP_H_EST = 280;
  let top = 0;
  let left = 0;
  if (rect) {
    const placement = currentStep.placement ?? 'right';
    if (placement === 'right') {
      left = rect.left + rect.width + PAD;
      top = rect.top;
      if (left + TOOLTIP_W > window.innerWidth - PAD) {
        left = rect.left;
        top = rect.top + rect.height + PAD;
      }
    } else if (placement === 'left') {
      left = rect.left - TOOLTIP_W - PAD;
      top = rect.top;
    } else if (placement === 'bottom') {
      left = rect.left;
      top = rect.top + rect.height + PAD;
    } else if (placement === 'top') {
      left = rect.left;
      top = rect.top - TOOLTIP_H_EST - PAD;
    }
    left = Math.min(Math.max(PAD, left), window.innerWidth - TOOLTIP_W - PAD);
    top = Math.min(Math.max(PAD, top), window.innerHeight - TOOLTIP_H_EST - PAD);
  }

  return (
    <AnimatePresence>
      <motion.div
        key="spot-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100]"
        onClick={close}
      >
        {hasTarget && rect && (
          <motion.div
            initial={false}
            animate={{ top: rect.top - 6, left: rect.left - 6, width: rect.width + 12, height: rect.height + 12 }}
            transition={{ type: 'spring', stiffness: 360, damping: 32 }}
            className="absolute rounded-md pointer-events-none"
            style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.72), 0 0 0 2px rgb(var(--accent))' }}
          />
        )}
      </motion.div>
      <motion.div
        key={`tip-${step}`}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.18 }}
        role="dialog"
        aria-modal="true"
        className="fixed z-[101] w-[360px] rounded-md border border-line-strong bg-bg-panel shadow-panel overflow-hidden"
        style={{ top, left }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 h-11 border-b border-line">
          <span className="text-xs uppercase tracking-wider text-fg-subtle">
            Tour · <span className="tabular-nums">{step + 1}</span> of <span className="tabular-nums">{STEPS.length}</span>
          </span>
          <button onClick={close} className="text-fg-subtle hover:text-fg p-1.5 rounded hover:bg-bg-hover" aria-label="Close tour">
            <X size={16} />
          </button>
        </div>
        <div className="p-5">
          <div className="h-10 w-10 rounded-md bg-accent/15 border border-accent/30 grid place-items-center mb-4">
            <Icon size={18} className="text-accent" />
          </div>
          <h2 className="text-lg font-semibold tracking-tight">{currentStep.title}</h2>
          <div className="text-sm text-fg-muted mt-2 leading-relaxed">{currentStep.body}</div>
        </div>
        <div className="flex items-center justify-between px-4 h-12 border-t border-line bg-bg-subtle/40">
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                aria-label={`Go to step ${i + 1}`}
                className={i === step
                  ? 'h-1.5 w-5 rounded-full bg-accent transition-all'
                  : 'h-1.5 w-1.5 rounded-full bg-line-strong hover:bg-fg-subtle transition-all'}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {step > 0 ? (
              <button onClick={back} className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-xs text-fg-muted hover:text-fg hover:bg-bg-hover transition-colors">
                <ArrowLeft size={13} /> Back
              </button>
            ) : (
              <button onClick={close} className="inline-flex items-center h-8 px-2.5 rounded-md text-xs text-fg-subtle hover:text-fg transition-colors">Skip</button>
            )}
            <button onClick={next} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium bg-accent hover:bg-accent-hover text-[rgb(var(--accent-fg))] transition-colors">
              {isLast ? 'Done' : 'Next'} {!isLast ? <ArrowRight size={13} /> : null}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function CenteredModal({ steps, step, onClose, onNext, onBack, onJump }: {
  steps: Step[]; step: number; onClose: () => void; onNext: () => void; onBack: () => void; onJump: (i: number) => void;
}) {
  const current = steps[step];
  const Icon = current.icon;
  const isLast = step === steps.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        key="modal-backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] grid place-items-center px-4 py-8 bg-black/72 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          key={`step-${step}`}
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.18 }}
          className="w-full max-w-md rounded-md border border-line-strong bg-bg-panel shadow-panel overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 h-12 border-b border-line">
            <span className="text-xs uppercase tracking-wider text-fg-subtle">
              Tour · <span className="tabular-nums">{step + 1}</span> of <span className="tabular-nums">{steps.length}</span>
            </span>
            <button onClick={onClose} className="text-fg-subtle hover:text-fg p-1.5 rounded hover:bg-bg-hover" aria-label="Close tour">
              <X size={16} />
            </button>
          </div>
          <div className="p-6">
            <div className="h-12 w-12 rounded-md bg-accent/15 border border-accent/30 grid place-items-center mb-4">
              <Icon size={20} className="text-accent" />
            </div>
            <h2 className="text-xl font-semibold tracking-tight">{current.title}</h2>
            <div className="text-base text-fg-muted mt-3 leading-relaxed">{current.body}</div>
          </div>
          <div className="flex items-center justify-between px-4 h-14 border-t border-line bg-bg-subtle/40">
            <div className="flex items-center gap-1.5">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => onJump(i)}
                  aria-label={`Go to step ${i + 1}`}
                  className={i === step
                    ? 'h-1.5 w-6 rounded-full bg-accent transition-all'
                    : 'h-1.5 w-1.5 rounded-full bg-line-strong hover:bg-fg-subtle transition-all'}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              {step > 0 ? (
                <button onClick={onBack} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-sm text-fg-muted hover:text-fg hover:bg-bg-hover transition-colors">
                  <ArrowLeft size={14} /> Back
                </button>
              ) : (
                <button onClick={onClose} className="inline-flex items-center h-9 px-3 rounded-md text-sm text-fg-subtle hover:text-fg transition-colors">Skip</button>
              )}
              <button onClick={onNext} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md text-sm font-medium bg-accent hover:bg-accent-hover text-[rgb(var(--accent-fg))] transition-colors">
                {isLast ? 'Done' : 'Next'} {!isLast ? <ArrowRight size={14} /> : null}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
