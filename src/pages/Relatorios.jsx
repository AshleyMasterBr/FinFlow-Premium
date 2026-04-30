import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import { formatCurrency, getCurrentMonthTransactions, getTotalByType, getSpendByCategory } from '../store';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import BottomNav from '../components/BottomNav';
import './Relatorios.css';

const COLORS = ['#6c63ff', '#00d4aa', '#ffb547', '#ff5c7a', '#a78bfa', '#00b4d8', '#9494b0'];

export default function Relatorios() {
  const { data } = useApp();
  const navigate = useNavigate();

  const monthTxs = getCurrentMonthTransactions(data.transactions);
  const income = getTotalByType(monthTxs, 'income');
  const expense = getTotalByType(monthTxs, 'expense');
  const spendByCategory = getSpendByCategory(data.transactions);

  const pieData = Object.entries(spendByCategory)
    .map(([id, value]) => {
      const cat = data.categories.find(c => c.id === id);
      return { name: cat?.label || id, value, icon: cat?.icon || '📦' };
    })
    .sort((a, b) => b.value - a.value);

  const total = pieData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="app-shell">
      <div className="page-header">
        <button className="btn btn-icon" onClick={() => navigate('/dashboard')} id="rel-back-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M5 12l7-7M5 12l7 7"/>
          </svg>
        </button>
        <h1 className="page-title">Relatório do mês</h1>
        <div style={{ width: 44 }} />
      </div>

      <div className="page-content">
        {/* Summary Row */}
        <div className="rel-summary">
          <div className="rel-stat-card">
            <span className="rel-stat-label">Receitas</span>
            <span className="rel-stat-value text-accent">{formatCurrency(income)}</span>
          </div>
          <div className="rel-stat-card">
            <span className="rel-stat-label">Gastos</span>
            <span className="rel-stat-value text-danger">{formatCurrency(expense)}</span>
          </div>
          <div className="rel-stat-card">
            <span className="rel-stat-label">Sobra</span>
            <span className={`rel-stat-value ${income - expense >= 0 ? 'text-accent' : 'text-danger'}`}>
              {formatCurrency(income - expense)}
            </span>
          </div>
        </div>

        {/* Pie Chart */}
        {pieData.length > 0 ? (
          <div className="pie-card">
            <h2 className="pie-title">Gastos por categoria</h2>
            <div className="pie-wrapper">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => formatCurrency(v)}
                    contentStyle={{
                      background: '#16161f',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 12,
                      color: '#f0f0f8',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pie-center-label">
                <span className="pie-total">{formatCurrency(total)}</span>
                <span className="pie-total-label">total gasto</span>
              </div>
            </div>

            {/* Legend */}
            <div className="pie-legend">
              {pieData.map((d, i) => (
                <div className="legend-item" key={i}>
                  <div className="legend-dot" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="legend-icon">{d.icon}</span>
                  <span className="legend-name">{d.name}</span>
                  <span className="legend-pct">{total > 0 ? Math.round((d.value / total) * 100) : 0}%</span>
                  <span className="legend-value">{formatCurrency(d.value)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="section-card empty-state" style={{ margin: '0 20px 16px' }}>
            <div className="empty-icon">📊</div>
            <div className="empty-title">Nenhum gasto registrado</div>
            <div className="empty-desc">Adicione transações para ver seus relatórios</div>
          </div>
        )}

        {/* Premium gate for advanced reports */}
        {!data.premium && (
          <div className="premium-gate" id="premium-gate-reports" onClick={() => navigate('/paywall')}>
            <div className="gate-inner">
              <span className="gate-icon">🔒</span>
              <div>
                <div className="gate-title">Relatórios avançados</div>
                <div className="gate-desc">Evolução mensal, comparativo e maiores gastos — Premium</div>
              </div>
              <span className="gate-arrow">›</span>
            </div>
          </div>
        )}
      </div>

      <BottomNav active="relatorios" onAdd={() => navigate('/add-transaction')} />
    </div>
  );
}
