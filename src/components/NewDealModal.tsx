import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useData, getStages } from '../store/data';
import { useAuth } from '../store/auth';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import type { StageId } from '../types';

export function NewDealModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const auth = useAuth();
  const data = useData();
  const nav = useNavigate();
  const stages = getStages(data.settings);

  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactId, setContactId] = useState('');
  const [amount, setAmount] = useState('15000');
  const [stage, setStage] = useState<StageId>('lead');
  const [source, setSource] = useState('Inbound — Website');
  const [closeDate, setCloseDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });

  useEffect(() => {
    if (open) {
      setName(''); setCompanyName(''); setContactId('');
      setAmount('15000'); setStage('lead'); setSource('Inbound — Website');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!auth.user) return;
    if (!name.trim()) { toast.error('Deal name is required'); return; }
    if (!companyName.trim()) { toast.error('Company is required'); return; }

    const id = `d_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const now = Date.now();
    const close = new Date(closeDate).getTime();

    // Create or reuse contact
    let cid = contactId;
    if (!cid) {
      cid = `c_${Date.now().toString(36)}`;
      data.upsertContact({
        id: cid,
        name: 'Primary Contact',
        title: '',
        email: `contact@${companyName.toLowerCase().replace(/\W+/g, '')}.com`,
        company: companyName,
        initials: companyName.slice(0, 2).toUpperCase(),
      });
    }

    data.upsertDeal({
      id,
      name: name.trim(),
      contactId: cid,
      companyName: companyName.trim(),
      amount: Number(amount) || 0,
      stage,
      ownerUid: auth.user.uid,
      source,
      createdAt: now,
      updatedAt: now,
      closeDate: isNaN(close) ? now + 30 * 86400_000 : close,
      order: now,
    });
    data.addActivity({
      dealId: id,
      type: 'created',
      body: `Created deal · source: ${source}`,
      authorUid: auth.user.uid,
    });
    toast.success('Deal created');
    onClose();
    nav(`/app/deals/${id}`);
  }

  // Existing contacts (matched by typed company)
  const matchingContacts = data.contacts.filter((c) => c.company.toLowerCase() === companyName.trim().toLowerCase());

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] grid place-items-center px-4 py-8 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            onClick={(e) => e.stopPropagation()}
            className="card w-full max-w-lg shadow-panel overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 h-12 border-b border-line">
              <h2 className="text-sm font-semibold tracking-tight">New deal</h2>
              <button onClick={onClose} className="text-fg-subtle hover:text-fg p-1.5 rounded hover:bg-bg-hover" aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={submit} className="p-6 space-y-4">
              <Field label="Deal name">
                <input className="input" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Northwind · Annual License" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Company">
                  <input className="input" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Northwind Logistics" />
                </Field>
                <Field label="Contact">
                  <select className="input" value={contactId} onChange={(e) => setContactId(e.target.value)}>
                    <option value="">— New contact —</option>
                    {matchingContacts.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} · {c.title || 'contact'}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Amount (USD)">
                  <input className="input tabular-nums" type="number" min={0} step={500} value={amount} onChange={(e) => setAmount(e.target.value)} />
                </Field>
                <Field label="Stage">
                  <select className="input" value={stage} onChange={(e) => setStage(e.target.value as StageId)}>
                    {stages.filter((s) => !s.terminal || s.terminal === 'won').map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Source">
                  <input className="input" value={source} onChange={(e) => setSource(e.target.value)} />
                </Field>
                <Field label="Expected close">
                  <input className="input" type="date" value={closeDate} onChange={(e) => setCloseDate(e.target.value)} />
                </Field>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={onClose} className="btn-ghost text-sm">Cancel</button>
                <button type="submit" className="btn-primary text-sm">Create deal</button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="label mb-1.5">{label}</div>
      {children}
    </label>
  );
}
