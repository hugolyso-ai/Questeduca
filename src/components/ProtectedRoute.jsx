import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function ProtectedRoute({ allowedRoles, children }) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-400 to-blue-500">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white text-lg font-semibold">A carregar...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Conta rejeitada ou pendente de aprovação → ecrã de espera
  if (profile && (profile.approval_status === 'pending' || profile.approval_status === 'rejected')) {
    return <Navigate to="/pending-approval" replace />
  }

  // Papel ainda não escolhido (login Google) → escolher papel
  if (profile && profile.role === 'pending_role') {
    return <Navigate to="/role-choice" replace />
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    const dashboardMap = {
      student: '/student/dashboard',
      parent: '/parent/dashboard',
      association: '/association/dashboard',
      admin: '/admin/dashboard',
      teacher: '/teacher/dashboard',
    }
    const target = dashboardMap[profile.role] || '/'
    return <Navigate to={target} replace />
  }

  return children
}

export default ProtectedRoute
