import { create } from 'zustand';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { useEffect } from 'react';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

interface ConfirmState {
  open: boolean;
  options: ConfirmOptions | null;
  resolver: ((v: boolean) => void) | null;
  ask: (opts: ConfirmOptions) => Promise<boolean>;
  resolve: (v: boolean) => void;
}

const useConfirmStore = create<ConfirmState>((set, get) => ({
  open: false,
  options: null,
  resolver: null,
  ask: (options) => new Promise<boolean>((resolve) => {
    set({ open: true, options, resolver: resolve });
  }),
  resolve: (v) => {
    const r = get().resolver;
    if (r) r(v);
    set({ open: false, options: null, resolver: null });
  },
}));

export function useConfirm() {
  return useConfirmStore((s) => s.ask);
}

export function ConfirmDialog() {
  const open = useConfirmStore((s) => s.open);
  const options = useConfirmStore((s) => s.options);
  const resolve = useConfirmStore((s) => s.resolve);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') resolve(false);
      else if (e.key === 'Enter') resolve(true);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, resolve]);

  return (
    <AnimatePresence>
      {open && options && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] grid place-items-center bg-black/60 backdrop-blur-sm px-4"
          onClick={() => resolve(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            onClick={(e) => e.stopPropagation()}
            className="card w-full max-w-md shadow-panel overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 h-12 border-b border-line">
              <span className="text-xs uppercase tracking-wider text-fg-subtle">Confirm</span>
              <button onClick={() => resolve(false)} className="text-fg-subtle hover:text-fg p-1.5 rounded hover:bg-bg-hover" aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-3">
                {options.destructive && (
                  <div className="h-9 w-9 rounded-md bg-danger/15 border border-danger/30 grid place-items-center shrink-0">
                    <AlertTriangle size={18} className="text-danger" />
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="text-base font-semibold tracking-tight text-fg">{options.title}</h2>
                  <p className="text-sm text-fg-muted mt-1.5 leading-relaxed">{options.message}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-4 h-14 border-t border-line bg-bg-subtle/40">
              <button onClick={() => resolve(false)} className="btn-ghost text-sm h-9">
                {options.cancelLabel ?? 'Cancel'}
              </button>
              <button
                onClick={() => resolve(true)}
                className={
                  options.destructive
                    ? 'btn h-9 px-4 bg-danger text-white hover:bg-danger/90'
                    : 'btn-primary text-sm h-9'
                }
              >
                {options.confirmLabel ?? 'Confirm'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
