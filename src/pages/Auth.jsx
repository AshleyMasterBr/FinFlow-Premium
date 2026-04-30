import React, { useState } from 'react'
import { supabase } from '../supabase'
import './Auth.css'

export default function Auth() {
  const [mode, setMode]       = useState('login') // login | signup
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setSuccess('Conta criada! Verifique seu e-mail para confirmar.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        // O listener em context.jsx vai detectar a sessão e redirecionar
      }
    } catch (err) {
      setError(translateError(err.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      {/* Logo */}
      <div className="auth-logo">
        <span className="auth-logo-icon">💸</span>
        <span className="auth-logo-text">finflow</span>
        <span className="auth-logo-tag">organize. poupe. realize.</span>
      </div>

      {/* Card */}
      <div className="auth-card">
        {/* Tab toggle */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError(''); setSuccess('') }}
            id="auth-tab-login"
          >
            Entrar
          </button>
          <button
            className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => { setMode('signup'); setError(''); setSuccess('') }}
            id="auth-tab-signup"
          >
            Criar conta
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">E-mail</label>
            <input
              className="input-field"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              id="auth-email"
              autoComplete="email"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Senha</label>
            <input
              className="input-field"
              type="password"
              placeholder={mode === 'signup' ? 'mínimo 6 caracteres' : '••••••••'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              id="auth-password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            />
          </div>

          {error   && <p className="auth-error">{error}</p>}
          {success && <p className="auth-success">{success}</p>}

          <button
            className={`btn btn-primary btn-full btn-lg ${loading ? 'btn-disabled' : ''}`}
            type="submit"
            disabled={loading}
            id="auth-submit-btn"
          >
            {loading
              ? 'Aguarde...'
              : mode === 'login' ? 'Entrar' : 'Criar conta grátis'}
          </button>
        </form>

        {mode === 'login' && (
          <button
            className="auth-forgot"
            onClick={async () => {
              if (!email) { setError('Digite seu e-mail primeiro'); return }
              await supabase.auth.resetPasswordForEmail(email)
              setSuccess('Link de recuperação enviado para seu e-mail.')
            }}
            id="auth-forgot-btn"
          >
            Esqueci minha senha
          </button>
        )}
      </div>

      <p className="auth-disclaimer">
        seus dados ficam seguros e sincronizados entre dispositivos
      </p>
    </div>
  )
}

function translateError(msg) {
  if (msg.includes('Invalid login'))     return 'E-mail ou senha incorretos.'
  if (msg.includes('Email not confirmed')) return 'Confirme seu e-mail antes de entrar.'
  if (msg.includes('User already'))      return 'Este e-mail já possui uma conta.'
  if (msg.includes('Password should'))   return 'A senha deve ter pelo menos 6 caracteres.'
  return msg
}
