import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import { formatCurrency, getMonthTransactions, getTotalByType } from '../store';
import BottomNav from '../components/BottomNav';
import './Transacoes.css';

export default function Transacoes() {
  const { data, removeTransaction } = useApp();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all'); // all | income | expense

  const filtered = data.transactions.filter(t => {
    if (filter === 'all') return true;
    return t.type === filter;
  });

  const grouped = groupByDate(filtered);

  return (
    <div className="app-shell">
      <div className="page-header">
        <button className="btn btn-icon" onClick={() => navigate('/dashboard')} id="txs-back-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M5 12l7-7M5 12l7 7"/>
          </svg>
        </button>
        <h1 className="page-title">Histórico</h1>
        <div style={{ width: 44 }} />
      </div>

      <div className="page-content">
        {/* Filters */}
        <div className="tx-filters">
          {[
            { value: 'all', label: 'Todos' },
            { value: 'expense', label: 'Gastos' },
            { value: 'income', label: 'Receitas' },
          ].map(f => (
            <button
              key={f.value}
              className={`filter-btn ${filter === f.value ? 'active' : ''}`}
              onClick={() => setFilter(f.value)}
              id={`filter-${f.value}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Transaction groups */}
        {Object.keys(grouped).length === 0 ? (
          <div className="section-card empty-state" style={{ margin: '20px' }}>
            <div className="empty-icon">🧾</div>
            <div className="empty-title">Nenhuma transação</div>
            <div className="empty-desc">Toque no + para adicionar</div>
          </div>
        ) : (
          Object.entries(grouped).map(([date, txs]) => (
            <div key={date} className="tx-group">
              <div className="tx-group-header">
                <span className="tx-group-date">{formatGroupDate(date)}</span>
                <span className="tx-group-total">
                  {(() => {
                    const inc = getTotalByType(txs, 'income');
                    const exp = getTotalByType(txs, 'expense');
                    const net = inc - exp;
                    return (
                      <span className={net >= 0 ? 'text-accent' : 'text-danger'}>
                        {net >= 0 ? '+' : ''}{formatCurrency(net)}
                      </span>
                    );
                  })()}
                </span>
              </div>
              {txs.map(tx => {
                const cat = data.categories.find(c => c.id === tx.category);
                return (
                  <div className="tx-item-full" key={tx.id}>
                    <span className={`tx-icon cat-${cat?.color || 'outros'}`}>{cat?.icon || '📦'}</span>
                    <div className="tx-info">
                      <span className="tx-desc">{tx.description}</span>
                      <span className="tx-cat">{cat?.label || tx.category}</span>
                    </div>
                    <div className="tx-right">
                      <span className={`tx-amount ${tx.type === 'income' ? 'income' : 'expense'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </span>
                    </div>
                    <button
                      className="tx-delete-btn"
                      onClick={() => removeTransaction(tx.id)}
                      id={`tx-delete-${tx.id}`}
                      aria-label="Remover"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      <BottomNav active="transacoes" onAdd={() => navigate('/add-transaction')} />
    </div>
  );
}

function groupByDate(txs) {
  const groups = {};
  for (const tx of txs) {
    if (!groups[tx.date]) groups[tx.date] = [];
    groups[tx.date].push(tx);
  }
  // Sort dates descending
  return Object.fromEntries(
    Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]))
  );
}

function formatGroupDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (dateStr === today.toISOString().slice(0, 10)) return 'Hoje';
  if (dateStr === yesterday.toISOString().slice(0, 10)) return 'Ontem';
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
}
