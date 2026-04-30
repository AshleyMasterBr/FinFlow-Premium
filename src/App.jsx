import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context';
import Auth        from './pages/Auth';
import Onboarding  from './pages/Onboarding';
import Dashboard   from './pages/Dashboard';
import AddTransaction from './pages/AddTransaction';
import Transacoes  from './pages/Transacoes';
import Metas       from './pages/Metas';
import Relatorios  from './pages/Relatorios';
import Paywall     from './pages/Paywall';
import Perfil      from './pages/Perfil';

function AppRoutes() {
  const { session, loading, onboardingComplete } = useApp();

  // ── Loading splash ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', flexDirection: 'column', gap: 12,
        background: '#0A0A0F', color: 'rgba(255,255,255,0.25)',
        fontFamily: "'DM Sans', sans-serif", fontSize: 13,
      }}>
        <span style={{ fontSize: 36 }}>💸</span>
        <span>carregando...</span>
      </div>
    );
  }

  // ── Sem sessão → Auth ───────────────────────────────────────────────────────
  if (!session) {
    return (
      <Routes>
        <Route path="*" element={<Auth />} />
      </Routes>
    );
  }

  // ── Com sessão mas sem onboarding → Onboarding ─────────────────────────────
  if (!onboardingComplete) {
    return (
      <Routes>
        <Route path="*" element={<Onboarding />} />
      </Routes>
    );
  }

  // ── App completo ────────────────────────────────────────────────────────────
  return (
    <Routes>
      <Route path="/"              element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard"     element={<Dashboard />} />
      <Route path="/add-transaction" element={<AddTransaction />} />
      <Route path="/transacoes"    element={<Transacoes />} />
      <Route path="/metas"         element={<Metas />} />
      <Route path="/relatorios"    element={<Relatorios />} />
      <Route path="/paywall"       element={<Paywall />} />
      <Route path="/perfil"        element={<Perfil />} />
      <Route path="*"              element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}
