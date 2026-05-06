import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggle: () => void;
  set: (t: Theme) => void;
}

function apply(t: Theme) {
  if (t === 'dark') document.documentElement.classList.add('dark');
  else document.documentElement.classList.remove('dark');
  localStorage.setItem('pipelineos:theme', t);
}

const initial: Theme = (localStorage.getItem('pipelineos:theme') as Theme) ?? 'dark';

export const useTheme = create<ThemeState>((set, get) => ({
  theme: initial,
  toggle: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    apply(next);
    set({ theme: next });
  },
  set: (t) => { apply(t); set({ theme: t }); },
}));
