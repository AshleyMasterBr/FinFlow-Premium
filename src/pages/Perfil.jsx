import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import { formatCurrency, getMonthlyHistory } from '../store';
import BottomNav from '../components/BottomNav';
import './Perfil.css';

const PROFILE_LABELS = {
  clt: '💼 CLT',
  autonomo: '🧑‍💻 Autônomo',
  estudante: '🎓 Estudante',
  comerciante: '🏪 Comerciante',
};

const RENDA_LABELS = {
  ate2k: 'Até R$ 2 mil',
  '2k5k': 'R$ 2k – 5k',
  '5k10k': 'R$ 5k – 10k',
  acima10k: 'Acima de R$ 10k',
};

const FREQ_LABELS = {
  diario: '📅 Todo dia (21h)',
  semanal: '📆 Semanal (seg)',
  mensal: '🗓️ Mensal',
};

const DIFIC_LABELS = {
  controlar: 'Controlar gastos',
  guardar: 'Guardar dinheiro',
  dividas: 'Pagar dívidas',
  entender: 'Entender pra onde vai',
};

export default function Perfil() {
  const { data, update, updateUserMetadata, signOut, resetData } = useApp();
  const navigate = useNavigate();

  const userMeta = data.session?.user?.user_metadata || {};
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(userMeta.full_name || '');
  const [editAvatar, setEditAvatar] = useState(userMeta.avatar_url || '');

  const handleSaveProfile = async () => {
    await updateUserMetadata({ full_name: editName, avatar_url: editAvatar });
    setIsEditingProfile(false);
  };

  const history = getMonthlyHistory(data.transactions, 6);
  const totalIncome = history.reduce((s, m) => s + m.income, 0);
  const totalExpense = history.reduce((s, m) => s + m.expense, 0);
  const txCount = data.transactions.length;

  const handleReset = () => {
    if (window.confirm('Tem certeza? Isso vai apagar todos os seus dados financeiros.')) {
      resetData();
    }
  };

  return (
    <div className="app-shell">
      <div className="page-header">
        <button className="btn btn-icon" onClick={() => navigate('/dashboard')} id="perfil-back-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M5 12l7-7M5 12l7 7"/>
          </svg>
        </button>
        <h1 className="page-title">Perfil</h1>
        <div style={{ width: 44 }} />
      </div>

      <div className="page-content">
        {/* User Identity */}
        <div className="perfil-header-card">
          <div className="perfil-avatar">
            {userMeta.avatar_url ? (
              <img src={userMeta.avatar_url} alt="Avatar" className="avatar-img" />
            ) : (
              <span className="avatar-placeholder">{editName ? editName.charAt(0).toUpperCase() : 'U'}</span>
            )}
          </div>
          <div className="perfil-user-info">
            <h2 className="perfil-name">{userMeta.full_name || 'Usuário FinFlow'}</h2>
            <p className="perfil-email">{data.session?.user?.email}</p>
          </div>
          <button className="btn btn-icon btn-edit-profile" onClick={() => setIsEditingProfile(true)}>
            ✏️
          </button>
        </div>

        {/* Premium Banner */}
        {!data.premium ? (
          <div className="premium-banner" onClick={() => navigate('/paywall')} id="perfil-premium-banner">
            <div className="premium-banner-inner">
              <span className="premium-banner-icon">👑</span>
              <div>
                <div className="premium-banner-title">Ativar Premium</div>
                <div className="premium-banner-desc">Desbloqueie tudo por R$ 19,90/mês</div>
              </div>
              <span className="premium-banner-arrow">›</span>
            </div>
          </div>
        ) : (
          <div className="premium-active">
            <span>👑</span>
            <span className="premium-active-label">Você é Premium!</span>
          </div>
        )}

        {/* Stats */}
        <div className="perfil-stats">
          <div className="perfil-stat">
            <span className="perfil-stat-value">{txCount}</span>
            <span className="perfil-stat-label">Transações</span>
          </div>
          <div className="perfil-stat">
            <span className="perfil-stat-value text-accent">{formatCurrency(totalIncome)}</span>
            <span className="perfil-stat-label">Total recebido</span>
          </div>
          <div className="perfil-stat">
            <span className="perfil-stat-value text-danger">{formatCurrency(totalExpense)}</span>
            <span className="perfil-stat-label">Total gasto</span>
          </div>
        </div>

        {/* Profile Info */}
        <div className="perfil-section">
          <h2 className="perfil-section-title">Suas respostas do onboarding</h2>
          <div className="perfil-card">
            <InfoRow label="Perfil" value={PROFILE_LABELS[data.profile] || '—'} />
            <InfoRow label="Renda mensal" value={RENDA_LABELS[data.renda] || '—'} />
            <InfoRow label="Maior dificuldade" value={DIFIC_LABELS[data.dificuldade] || '—'} />
            <InfoRow label="Tem dívidas?" value={data.temDividas === 'sim' ? 'Sim' : data.temDividas === 'nao' ? 'Não' : '—'} />
            <InfoRow label="Frequência" value={FREQ_LABELS[data.frequencia] || '—'} last />
          </div>
          <button
            className="btn btn-secondary btn-sm"
            style={{ marginTop: 10, width: '100%' }}
            onClick={() => resetData()}
            id="perfil-redo-onboarding-btn"
          >
            Refazer onboarding
          </button>
        </div>

        {/* Salary setting */}
        {data.profile === 'clt' && (
          <div className="perfil-section">
            <h2 className="perfil-section-title">Salário base</h2>
            <div className="perfil-card">
              <div className="input-group">
                <label className="input-label">Valor do salário (R$)</label>
                <input
                  className="input-field"
                  type="number"
                  value={data.salario}
                  onChange={e => update({ salario: parseFloat(e.target.value) || 0 })}
                  placeholder="Ex: 3500"
                  id="perfil-salario-input"
                />
              </div>
            </div>
          </div>
        )}

        {/* Danger Zone */}
        <div className="perfil-section">
          <h2 className="perfil-section-title danger">Zona de perigo</h2>
          <button
            className="btn btn-secondary btn-full"
            onClick={handleReset}
            id="perfil-reset-btn"
          >
            Apagar dados financeiros
          </button>
          <button
            className="btn btn-danger btn-full"
            onClick={signOut}
            id="perfil-signout-btn"
          >
            Sair da conta
          </button>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <div className="modal-overlay" onClick={() => setIsEditingProfile(false)}>
          <div className="bottom-sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle" />
            <h2 className="sheet-title">Editar Perfil</h2>
            
            <div className="add-goal-form" style={{ marginTop: 20 }}>
              <div className="input-group">
                <label className="input-label">Seu Nome</label>
                <input
                  className="input-field"
                  placeholder="Ex: João Silva"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                />
              </div>
              
              <div className="input-group">
                <label className="input-label">URL da Foto (opcional)</label>
                <input
                  className="input-field"
                  placeholder="https://..."
                  value={editAvatar}
                  onChange={e => setEditAvatar(e.target.value)}
                />
              </div>

              <button className="btn btn-primary btn-full" onClick={handleSaveProfile} style={{ marginTop: 10 }}>
                Salvar alterações
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav active="perfil" onAdd={() => navigate('/add-transaction')} />
    </div>
  );
}

function InfoRow({ label, value, last }) {
  return (
    <div className={`info-row ${last ? '' : 'info-row-border'}`}>
      <span className="info-label">{label}</span>
      <span className="info-value">{value}</span>
    </div>
  );
}
