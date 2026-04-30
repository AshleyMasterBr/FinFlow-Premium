import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import { generateId } from '../store';
import './Onboarding.css';

// ---- Question definitions ----
const QUESTIONS = [
  {
    id: 'profile',
    step: 1,
    title: 'Qual é o seu perfil?',
    subtitle: 'Vamos personalizar tudo pra você',
    options: [
      { value: 'clt', label: 'CLT', icon: '💼', desc: 'Salário fixo todo mês' },
      { value: 'autonomo', label: 'Autônomo', icon: '🧑‍💻', desc: 'Renda variável, projetos' },
      { value: 'estudante', label: 'Estudante', icon: '🎓', desc: 'Mesada ou bico' },
      { value: 'comerciante', label: 'Comerciante', icon: '🏪', desc: 'Negócio próprio' },
    ],
  },
  {
    id: 'dificuldade',
    step: 2,
    title: 'Qual sua maior dificuldade financeira?',
    subtitle: 'Vamos destacar o que mais importa pra você',
    options: [
      { value: 'controlar', label: 'Controlar gastos', icon: '📊', desc: 'Sempre gasto mais que quero' },
      { value: 'guardar', label: 'Guardar dinheiro', icon: '🏦', desc: 'Não consigo fazer uma reserva' },
      { value: 'dividas', label: 'Pagar dívidas', icon: '💳', desc: 'Parcelamentos e dívidas' },
      { value: 'entender', label: 'Entender pra onde vai', icon: '🔍', desc: 'O dinheiro some e não sei como' },
    ],
  },
  {
    id: 'renda',
    step: 3,
    title: 'Qual a sua faixa de renda mensal?',
    subtitle: 'Isso calibra as sugestões automáticas de meta',
    options: [
      { value: 'ate2k', label: 'Até R$ 2 mil', icon: '💵', desc: 'Salário mínimo a R$ 2k' },
      { value: '2k5k', label: 'R$ 2k – 5k', icon: '💵', desc: 'Faixa mais comum no Brasil' },
      { value: '5k10k', label: 'R$ 5k – 10k', icon: '💴', desc: 'Renda acima da média' },
      { value: 'acima10k', label: 'Acima de R$ 10k', icon: '💎', desc: 'Alta renda' },
    ],
  },
  {
    id: 'temDividas',
    step: 4,
    title: 'Você tem dívidas no momento?',
    subtitle: 'Ativa ou oculta o módulo de controle de parcelas',
    options: [
      { value: 'sim', label: 'Sim', icon: '💳', desc: 'Ativa o módulo de dívidas' },
      { value: 'nao', label: 'Não', icon: '✅', desc: 'Foco em metas e gastos' },
      { value: 'prefiro-nao', label: 'Prefiro não dizer', icon: '🔒', desc: 'Pode ativar depois nas configurações' },
    ],
  },
  {
    id: 'objetivo',
    step: 5,
    title: 'Você tem um objetivo financeiro agora?',
    subtitle: 'Vai aparecer com barra de progresso no topo do dashboard',
    options: [
      { value: 'viagem', label: 'Viagem', icon: '✈️', desc: 'Juntar pra uma experiência' },
      { value: 'reserva', label: 'Reserva de emergência', icon: '🛡️', desc: 'Segurança para imprevistos' },
      { value: 'compra', label: 'Uma compra grande', icon: '🛍️', desc: 'Celular, carro, casa...' },
      { value: 'aposentadoria', label: 'Aposentadoria', icon: '🌴', desc: 'Investimento de longo prazo' },
      { value: 'nenhum', label: 'Sem objetivo agora', icon: '🎯', desc: 'Posso criar uma meta depois' },
    ],
  },
  {
    id: 'frequencia',
    step: 6,
    title: 'Com que frequência quer revisar suas finanças?',
    subtitle: 'Define a frequência dos seus lembretes',
    options: [
      { value: 'diario', label: 'Todo dia', icon: '📅', desc: 'Lembrete às 21h para registrar gastos' },
      { value: 'semanal', label: 'Semanalmente', icon: '📆', desc: 'Resumo toda segunda-feira' },
      { value: 'mensal', label: 'Mensalmente', icon: '🗓️', desc: 'Só o fechamento no fim do mês' },
    ],
  },
];

const SALARIO_MAP = {
  ate2k: 1800,
  '2k5k': 3500,
  '5k10k': 7000,
  acima10k: 12000,
};

export default function Onboarding() {
  const { completeOnboarding } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0 = welcome
  const [answers, setAnswers] = useState({});
  const [selected, setSelected] = useState(null);
  const [animating, setAnimating] = useState(false);

  const currentQ = QUESTIONS[step - 1];
  const totalSteps = QUESTIONS.length;

  const handleSelect = (value) => {
    setSelected(value);
  };

  const handleNext = async () => {
    if (step === 0) {
      setStep(1);
      return;
    }
    if (!selected) return;

    const newAnswers = { ...answers, [currentQ.id]: selected };
    setAnswers(newAnswers);
    setSelected(null);

    if (step < totalSteps) {
      setAnimating(true);
      setTimeout(() => {
        setStep(s => s + 1);
        setAnimating(false);
      }, 200);
    } else {
      // Complete onboarding — salva no Supabase
      const salario = SALARIO_MAP[newAnswers.renda] || 3500;
      await completeOnboarding({
        profileType: newAnswers.profile,
        dificuldade: newAnswers.dificuldade,
        renda:       newAnswers.renda,
        temDividas:  newAnswers.temDividas,
        objetivo:    newAnswers.objetivo,
        frequencia:  newAnswers.frequencia,
        salario,
      });
      navigate('/dashboard', { replace: true });
    }
  };

  const handleBack = () => {
    if (step <= 1) { setStep(0); return; }
    setStep(s => s - 1);
    setSelected(null);
  };

  const progress = step === 0 ? 0 : (step / totalSteps) * 100;

  if (step === 0) return <WelcomeScreen onStart={() => setStep(1)} />;

  return (
    <div className="app-shell">
      <div className="onboarding-container animate-fadeInUp">
        {/* Header */}
        <div className="onboarding-header">
          <button className="btn btn-icon" onClick={handleBack} id="onb-back-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M5 12l7-7M5 12l7 7"/>
            </svg>
          </button>
          <div className="onboarding-step-label">
            <span className="step-current">{step}</span>
            <span className="step-separator"> / </span>
            <span className="step-total">{totalSteps}</span>
          </div>
          <div style={{ width: 44 }} />
        </div>

        {/* Progress bar */}
        <div className="onboarding-progress">
          <div className="progress-bar-wrapper">
            <div className="progress-bar-fill progress-brand" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Question */}
        <div className={`onboarding-question ${animating ? 'animating' : ''}`}>
          <p className="onboarding-subtitle">{currentQ.subtitle}</p>
          <h1 className="onboarding-title">{currentQ.title}</h1>
        </div>

        {/* Options */}
        <div className="onboarding-options">
          {currentQ.options.map(opt => (
            <button
              key={opt.value}
              className={`option-card ${selected === opt.value ? 'selected' : ''}`}
              onClick={() => handleSelect(opt.value)}
              id={`onb-opt-${opt.value}`}
            >
              <span className="option-icon">{opt.icon}</span>
              <div className="option-text">
                <span className="option-label">{opt.label}</span>
                <span className="option-desc">{opt.desc}</span>
              </div>
              <div className="option-check">
                {selected === opt.value && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* CTA */}
        <div className="onboarding-footer">
          <button
            className={`btn btn-primary btn-full btn-lg ${!selected ? 'btn-disabled' : ''}`}
            onClick={handleNext}
            disabled={!selected}
            id="onb-next-btn"
          >
            {step === totalSteps ? 'Ver meu dashboard →' : 'Continuar'}
          </button>
        </div>
      </div>
    </div>
  );
}

const OBJETIVO_LABELS = {
  viagem: 'Viagem dos sonhos',
  reserva: 'Reserva de emergência',
  compra: 'Compra planejada',
  aposentadoria: 'Aposentadoria',
};
const OBJETIVO_ICONS = {
  viagem: '✈️',
  reserva: '🛡️',
  compra: '🛍️',
  aposentadoria: '🌴',
};

function WelcomeScreen({ onStart }) {
  return (
    <div className="app-shell">
      <div className="welcome-screen">
        <div className="welcome-glow" />
        <div className="welcome-content animate-fadeInUp">
          <div className="welcome-logo">
            <div className="logo-icon">🌊</div>
            <h1 className="logo-text">FinFlow</h1>
            <p className="logo-tagline">Organizador Financeiro Pessoal Adaptativo</p>
          </div>

          <div className="welcome-features">
            {[
              { icon: '🎯', text: 'Se adapta ao seu perfil' },
              { icon: '📊', text: 'Controle visual e simples' },
              { icon: '🚀', text: 'Metas que você vai alcançar' },
            ].map((f, i) => (
              <div className="welcome-feature" key={i} style={{ animationDelay: `${i * 0.1}s` }}>
                <span className="feature-icon">{f.icon}</span>
                <span className="feature-text">{f.text}</span>
              </div>
            ))}
          </div>

          <div className="welcome-cta">
            <button className="btn btn-primary btn-full btn-lg" onClick={onStart} id="welcome-start-btn">
              Começar agora →
            </button>
            <p className="welcome-note">
              6 perguntas · 2 minutos
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
