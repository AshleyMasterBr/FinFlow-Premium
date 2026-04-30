import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context';
import {
  formatCurrency,
  getCurrentMonthTransactions,
  getTotalByType,
  getSpendByCategory,
  getTransactionCountThisMonth,
  getAverageMonthlyIncome,
  getMonthlyHistory,
  canAddTransaction,
} from '../store';
import BottomNav from '../components/BottomNav';
import './Dashboard.css';

const PROFILE_LABELS = { clt: 'CLT', autonomo: 'Autônomo', estudante: 'Estudante', comerciante: 'Comerciante' };
const DIFFICULTY_HIGHLIGHT = { dividas: 'dividas', guardar: 'metas', controlar: 'gastos', entender: 'gastos' };

export default function Dashboard() {
  const { data } = useApp();
  const navigate = useNavigate();

  const monthTxs = getCurrentMonthTransactions(data.transactions);
  const income = getTotalByType(monthTxs, 'income');
  const expense = getTotalByType(monthTxs, 'expense');
  const balance = income - expense;
  const salario = data.salario || 0;
  const transactionCount = getTransactionCountThisMonth(data.transactions);
  const limitUsed = Math.round((transactionCount / data.TRANSACTION_LIMIT_FREE) * 100);

  const spendByCategory = getSpendByCategory(data.transactions);
  const activeGoal = data.goals[0] || null;

  const history = getMonthlyHistory(data.transactions, 3);
  const avgIncome = getAverageMonthlyIncome(data.transactions, 3);

  const isAutonomo = data.profile === 'autonomo';
  const isCLT = data.profile === 'clt';

  const currentMonth = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toLowerCase();

  const recentTxs = data.transactions.slice(0, 5);

  return (
    <div className="app-shell">
      <div className="page-content">
        {/* Header */}
        <div className="dashboard-header">
          <div className="dashboard-greeting">
            <span className="greeting-month">{currentMonth}</span>
          </div>
          <div className="header-right">
            <span className="badge badge-muted">{(PROFILE_LABELS[data.profile] || 'usuário').toLowerCase()}</span>
            {data.premium && <span className="badge badge-brand" style={{ marginLeft: 6 }}>pro</span>}
          </div>
        </div>

        {/* Hero Card */}
        {isCLT && (
          <CLTHeroCard
            salario={salario}
            income={income}
            expense={expense}
            balance={balance}
          />
        )}
        {isAutonomo && (
          <AutonomoHeroCard
            income={income}
            expense={expense}
            balance={balance}
            history={history}
            avgIncome={avgIncome}
          />
        )}
        {!isCLT && !isAutonomo && (
          <GenericHeroCard income={income} expense={expense} balance={balance} />
        )}

        {/* Goal Card */}
        {activeGoal && (
          <GoalCard goal={activeGoal} navigate={navigate} />
        )}

        {/* Dívidas highlight */}
        {data.dificuldade === 'dividas' && data.temDividas === 'sim' && (
          <DebtAlert navigate={navigate} />
        )}

        {/* Spend by Category */}
        {Object.keys(spendByCategory).length > 0 && (
          <SpendCategoryCard
            spendByCategory={spendByCategory}
            categories={data.categories}
            navigate={navigate}
          />
        )}

        {/* Transaction Limit (Free) */}
        {!data.premium && (
          <TransactionLimitCard
            count={transactionCount}
            limit={data.TRANSACTION_LIMIT_FREE}
            limitUsed={limitUsed}
            navigate={navigate}
          />
        )}

        {/* Recent Transactions */}
        <RecentTransactions transactions={recentTxs} categories={data.categories} navigate={navigate} />

        {/* Month Alert for Autônomo */}
        {isAutonomo && avgIncome > 0 && income < avgIncome * 0.8 && (
          <WeakMonthAlert income={income} avgIncome={avgIncome} />
        )}
      </div>

      {/* Add Transaction FAB */}
      <BottomNav active="home" onAdd={() => {
        if (!canAddTransaction(data)) {
          navigate('/paywall');
        } else {
          navigate('/add-transaction');
        }
      }} />
    </div>
  );
}

/* ---- CLT Hero Card ---- */
function CLTHeroCard({ salario, income, expense, balance }) {
  const percentSpent = salario > 0 ? Math.min(100, Math.round((expense / salario) * 100)) : 0;
  const isOver = expense > (salario || income);

  return (
    <div className="hero-card animate-fadeInUp">
      <div className="hero-card-inner">
        <div className="hero-label">Saldo disponível</div>
        <div className={`hero-amount ${balance < 0 ? 'negative' : ''}`}>
          {formatCurrency(Math.max(0, balance))}
        </div>
        {salario > 0 && (
          <>
            <div className="hero-spend-bar-label">
              <span>Gastos vs. salário</span>
              <span className={isOver ? 'text-danger' : 'text-accent'}>{percentSpent}%</span>
            </div>
            <div className="progress-bar-wrapper">
              <div
                className={`progress-bar-fill ${isOver ? 'progress-danger' : 'progress-accent'}`}
                style={{ width: `${percentSpent}%` }}
              />
            </div>
          </>
        )}
        <div className="hero-row mt-16">
          <StatPill label="Receitas" value={formatCurrency(income)} color="accent" icon="↑" />
          <StatPill label="Gastos" value={formatCurrency(expense)} color="danger" icon="↓" />
        </div>
      </div>
    </div>
  );
}

/* ---- Autônomo Hero Card ---- */
function AutonomoHeroCard({ income, expense, balance, history, avgIncome }) {
  const prevMonth = history[history.length - 2];
  const prevIncome = prevMonth?.income || 0;
  const diff = prevIncome > 0 ? ((income - prevIncome) / prevIncome) * 100 : 0;
  const isUp = diff >= 0;

  return (
    <div className="hero-card hero-card--autonomo animate-fadeInUp">
      <div className="hero-card-inner">
        <div className="hero-label">Receita recebida este mês</div>
        <div className="hero-amount">{formatCurrency(income)}</div>
        {prevIncome > 0 && (
          <div className={`hero-compare ${isUp ? 'text-accent' : 'text-danger'}`}>
            {isUp ? '↑' : '↓'} {Math.abs(diff).toFixed(1)}% vs. mês anterior ({formatCurrency(prevIncome)})
          </div>
        )}
        <div className="hero-row mt-16">
          <StatPill label="Gastos" value={formatCurrency(expense)} color="danger" icon="↓" />
          <StatPill label="Saldo" value={formatCurrency(balance)} color={balance >= 0 ? 'accent' : 'danger'} icon="=" />
        </div>
      </div>
    </div>
  );
}

/* ---- Generic Hero ---- */
function GenericHeroCard({ income, expense, balance }) {
  return (
    <div className="hero-card animate-fadeInUp">
      <div className="hero-card-inner">
        <div className="hero-label">Saldo do mês</div>
        <div className={`hero-amount ${balance < 0 ? 'negative' : ''}`}>{formatCurrency(balance)}</div>
        <div className="hero-row mt-16">
          <StatPill label="Receitas" value={formatCurrency(income)} color="accent" icon="↑" />
          <StatPill label="Gastos" value={formatCurrency(expense)} color="danger" icon="↓" />
        </div>
      </div>
    </div>
  );
}

function StatPill({ label, value, color, icon }) {
  const colorMap = { accent: 'var(--brand-accent)', danger: 'var(--brand-danger)', brand: 'var(--brand-primary)' };
  return (
    <div className="stat-pill">
      <span className="stat-icon" style={{ color: colorMap[color] }}>{icon}</span>
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value" style={{ color: colorMap[color] }}>{value}</div>
      </div>
    </div>
  );
}

/* ---- Goal Card ---- */
function GoalCard({ goal, navigate }) {
  const progress = goal.target > 0 ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0;
  return (
    <div className="section-card animate-fadeInUp" id="goal-card" onClick={() => navigate('/metas')}>
      <div className="section-header">
        <div className="section-title-row">
          <span className="section-icon">{goal.icon}</span>
          <div>
            <div className="section-label">Meta principal</div>
            <div className="section-title">{goal.label}</div>
          </div>
        </div>
        <span className="section-caret">›</span>
      </div>
      <div className="goal-amounts">
        <span className="goal-current">{formatCurrency(goal.current)}</span>
        <span className="goal-target">de {formatCurrency(goal.target)}</span>
      </div>
      <div className="progress-bar-wrapper" style={{ marginTop: 10 }}>
        <div className="progress-bar-fill progress-brand" style={{ width: `${progress}%` }} />
      </div>
      <div className="goal-progress-label">{progress}% concluído</div>
    </div>
  );
}

/* ---- Debt Alert ---- */
function DebtAlert({ navigate }) {
  return (
    <div className="debt-alert" onClick={() => navigate('/dividas')} id="debt-alert-card">
      <div className="debt-alert-inner">
        <span className="debt-icon">💳</span>
        <div>
          <div className="debt-title">Módulo de Dívidas</div>
          <div className="debt-desc">Controle suas parcelas e veja quando vai quitar</div>
        </div>
        <span className="section-caret">›</span>
      </div>
    </div>
  );
}

/* ---- Spend by Category ---- */
function SpendCategoryCard({ spendByCategory, categories, navigate }) {
  const total = Object.values(spendByCategory).reduce((s, v) => s + v, 0);
  const sorted = Object.entries(spendByCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <div className="section-card animate-fadeInUp" id="spend-category-card">
      <div className="section-header" onClick={() => navigate('/relatorios')}>
        <div className="section-title-row">
          <span className="section-icon">📊</span>
          <div>
            <div className="section-label">Este mês</div>
            <div className="section-title">Gastos por categoria</div>
          </div>
        </div>
        <span className="section-caret">›</span>
      </div>
      <div className="category-list">
        {sorted.map(([catId, amount]) => {
          const cat = categories.find(c => c.id === catId);
          const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
          return (
            <div className="category-row" key={catId}>
              <span className={`category-dot cat-${cat?.color || 'outros'}`}>{cat?.icon || '📦'}</span>
              <div className="category-info">
                <span className="category-name">{cat?.label || catId}</span>
                <div className="category-bar-wrap">
                  <div className={`category-bar cat-bar-${cat?.color || 'outros'}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
              <span className="category-amount">{formatCurrency(amount)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---- Transaction Limit ---- */
function TransactionLimitCard({ count, limit, limitUsed, navigate }) {
  const isNear = limitUsed >= 70;
  const isOver = limitUsed >= 100;
  return (
    <div className={`limit-card ${isOver ? 'limit-card--over' : isNear ? 'limit-card--near' : ''}`} id="limit-card">
      <div className="limit-header">
        <span className="limit-label">Transações este mês</span>
        <span className={`limit-count ${isOver ? 'text-danger' : isNear ? 'text-warning' : ''}`}>
          {count} / {limit}
        </span>
      </div>
      <div className="progress-bar-wrapper" style={{ marginTop: 8 }}>
        <div
          className={`progress-bar-fill ${isOver ? 'progress-danger' : isNear ? 'progress-warning' : 'progress-brand'}`}
          style={{ width: `${Math.min(100, limitUsed)}%` }}
        />
      </div>
      {isOver && (
        <button className="btn btn-primary btn-sm" style={{ marginTop: 12, width: '100%' }} onClick={() => navigate('/paywall')} id="upgrade-from-limit-btn">
          🚀 Ir para Premium — R$ 19,90/mês
        </button>
      )}
      {isNear && !isOver && (
        <p className="limit-hint">Você está quase no limite. <span onClick={() => navigate('/paywall')} className="text-brand" style={{ cursor: 'pointer' }}>Ver Premium</span></p>
      )}
    </div>
  );
}

/* ---- Recent Transactions ---- */
function RecentTransactions({ transactions, categories, navigate }) {
  if (!transactions.length) {
    return (
      <div className="section-card empty-state" id="recent-txs-card">
        <div className="empty-icon">📝</div>
        <div className="empty-title">Nenhuma transação ainda</div>
        <div className="empty-desc">Toque no + para registrar seu primeiro gasto ou receita</div>
      </div>
    );
  }

  return (
    <div className="section-card" id="recent-txs-card">
      <div className="section-header" onClick={() => navigate('/transacoes')}>
        <div className="section-title-row">
          <span className="section-icon">🧾</span>
          <div>
            <div className="section-label">Recentes</div>
            <div className="section-title">Últimas transações</div>
          </div>
        </div>
        <span className="section-caret">›</span>
      </div>
      <div className="tx-list">
        {transactions.map(tx => {
          const cat = categories.find(c => c.id === tx.category);
          return (
            <div className="tx-item" key={tx.id}>
              <span className={`tx-icon cat-${cat?.color || 'outros'}`}>{cat?.icon || '📦'}</span>
              <div className="tx-info">
                <span className="tx-desc">{tx.description}</span>
                <span className="tx-cat">{cat?.label || tx.category}</span>
              </div>
              <div className="tx-right">
                <span className={`tx-amount ${tx.type === 'income' ? 'income' : 'expense'}`}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                </span>
                <span className="tx-date">{new Date(tx.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---- Weak Month Alert ---- */
function WeakMonthAlert({ income, avgIncome }) {
  const diff = Math.round(((avgIncome - income) / avgIncome) * 100);
  return (
    <div className="weak-month-alert" id="weak-month-alert">
      <span className="alert-icon">⚠️</span>
      <div>
        <div className="alert-title">Mês abaixo da média</div>
        <div className="alert-desc">
          Receita {diff}% abaixo da sua média de {formatCurrency(avgIncome)}/mês
        </div>
      </div>
    </div>
  );
}
