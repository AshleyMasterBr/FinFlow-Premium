import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import { generateId, getCurrentMonth, canAddTransaction } from '../store';
import BottomNav from '../components/BottomNav';
import './AddTransaction.css';

const TYPE_OPTIONS = [
  { value: 'expense', label: 'Gasto', icon: '↓', color: 'danger' },
  { value: 'income', label: 'Receita', icon: '↑', color: 'accent' },
];

export default function AddTransaction() {
  const { data, addTransaction } = useApp();
  const navigate = useNavigate();

  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const categories = data.categories.filter(c =>
    type === 'income' ? c.type === 'income' : c.type === 'expense'
  );

  const handleAmountChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    setAmount(raw);
  };

  const displayAmount = amount
    ? (parseInt(amount) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
    : '';

  const handleSave = () => {
    if (!amount || parseInt(amount) === 0) { setError('Informe o valor'); return; }
    if (!description.trim()) { setError('Informe uma descrição'); return; }
    if (!category) { setError('Selecione uma categoria'); return; }

    if (!canAddTransaction(data)) {
      navigate('/paywall');
      return;
    }

    setSaving(true);
    const tx = {
      id: generateId(),
      type,
      amount: parseInt(amount) / 100,
      description: description.trim(),
      category,
      date,
      createdAt: new Date().toISOString(),
    };

    addTransaction(tx);
    setTimeout(() => {
      navigate('/dashboard');
    }, 300);
  };

  return (
    <div className="app-shell">
      {/* Header */}
      <div className="page-header">
        <button className="btn btn-icon" onClick={() => navigate(-1)} id="add-back-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M5 12l7-7M5 12l7 7"/>
          </svg>
        </button>
        <h1 className="page-title">Nova transação</h1>
        <div style={{ width: 44 }} />
      </div>

      <div className="page-content add-tx-content">
        {/* Type toggle */}
        <div className="type-toggle">
          {TYPE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              className={`type-btn ${type === opt.value ? `active-${opt.color}` : ''}`}
              onClick={() => { setType(opt.value); setCategory(''); }}
              id={`type-${opt.value}`}
            >
              <span className="type-icon-label">{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>

        {/* Amount */}
        <div className="amount-input-wrapper">
          <span className="amount-currency">R$</span>
          <input
            className="amount-input"
            type="tel"
            inputMode="numeric"
            placeholder="0,00"
            value={displayAmount}
            onChange={handleAmountChange}
            id="tx-amount-input"
            autoFocus
          />
        </div>

        {/* Form */}
        <div className="add-tx-form">
          <div className="input-group">
            <label className="input-label">Descrição</label>
            <input
              className="input-field"
              type="text"
              placeholder={type === 'income' ? 'Ex: Salário, Freela...' : 'Ex: Mercado, Uber...'}
              value={description}
              onChange={e => setDescription(e.target.value)}
              id="tx-desc-input"
            />
          </div>

          {/* Category */}
          <div className="input-group">
            <label className="input-label">Categoria</label>
            <div className="category-grid">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  className={`cat-chip ${category === cat.id ? 'cat-chip-selected' : ''} cat-${cat.color}`}
                  onClick={() => setCategory(cat.id)}
                  id={`cat-chip-${cat.id}`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div className="input-group">
            <label className="input-label">Data</label>
            <input
              className="input-field"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              id="tx-date-input"
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <button
            className={`btn btn-primary btn-full btn-lg ${saving ? 'btn-disabled' : ''}`}
            onClick={handleSave}
            disabled={saving}
            id="save-tx-btn"
          >
            {saving ? 'Salvando...' : `Salvar ${type === 'income' ? 'receita' : 'gasto'}`}
          </button>
        </div>
      </div>

      <BottomNav active="add" onAdd={() => {}} />
    </div>
  );
}
