import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import { PAYMENT_LINK } from '../supabase';
import './Paywall.css';

const FEATURES_FREE = [
  '30 transações por mês',
  '5 categorias',
  '1 meta ativa',
  'Histórico de 3 meses',
  'Relatório básico',
];

const FEATURES_PREMIUM = [
  'Transações ilimitadas',
  'Categorias ilimitadas',
  'Metas ilimitadas',
  'Relatórios avançados',
  'Módulo de dívidas',
  'Exportação CSV',
  'Backup na nuvem',
  'Histórico ilimitado',
  'Suporte prioritário',
];

export default function Paywall() {
  const { data, update } = useApp();
  const navigate = useNavigate();

  const handleUpgrade = () => {
    // Abre o Stripe Payment Link com e-mail pré-preenchido
    const email = data.session?.user?.email || ''
    const url   = email
      ? `${PAYMENT_LINK}?prefilled_email=${encodeURIComponent(email)}`
      : PAYMENT_LINK
    window.open(url, '_blank')
  };

  if (data.premium) {
    return (
      <div className="app-shell">
        <div className="paywall-already">
          <div className="paywall-already-icon">👑</div>
          <h1 className="paywall-already-title">Você já é Premium!</h1>
          <p className="paywall-already-desc">Aproveite todos os recursos ilimitados.</p>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')} id="paywall-back-dash-btn">
            Voltar ao dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="paywall-container">
        {/* Close */}
        <div className="paywall-top">
          <button className="btn btn-icon" onClick={() => navigate(-1)} id="paywall-close-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Hero */}
        <div className="paywall-hero">
          <div className="paywall-badge">
            <span>👑</span> FinFlow Premium
          </div>
          <h1 className="paywall-title">
            Desbloqueie tudo e{' '}
            <span className="gradient-text">organize de verdade</span>
          </h1>
          <p className="paywall-subtitle">
            Você está usando o FinFlow de forma ativa. Dê o próximo passo.
          </p>
        </div>

        {/* Comparison */}
        <div className="plan-comparison">
          {/* Free */}
          <div className="plan-card plan-free">
            <div className="plan-name">Gratuito</div>
            <div className="plan-price">R$ 0</div>
            <div className="plan-features">
              {FEATURES_FREE.map((f, i) => (
                <div className="plan-feature plan-feature-free" key={i}>
                  <span className="feature-check-icon muted">○</span>
                  {f}
                </div>
              ))}
            </div>
          </div>

          {/* Premium */}
          <div className="plan-card plan-premium">
            <div className="plan-badge-rec">⭐ Recomendado</div>
            <div className="plan-name">Premium</div>
            <div className="plan-price-wrap">
              <div className="plan-price gradient-text">R$ 19,90</div>
              <div className="plan-period">/mês</div>
            </div>
            <div className="plan-features">
              {FEATURES_PREMIUM.map((f, i) => (
                <div className="plan-feature" key={i}>
                  <span className="feature-check-icon">✓</span>
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="paywall-cta">
          <button className="btn btn-primary btn-full btn-lg" onClick={handleUpgrade} id="paywall-upgrade-btn">
            👑 Assinar Premium — R$ 19,90/mês
          </button>
          <button className="btn btn-ghost btn-full" onClick={() => navigate(-1)} id="paywall-skip-btn">
            Continuar com o plano gratuito
          </button>
          <p className="paywall-disclaimer">
            Cancele a qualquer momento. Sem multas ou taxas ocultas.
          </p>
        </div>
      </div>
    </div>
  );
}
