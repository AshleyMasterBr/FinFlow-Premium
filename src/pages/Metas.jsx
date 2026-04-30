import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import { formatCurrency, getGoalProgress, generateId, canAddGoal } from '../store';
import BottomNav from '../components/BottomNav';
import './Metas.css';

const GOAL_ICONS = ['🎯', '✈️', '🛡️', '🛍️', '🏠', '🚗', '📱', '🌴', '🎓', '💍', '🏋️', '💊'];
const SUGESTAO_META_MAP = {
  ate2k: 600, '2k5k': 1050, '5k10k': 2100, acima10k: 3600,
};

export default function Metas() {
  const { data, addGoal, updateGoal, removeGoal } = useApp();
  const navigate = useNavigate();
  const [showAdd, setShowAdd] = useState(false);
  const [showDeposit, setShowDeposit] = useState(null); // goal id
  const [depositAmount, setDepositAmount] = useState('');

  const canAdd = canAddGoal(data);

  const handleAddGoal = (goal) => {
    addGoal(goal);
    setShowAdd(false);
  };

  const handleDeposit = () => {
    if (!depositAmount || !showDeposit) return;
    const amount = parseInt(depositAmount.replace(/\D/g, '')) / 100;
    const goal = data.goals.find(g => g.id === showDeposit);
    if (!goal) return;
    updateGoal(showDeposit, { current: Math.min(goal.target, goal.current + amount) });
    setShowDeposit(null);
    setDepositAmount('');
  };

  return (
    <div className="app-shell">
      <div className="page-header">
        <button className="btn btn-icon" onClick={() => navigate('/dashboard')} id="metas-back-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M5 12l7-7M5 12l7 7"/>
          </svg>
        </button>
        <h1 className="page-title">Metas</h1>
        <button
          className="btn btn-icon"
          onClick={() => canAdd ? setShowAdd(true) : navigate('/paywall')}
          id="metas-add-btn"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>

      <div className="page-content">
        {/* Sugestão de meta */}
        {data.goals.length === 0 && data.renda && (
          <SugestaoMeta renda={data.renda} salario={data.salario} onAdd={handleAddGoal} />
        )}

        {/* Goals list */}
        {data.goals.length === 0 && !data.renda && (
          <div className="section-card empty-state" style={{ margin: '20px' }}>
            <div className="empty-icon">🎯</div>
            <div className="empty-title">Nenhuma meta ainda</div>
            <div className="empty-desc">Crie sua primeira meta financeira e acompanhe seu progresso</div>
            <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={() => setShowAdd(true)} id="metas-create-first-btn">
              Criar meta
            </button>
          </div>
        )}

        {data.goals.map(goal => (
          <GoalCard
            key={goal.id}
            goal={goal}
            onDeposit={() => setShowDeposit(goal.id)}
            onRemove={() => removeGoal(goal.id)}
          />
        ))}

        {/* Free plan limit */}
        {!data.premium && data.goals.length >= data.GOAL_LIMIT_FREE && (
          <div className="premium-gate" onClick={() => navigate('/paywall')} style={{ margin: '0 20px 16px' }}>
            <div className="gate-inner">
              <span className="gate-icon">🔒</span>
              <div>
                <div className="gate-title">Metas ilimitadas</div>
                <div className="gate-desc">Crie quantas metas quiser com Premium</div>
              </div>
              <span className="gate-arrow">›</span>
            </div>
          </div>
        )}
      </div>

      {/* Add Goal Modal */}
      {showAdd && (
        <AddGoalSheet
          salario={data.salario}
          onClose={() => setShowAdd(false)}
          onAdd={handleAddGoal}
        />
      )}

      {/* Deposit Modal */}
      {showDeposit && (
        <div className="modal-overlay" onClick={() => setShowDeposit(null)}>
          <div className="bottom-sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle" />
            <h2 className="sheet-title">Adicionar progresso</h2>
            <p className="sheet-desc">Quanto você guardou para esta meta?</p>
            <div className="amount-input-wrapper" style={{ padding: '20px 0' }}>
              <span className="amount-currency">R$</span>
              <input
                className="amount-input"
                type="tel"
                inputMode="numeric"
                placeholder="0,00"
                value={depositAmount ? (parseInt(depositAmount.replace(/\D/g,'')) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : ''}
                onChange={e => setDepositAmount(e.target.value.replace(/\D/g,''))}
                id="deposit-amount-input"
                autoFocus
              />
            </div>
            <button className="btn btn-primary btn-full" onClick={handleDeposit} id="deposit-confirm-btn">
              Confirmar
            </button>
          </div>
        </div>
      )}

      <BottomNav active="metas" onAdd={() => navigate('/add-transaction')} />
    </div>
  );
}

function GoalCard({ goal, onDeposit, onRemove }) {
  const progress = getGoalProgress(goal);
  const isDone = progress >= 100;

  return (
    <div className={`goal-card-full ${isDone ? 'goal-done' : ''}`} id={`goal-${goal.id}`}>
      <div className="goal-card-header">
        <div className="goal-icon-wrap">
          <span className="goal-icon-big">{goal.icon}</span>
        </div>
        <div className="goal-card-info">
          <div className="goal-card-label">{isDone ? '✅ Meta alcançada!' : 'Meta ativa'}</div>
          <div className="goal-card-name">{goal.label}</div>
        </div>
        <button className="btn btn-icon" onClick={onRemove} id={`goal-remove-${goal.id}`} style={{ opacity: 0.5 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
          </svg>
        </button>
      </div>

      <div className="goal-amounts">
        <span className="goal-current">{formatCurrency(goal.current)}</span>
        <span className="goal-target">de {formatCurrency(goal.target)}</span>
      </div>

      <div className="progress-bar-wrapper" style={{ margin: '12px 0 6px' }}>
        <div
          className={`progress-bar-fill ${isDone ? 'progress-accent' : 'progress-brand'}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="goal-footer">
        <span className="goal-pct">{progress}% concluído</span>
        {!isDone && (
          <button className="btn btn-secondary btn-sm" onClick={onDeposit} id={`goal-deposit-${goal.id}`}>
            + Adicionar
          </button>
        )}
      </div>
    </div>
  );
}

function SugestaoMeta({ renda, salario, onAdd }) {
  const suggested = SUGESTAO_META_MAP[renda] || 1000;
  return (
    <div className="sugestao-card" id="sugestao-meta-card">
      <div className="sugestao-header">
        <span className="sugestao-icon">💡</span>
        <div>
          <div className="sugestao-title">Sugestão de meta</div>
          <div className="sugestao-desc">Baseada na sua faixa de renda</div>
        </div>
      </div>
      <div className="sugestao-amount">{formatCurrency(suggested)}/mês</div>
      <div className="sugestao-info">Reserve este valor mensalmente para uma reserva de emergência (3–6 meses de gastos).</div>
      <button
        className="btn btn-secondary btn-sm"
        style={{ marginTop: 12 }}
        onClick={() => onAdd({
          id: generateId(),
          label: 'Reserva de emergência',
          icon: '🛡️',
          target: suggested * 6,
          current: 0,
          createdAt: new Date().toISOString(),
        })}
        id="sugestao-accept-btn"
      >
        Usar esta sugestão
      </button>
    </div>
  );
}

function AddGoalSheet({ onClose, onAdd }) {
  const [label, setLabel] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [target, setTarget] = useState('');

  const handleSave = () => {
    if (!label.trim() || !target) return;
    onAdd({
      id: generateId(),
      label: label.trim(),
      icon,
      target: parseInt(target.replace(/\D/g, '')) / 100,
      current: 0,
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="bottom-sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <h2 className="sheet-title">Nova meta</h2>

        <div className="add-goal-form">
          <div className="input-group">
            <label className="input-label">Ícone</label>
            <div className="icon-picker">
              {GOAL_ICONS.map(ic => (
                <button
                  key={ic}
                  className={`icon-btn ${icon === ic ? 'icon-btn-selected' : ''}`}
                  onClick={() => setIcon(ic)}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Nome da meta</label>
            <input
              className="input-field"
              placeholder="Ex: Viagem para a Europa"
              value={label}
              onChange={e => setLabel(e.target.value)}
              id="goal-label-input"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Valor alvo (R$)</label>
            <input
              className="input-field"
              type="tel"
              inputMode="numeric"
              placeholder="0,00"
              value={target ? (parseInt(target.replace(/\D/g,''))/100).toLocaleString('pt-BR',{minimumFractionDigits:2}) : ''}
              onChange={e => setTarget(e.target.value.replace(/\D/g,''))}
              id="goal-target-input"
            />
          </div>

          <button
            className="btn btn-primary btn-full"
            onClick={handleSave}
            disabled={!label.trim() || !target}
            id="goal-save-btn"
          >
            Criar meta
          </button>
        </div>
      </div>
    </div>
  );
}
