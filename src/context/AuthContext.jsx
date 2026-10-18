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
      (event, session) => {
        (async () => {
          if (session?.user) {
            // Link de recuperação de password: enviar para a página de nova password
            if (event === 'PASSWORD_RECOVERY') {
              if (!window.location.hash.startsWith('#/reset-password')) window.location.hash = '#/reset-password'
              setLoading(false)
              return
            }
            setUser(session.user)
            const isGoogleUser = session.user.identities?.some(identity => identity.provider === 'google')
            let prof = isGoogleUser ? await ensureGoogleProfile(session.user) : null
            if (!prof) prof = await fetchProfile(session.user.id)
            setProfile(prof)

            if (prof?.role === 'pending_role') {
              if (!window.location.hash.startsWith('#/role-choice')) window.location.hash = '#/role-choice'
            } else if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
              const dashboardByRole = {
                student: '#/student/dashboard',
                parent: '#/parent/dashboard',
                association: '#/association/dashboard',
                admin: '#/admin',
                teacher: '#/teacher/dashboard',
              }
              const destination = dashboardByRole[prof?.role]
              if (destination && ['#/login', '#/', '#'].includes(window.location.hash || '#')) {
                window.location.hash = destination
              }
            }
          } else {
            setUser(null)
            setProfile(null)
          }
          setLoading(false)
        })()
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

  const register = async (email, password, name, role, nickname) => {
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

      if (role === 'student') {
        // Valida a autorização parental (email) e cria o perfil de aluno com o nickname escolhido
        const { error: authErr } = await supabase.rpc('start_student_signup', {
          p_nickname: nickname || name,
        })
        if (authErr) {
          // Limpa o perfil criado para poder voltar a tentar sem "utilizador já existe"
          await supabase.from('user_profiles').delete().eq('id', data.user.id)
          await supabase.auth.signOut()
          throw authErr
        }
        await supabase.rpc('complete_student_auth')
      }
    }

    return data
  }

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    })
    if (error) throw error
  }

  const ensureGoogleProfile = async (authUser) => {
    // Cria o perfil se ainda não existir (utilizador novo OU existente a entrar pela 1ª vez via Google)
    const { data: existing } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle()
    if (existing) return existing
    const name = authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Utilizador'

    // Verifica se o email Google já está autorizado por um pai (aluno)
    try {
      await supabase.rpc('is_authorized_student_email')
    } catch { /* função em falta → segue para escolha de papel */ }

    const { data: created, error } = await supabase
      .from('user_profiles')
      .insert({
        id: authUser.id,
        email: authUser.email,
        name,
        role: 'pending_role',
        picture: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || null,
      })
      .select()
      .single()
    if (error) return null
    return created
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
      value={{ user, profile, loading, login, register, logout, checkAuth, changePassword, fetchProfile, setProfile, loginWithGoogle, ensureGoogleProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}
