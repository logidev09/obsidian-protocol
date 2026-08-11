import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const AuthContext = createContext(null)

const PREVIEW_KEY = 'obsidian.preview.session'

function shortAddress(addr) {
  if (!addr) return ''
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function makePreviewSession(chain = 'ethereum') {
  const hex = '0123456789abcdef'
  let addr = '0x'
  for (let i = 0; i < 40; i += 1) addr += hex[Math.floor(Math.random() * 16)]
  return {
    access_token: 'preview',
    token_type: 'preview',
    user: {
      id: `preview-${addr}`,
      user_metadata: {
        address: addr,
        chain,
        display_name: 'Preview Vault'
      }
    }
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      try {
        const raw = localStorage.getItem(PREVIEW_KEY)
        if (raw) setSession(JSON.parse(raw))
      } catch {
        /* ignore corrupt preview session */
      }
      return undefined
    }

    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (active) setSession(data.session)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const connect = async (chain = 'ethereum') => {
    setError(null)
    setLoading(true)
    try {
      if (isSupabaseConfigured) {
        const { data, error: err } = await supabase.auth.signInWithWeb3({ chain })
        if (err) throw err
        setSession(data.session)
        return data.session
      }
      const preview = makePreviewSession(chain)
      setSession(preview)
      try {
        localStorage.setItem(PREVIEW_KEY, JSON.stringify(preview))
      } catch {
        /* storage unavailable */
      }
      return preview
    } catch (err) {
      setError(err?.message || 'Failed to connect wallet')
      return null
    } finally {
      setLoading(false)
    }
  }

  const disconnect = async () => {
    setError(null)
    if (isSupabaseConfigured) {
      await supabase.auth.signOut()
    } else {
      localStorage.removeItem(PREVIEW_KEY)
    }
    setSession(null)
  }

  const value = useMemo(() => {
    const address = session?.user?.user_metadata?.address
    const chain = session?.user?.user_metadata?.chain
    return {
      session,
      address,
      chain,
      shortAddress: shortAddress(address),
      loading,
      error,
      isSupabaseConfigured,
      connect,
      disconnect
    }
  }, [session, loading, error])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
