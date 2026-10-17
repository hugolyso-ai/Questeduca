import React from 'react'
import { useAuth } from '../context/AuthContext'
import TeacherDashboardContent from '../components/TeacherDashboardContent'

const TeacherDashboard = () => {
  const { logout } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-slate-50">
      <nav className="backdrop-blur-xl bg-white/80 border-b border-slate-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎓</span>
              <span className="text-xl font-bold text-slate-900" style={{ fontFamily: 'Fredoka, sans-serif' }}>QUESTEDUCA</span>
            </div>
            <button onClick={logout} className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition">Sair</button>
          </div>
        </div>
      </nav>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <TeacherDashboardContent />
      </div>
    </div>
  )
}

export default TeacherDashboard
