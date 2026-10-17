import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (!error && data) {
      setProfile(data)
      return data
    }
    setProfile(null)
    return null
  }, [])

  const checkAuth = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        await fetchProfile(session.user.id)
      } else {
        setUser(null)
        setProfile(null)
      }
    } catch {
      setUser(null)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [fetchProfile])

  useEffect(() => {
    checkAuth()

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setUser(session.user)
          await fetchProfile(session.user.id)
        } else {
          setUser(null)
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => {
      listener?.subscription?.unsubscribe()
    }
  }, [checkAuth, fetchProfile])

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    if (data.user) {
      setUser(data.user)
      const prof = await fetchProfile(data.user.id)
      if (prof?.must_change_password) {
        return { mustChangePassword: true }
      }
    }
    return data
  }

  const register = async (email, password, name, role) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role },
      },
    })
    if (error) throw error

    if (data.user) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: data.user.id,
          email,
          name,
          role,
        })
      if (profileError) throw profileError

      if (role === 'parent') {
        await supabase.from('parent_profiles').insert({
          user_id: data.user.id,
        })
      }
    }

    return data
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const changePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    if (error) throw error

    if (user) {
      await supabase
        .from('user_profiles')
        .update({ must_change_password: false })
        .eq('id', user.id)
      setProfile(prev => prev ? { ...prev, must_change_password: false } : null)
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, login, register, logout, checkAuth, changePassword, fetchProfile, setProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}
