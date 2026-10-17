import React, { useState, useEffect } from 'react'
import { FileText, Download, Calendar, Award, Trophy, TrendingUp, Clock, Check, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'

const generateProgressReport = async (studentData, parentName) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Relatório de Progresso - QUESTEDUCA</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
        .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #22c55e; padding-bottom: 20px; }
        .logo { font-size: 32px; font-weight: bold; color: #22c55e; }
        .subtitle { color: #64748b; margin-top: 5px; }
        .section { margin-bottom: 30px; }
        .section-title { font-size: 18px; font-weight: bold; color: #22c55e; margin-bottom: 15px; }
        .card { background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 15px; }
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
        .stat-card { background: white; border-radius: 10px; padding: 15px; text-align: center; border: 1px solid #e2e8f0; }
        .stat-value { font-size: 28px; font-weight: bold; color: #22c55e; }
        .stat-label { font-size: 12px; color: #64748b; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background: #f1f5f9; font-weight: 600; color: #475569; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">QUESTEDUCA</div>
        <div class="subtitle">Relatório de Progresso Educativo</div>
      </div>
      <div class="section">
        <div class="section-title">Informações do Aluno</div>
        <div class="card">
          <table>
            <tr><td><strong>Nome:</strong></td><td>${studentData.nickname || studentData.name || 'N/A'}</td></tr>
            <tr><td><strong>Ano Escolar:</strong></td><td>${studentData.school_year || 'N/A'}º Ano</td></tr>
            <tr><td><strong>Data:</strong></td><td>${new Date().toLocaleDateString('pt-PT')}</td></tr>
          </table>
        </div>
      </div>
      <div class="section">
        <div class="section-title">Estatísticas Gerais</div>
        <div class="stats-grid">
          <div class="stat-card"><div class="stat-value">${studentData.xp || 0}</div><div class="stat-label">XP Total</div></div>
          <div class="stat-card"><div class="stat-value">${studentData.level || 1}</div><div class="stat-label">Nível</div></div>
          <div class="stat-card"><div class="stat-value">${studentData.current_streak || 0}</div><div class="stat-label">Dias Seguidos</div></div>
        </div>
      </div>
      <div class="footer">
        <p>Relatório gerado automaticamente por QUESTEDUCA</p>
        <p>(c) ${new Date().getFullYear()} QUESTEDUCA - Aprender a Brincar</p>
      </div>
    </body>
    </html>
  `
}

export const ExportReportButton = ({ studentData, onExport }) => {
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    setLoading(true)
    try {
      const reportHTML = await generateProgressReport(studentData)
      const printWindow = window.open('', '_blank')
      printWindow.document.write(reportHTML)
      printWindow.document.close()
      setTimeout(() => { printWindow.print() }, 500)
      toast.success('Relatório gerado! Use "Guardar como PDF" na janela de impressão.')
      onExport?.()
    } catch (error) {
      toast.error('Erro ao gerar relatório')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 transition disabled:opacity-50"
    >
      {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /> : <FileText size={18} />}
      Exportar PDF
    </button>
  )
}

const ReportExportModal = ({ isOpen, onClose, studentData }) => {
  const [reportData, setReportData] = useState(null)
  const [fetchingData, setFetchingData] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchReportData = async () => {
      if (isOpen && studentData?.user_id) {
        setFetchingData(true)
        try {
          const { data: gameState } = await supabase.from('game_states').select('*').eq('user_id', studentData.user_id).single()
          const { data: quizAnswers } = await supabase.from('quiz_answers').select('*').eq('user_id', studentData.user_id).order('created_at', { ascending: false }).limit(20)
          setReportData({ ...studentData, ...gameState, quiz_history: quizAnswers || [] })
        } catch {
          setReportData(studentData)
        } finally {
          setFetchingData(false)
        }
      }
    }
    fetchReportData()
  }, [isOpen, studentData])

  const handleExport = async () => {
    setLoading(true)
    try {
      const dataToUse = reportData || studentData || {}
      const reportHTML = await generateProgressReport(dataToUse)
      const printWindow = window.open('', '_blank')
      printWindow.document.write(reportHTML)
      printWindow.document.close()
      setTimeout(() => { printWindow.print() }, 500)
      toast.success('Relatório gerado!')
    } catch {
      toast.error('Erro ao gerar relatório')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText size={28} />
            <h2 className="text-xl font-bold" style={{ fontFamily: 'Fredoka, sans-serif' }}>Exportar Relatório</h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white text-xl">X</button>
        </div>
        <div className="p-6 space-y-4">
          <button onClick={handleExport} disabled={loading || fetchingData} className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2">
            {loading || fetchingData ? <><RefreshCw className="animate-spin" size={20} /> A preparar...</> : <><Download size={20} /> Gerar Relatório PDF</>}
          </button>
          <button onClick={onClose} className="w-full py-3 bg-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-300 transition">Fechar</button>
        </div>
      </div>
    </div>
  )
}

export default ReportExportModal
