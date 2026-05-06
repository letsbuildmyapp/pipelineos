import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { CommandPalette } from './components/CommandPalette';
import { ConfirmDialog } from './components/ConfirmDialog';
import { Tutorial } from './components/Tutorial';
import { NewDealModal } from './components/NewDealModal';
import { Login } from './pages/Login';
import { NotFound, ServerError } from './pages/NotFound';
import { Pipeline } from './pages/Pipeline';
import { Deals } from './pages/Deals';
import { DealDetail } from './pages/DealDetail';
import { Contacts } from './pages/Contacts';
import { Reports } from './pages/Reports';
import { Team } from './pages/Team';
import { Admin } from './pages/Admin';
import { useAuth } from './store/auth';

export function App() {
  const auth = useAuth();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [newDealOpen, setNewDealOpen] = useState(false);

  // ⌘K palette globally
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (auth.user) setPaletteOpen((v) => !v);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [auth.user]);

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to={auth.user ? '/app/pipeline' : '/login'} replace />} />
        <Route path="/login" element={auth.user ? <Navigate to="/app/pipeline" replace /> : <Login />} />
        <Route path="/500" element={<ServerError />} />

        <Route
          path="/app/*"
          element={
            <RequireAuth>
              <AppShell onOpenPalette={() => setPaletteOpen(true)}>
                <Routes>
                  <Route index element={<Navigate to="pipeline" replace />} />
                  <Route path="pipeline"      element={<Pipeline onNewDeal={() => setNewDealOpen(true)} />} />
                  <Route path="deals"         element={<Deals onNewDeal={() => setNewDealOpen(true)} />} />
                  <Route path="deals/:id"     element={<DealDetail />} />
                  <Route path="contacts"      element={<Contacts />} />
                  <Route path="reports"       element={<RequireRole roles={['manager', 'admin']}><Reports /></RequireRole>} />
                  <Route path="team"          element={<RequireRole roles={['manager', 'admin']}><Team /></RequireRole>} />
                  <Route path="admin"         element={<RequireRole roles={['admin']}><Admin /></RequireRole>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AppShell>
            </RequireAuth>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onNewDeal={() => setNewDealOpen(true)}
      />
      <NewDealModal open={newDealOpen} onClose={() => setNewDealOpen(false)} />
      <Tutorial />
      <ConfirmDialog />
    </>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const loc = useLocation();
  if (!auth.user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  return <>{children}</>;
}

function RequireRole({ roles, children }: { roles: ('rep' | 'manager' | 'admin')[]; children: React.ReactNode }) {
  const auth = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (auth.user && !roles.includes(auth.user.role)) nav('/app/pipeline', { replace: true });
  }, [auth.user, roles, nav]);
  if (!auth.user || !roles.includes(auth.user.role)) return null;
  return <>{children}</>;
}
