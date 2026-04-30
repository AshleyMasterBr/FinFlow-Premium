// FinFlow — Central Store (localStorage persistence)
// All app state lives here

const STORAGE_KEY = 'finflow_data';

const DEFAULT_DATA = {
  onboardingComplete: false,
  profile: null, // 'clt' | 'autonomo' | 'estudante' | 'comerciante'
  dificuldade: null,
  renda: null,
  temDividas: null,
  objetivo: null,
  frequencia: null,
  // Financial data
  transactions: [],
  goals: [],
  categories: [
    { id: 'moradia', label: 'Moradia', icon: '🏠', color: 'moradia', type: 'expense' },
    { id: 'alimentacao', label: 'Alimentação', icon: '🍽️', color: 'alimentacao', type: 'expense' },
    { id: 'transporte', label: 'Transporte', icon: '🚗', color: 'transporte', type: 'expense' },
    { id: 'saude', label: 'Saúde', icon: '💊', color: 'saude', type: 'expense' },
    { id: 'lazer', label: 'Lazer', icon: '🎮', color: 'lazer', type: 'expense' },
    { id: 'outros', label: 'Outros', icon: '📦', color: 'outros', type: 'expense' },
    { id: 'receita', label: 'Receita', icon: '💰', color: 'receita', type: 'income' },
  ],
  salario: 0,
  premium: false,
  // Limits
  TRANSACTION_LIMIT_FREE: 30,
  CATEGORY_LIMIT_FREE: 5,
  GOAL_LIMIT_FREE: 1,
  HISTORY_MONTHS_FREE: 3,
};

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_DATA };
    const saved = JSON.parse(raw);
    return { ...DEFAULT_DATA, ...saved };
  } catch {
    return { ...DEFAULT_DATA };
  }
}

export function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save:', e);
  }
}

export function clearData() {
  localStorage.removeItem(STORAGE_KEY);
}

// --- Helpers ---

export function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function getMonthTransactions(transactions, monthKey) {
  return transactions.filter(t => t.date.startsWith(monthKey));
}

export function getCurrentMonthTransactions(transactions) {
  return getMonthTransactions(transactions, getCurrentMonth());
}

export function getTotalByType(transactions, type) {
  return transactions
    .filter(t => t.type === type)
    .reduce((sum, t) => sum + t.amount, 0);
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export function getTransactionCountThisMonth(transactions) {
  return getCurrentMonthTransactions(transactions).length;
}

export function canAddTransaction(data) {
  if (data.premium) return true;
  return getTransactionCountThisMonth(data.transactions) < data.TRANSACTION_LIMIT_FREE;
}

export function canAddGoal(data) {
  if (data.premium) return true;
  return data.goals.length < data.GOAL_LIMIT_FREE;
}

export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getGoalProgress(goal) {
  if (!goal.target || goal.target === 0) return 0;
  return Math.min(100, Math.round((goal.current / goal.target) * 100));
}

// Spend by category this month
export function getSpendByCategory(transactions) {
  const monthTxs = getCurrentMonthTransactions(transactions).filter(t => t.type === 'expense');
  const map = {};
  for (const t of monthTxs) {
    map[t.category] = (map[t.category] || 0) + t.amount;
  }
  return map;
}

// Monthly summary for last N months
export function getMonthlyHistory(transactions, months = 6) {
  const result = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const txs = getMonthTransactions(transactions, key);
    result.push({
      month: d.toLocaleDateString('pt-BR', { month: 'short' }),
      key,
      income: getTotalByType(txs, 'income'),
      expense: getTotalByType(txs, 'expense'),
    });
  }
  return result;
}

// Average monthly income
export function getAverageMonthlyIncome(transactions, months = 3) {
  const history = getMonthlyHistory(transactions, months);
  const total = history.reduce((s, m) => s + m.income, 0);
  return total / months;
}
