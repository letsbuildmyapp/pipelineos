import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { App } from './App';
import './index.css';

const qc = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
});

// Theme bootstrap (must run before paint to avoid flash)
const stored = localStorage.getItem('pipelineos:theme');
if (stored === 'light') document.documentElement.classList.remove('dark');
else document.documentElement.classList.add('dark');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <App />
        <Toaster
          theme="system"
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'rgb(var(--bg-panel))',
              color: 'rgb(var(--fg))',
              border: '1px solid rgb(var(--line-strong))',
              fontFamily: 'Geist, system-ui, sans-serif',
              fontSize: '14px',
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
