import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { useData } from './data';

interface AuthState {
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  signInAs: (uid: string) => void;
  signOut: () => void;
}

const PASSWORD = 'demo1234';

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      signIn: async (email, password) => {
        await new Promise((r) => setTimeout(r, 250));
        if (password !== PASSWORD) throw new Error('Wrong password. (Demo password: demo1234)');
        const users = useData.getState().users;
        const u = users.find((x) => x.email.toLowerCase() === email.toLowerCase());
        if (!u) throw new Error('No account with that email.');
        set({ user: u });
      },
      signInGoogle: async () => {
        await new Promise((r) => setTimeout(r, 350));
        // Demo: pretend Google auth signed in the manager
        const u = useData.getState().users.find((x) => x.role === 'manager')!;
        set({ user: u });
      },
      signInAs: (uid) => {
        const u = useData.getState().users.find((x) => x.uid === uid);
        if (u) set({ user: u });
      },
      signOut: () => set({ user: null }),
    }),
    { name: 'pipelineos:auth:v1' },
  ),
);
