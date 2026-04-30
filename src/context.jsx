import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from './supabase'
import { DEFAULT_CATEGORIES } from './store'

const AppContext = createContext(null)
export const useApp = () => useContext(AppContext)

// ── Estado padrão local (antes de carregar do banco) ──────────────────────────
const DEFAULT_STATE = {
  // Auth
  session: null,
  profile: null,
  loading: true,
  // Onboarding answers (persistido em profiles.finflow_onboarding)
  onboardingComplete: false,
  profileType: null, // clt | autonomo | estudante | comerciante
  renda: null,
  salario: 0,
  dificuldade: null,
  temDividas: null,
  objetivo: null,
  frequencia: null,
  // Premium (vem de profiles.subscription_tier)
  premium: false,
  // Data (vem do banco)
  transactions: [],
  goals: [],
  categories: DEFAULT_CATEGORIES,
  // Limites freemium
  TX_LIMIT_FREE: 30,
  GOAL_LIMIT_FREE: 1,
}

export function AppProvider({ children }) {
  const [state, setState] = useState(DEFAULT_STATE)

  // ── Helper para updates parciais ──────────────────────────────────────────
  const patch = useCallback((updates) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  // ── Auth listener ─────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        patch({ session })
        loadProfile(session.user.id)
      } else {
        patch({ loading: false })
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        patch({ session })
        loadProfile(session.user.id)
      } else {
        setState({ ...DEFAULT_STATE, loading: false })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // ── Carrega perfil + dados do banco ───────────────────────────────────────
  const loadProfile = async (userId) => {
    try {
      // Profile
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error

      const onboarding = profile.finflow_onboarding || {}
      const isPremium  = profile.subscription_tier === 'premium'

      // Transactions
      const { data: transactions } = await supabase
        .from('finflow_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })

      // Goals
      const { data: goals } = await supabase
        .from('finflow_goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })

      patch({
        profile,
        loading: false,
        premium: isPremium,
        onboardingComplete: !!onboarding.complete,
        profileType:   onboarding.profileType   || null,
        renda:         onboarding.renda         || null,
        salario:       profile.finflow_salario  || onboarding.salario || 0,
        dificuldade:   onboarding.dificuldade   || null,
        temDividas:    onboarding.temDividas    || null,
        objetivo:      onboarding.objetivo      || null,
        frequencia:    onboarding.frequencia    || null,
        transactions:  transactions || [],
        goals:         goals || [],
      })
    } catch (err) {
      console.error('Erro ao carregar perfil:', err)
      patch({ loading: false })
    }
  }

  // ── Salva onboarding no banco ─────────────────────────────────────────────
  const completeOnboarding = async (answers) => {
    const { session } = state
    if (!session) return

    const onboardingData = { ...answers, complete: true }

    await supabase
      .from('profiles')
      .update({
        finflow_onboarding: onboardingData,
        finflow_salario: answers.salario || 0,
      })
      .eq('id', session.user.id)

    patch({
      onboardingComplete: true,
      profileType:  answers.profileType,
      renda:        answers.renda,
      salario:      answers.salario || 0,
      dificuldade:  answers.dificuldade,
      temDividas:   answers.temDividas,
      objetivo:     answers.objetivo,
      frequencia:   answers.frequencia,
    })

    // Cria meta automática se objetivo foi selecionado
    if (answers.objetivo && answers.objetivo !== 'nenhum') {
      const autoGoal = buildAutoGoal(answers.objetivo, answers.renda)
      if (autoGoal) await addGoal(autoGoal, session.user.id)
    }
  }

  // ── Transações ─────────────────────────────────────────────────────────────
  const addTransaction = async (tx) => {
    const { session } = state
    if (!session) return

    const { data, error } = await supabase
      .from('finflow_transactions')
      .insert({ ...tx, user_id: session.user.id })
      .select()
      .single()

    if (error) { console.error('Erro ao adicionar transação:', error); return }

    setState(prev => ({
      ...prev,
      transactions: [data, ...prev.transactions],
    }))
  }

  const removeTransaction = async (id) => {
    await supabase.from('finflow_transactions').delete().eq('id', id)
    setState(prev => ({
      ...prev,
      transactions: prev.transactions.filter(t => t.id !== id),
    }))
  }

  // ── Metas ──────────────────────────────────────────────────────────────────
  const addGoal = async (goal, userId = null) => {
    const uid = userId || state.session?.user?.id
    if (!uid) return

    const { data, error } = await supabase
      .from('finflow_goals')
      .insert({ ...goal, user_id: uid })
      .select()
      .single()

    if (error) { console.error('Erro ao adicionar meta:', error); return }

    setState(prev => ({ ...prev, goals: [...prev.goals, data] }))
  }

  const updateGoal = async (id, updates) => {
    const { error } = await supabase
      .from('finflow_goals')
      .update(updates)
      .eq('id', id)

    if (error) { console.error('Erro ao atualizar meta:', error); return }

    setState(prev => ({
      ...prev,
      goals: prev.goals.map(g => g.id === id ? { ...g, ...updates } : g),
    }))
  }

  const removeGoal = async (id) => {
    await supabase.from('finflow_goals').delete().eq('id', id)
    setState(prev => ({ ...prev, goals: prev.goals.filter(g => g.id !== id) }))
  }

  // ── Update genérico de campos locais ──────────────────────────────────────
  const update = async (fields) => {
    // Salário muda no banco também
    if ('salario' in fields && state.session) {
      await supabase
        .from('profiles')
        .update({ finflow_salario: fields.salario })
        .eq('id', state.session.user.id)
    }
    patch(fields)
  }

  // ── Auth helpers ──────────────────────────────────────────────────────────
  const signOut = async () => {
    await supabase.auth.signOut()
  }

  // ── Reset dados (mantém auth) ─────────────────────────────────────────────
  const resetData = async () => {
    const { session } = state
    if (!session) return
    const uid = session.user.id

    await Promise.all([
      supabase.from('finflow_transactions').delete().eq('user_id', uid),
      supabase.from('finflow_goals').delete().eq('user_id', uid),
      supabase.from('profiles').update({
        finflow_onboarding: null,
        finflow_salario: 0,
      }).eq('id', uid),
    ])

    patch({
      onboardingComplete: false,
      profileType: null, renda: null, salario: 0,
      dificuldade: null, temDividas: null, objetivo: null, frequencia: null,
      transactions: [], goals: [],
    })
  }

  const value = {
    data: state,
    // Actions
    completeOnboarding,
    addTransaction,
    removeTransaction,
    addGoal,
    updateGoal,
    removeGoal,
    update,
    signOut,
    resetData,
    // Reload manual
    reload: () => state.session && loadProfile(state.session.user.id),
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// ── Helper: monta meta automática pelo objetivo do onboarding ─────────────────
const OBJETIVO_META = {
  reserva:    { label: 'Reserva de emergência', icon: '🛡️', multiplier: 6 },
  viagem:     { label: 'Viagem dos sonhos',     icon: '✈️', multiplier: 3 },
  compra:     { label: 'Compra planejada',       icon: '🛍️', multiplier: 2 },
  dividas:    { label: 'Quitar dívidas',         icon: '🎯', multiplier: 4 },
  investir:   { label: 'Começar a investir',     icon: '📈', multiplier: 2 },
}

const RENDA_BASE = { ate2k: 1500, '2k5k': 3500, '5k10k': 7500, acima10k: 12000 }

function buildAutoGoal(objetivo, renda) {
  const meta = OBJETIVO_META[objetivo]
  if (!meta) return null
  const base   = RENDA_BASE[renda] || 3500
  const target = Math.round(base * meta.multiplier)
  return {
    label: meta.label,
    icon: meta.icon,
    target,
    current: 0,
  }
}
