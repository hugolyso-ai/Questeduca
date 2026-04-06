import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, Award, Trophy, TrendingUp, Clock, Check, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Função para gerar PDF de relatório de progresso
const generateProgressReport = async (studentData, parentName) => {
  // Criar conteúdo HTML para o relatório
  const reportHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Relatório de Progresso - QUESTEDUCA</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
        .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #8b5cf6; padding-bottom: 20px; }
        .logo { font-size: 32px; font-weight: bold; color: #8b5cf6; }
        .subtitle { color: #64748b; margin-top: 5px; }
        .section { margin-bottom: 30px; }
        .section-title { font-size: 18px; font-weight: bold; color: #8b5cf6; margin-bottom: 15px; display: flex; align-items: center; gap: 10px; }
        .card { background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 15px; }
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
        .stat-card { background: white; border-radius: 10px; padding: 15px; text-align: center; border: 1px solid #e2e8f0; }
        .stat-value { font-size: 28px; font-weight: bold; color: #8b5cf6; }
        .stat-label { font-size: 12px; color: #64748b; margin-top: 5px; }
        .progress-bar { height: 10px; background: #e2e8f0; border-radius: 5px; overflow: hidden; margin-top: 10px; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #8b5cf6, #ec4899); border-radius: 5px; }
        .achievements { display: flex; flex-wrap: wrap; gap: 10px; }
        .achievement { background: #fef3c7; border: 2px solid #f59e0b; border-radius: 20px; padding: 8px 15px; font-size: 12px; font-weight: bold; color: #92400e; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background: #f1f5f9; font-weight: 600; color: #475569; }
        .grade-good { color: #16a34a; }
        .grade-medium { color: #ca8a04; }
        .grade-low { color: #dc2626; }
        .history-table { margin-top: 15px; }
        .history-table th, .history-table td { padding: 8px 12px; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">🎓 QUESTEDUCA</div>
        <div class="subtitle">Relatório de Progresso Educativo</div>
      </div>

      <div class="section">
        <div class="section-title">👤 Informações do Aluno</div>
        <div class="card">
          <table>
            <tr><td><strong>Nome:</strong></td><td>${studentData.nickname || studentData.name || 'N/A'}</td></tr>
            <tr><td><strong>Ano Escolar:</strong></td><td>${studentData.school_year || 'N/A'}º Ano</td></tr>
            <tr><td><strong>Escola:</strong></td><td>${studentData.school_name || 'N/A'}</td></tr>
            <tr><td><strong>Data do Relatório:</strong></td><td>${new Date().toLocaleDateString('pt-PT')}</td></tr>
          </table>
        </div>
      </div>

      <div class="section">
        <div class="section-title">📊 Estatísticas Gerais</div>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${studentData.xp || 0}</div>
            <div class="stat-label">XP Total</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${studentData.level || 1}</div>
            <div class="stat-label">Nível</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${studentData.quizzes_completed || 0}</div>
            <div class="stat-label">Quizzes Completados</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${studentData.correct_answers || 0}%</div>
            <div class="stat-label">Taxa de Acerto</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${studentData.streak || 0}</div>
            <div class="stat-label">Dias Seguidos</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${studentData.rank || '-'}</div>
            <div class="stat-label">Posição na Liga</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">🏙️ Progresso da Cidade</div>
        <div class="card">
          <p><strong>Nível da Cidade:</strong> ${studentData.settlement_level || 'Aldeia'}</p>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${Math.min((studentData.total_building_level || 0) * 2, 100)}%"></div>
          </div>
          <p style="margin-top: 10px; font-size: 12px; color: #64748b;">
            ${studentData.total_building_level || 0}/50 níveis de edifícios
          </p>
        </div>
      </div>

      <div class="section">
        <div class="section-title">📚 Desempenho por Disciplina</div>
        <div class="card">
          <table>
            <thead>
              <tr>
                <th>Disciplina</th>
                <th>Quizzes</th>
                <th>Acertos</th>
                <th>Avaliação</th>
              </tr>
            </thead>
            <tbody>
              ${(studentData.subjects_performance || []).map(s => `
                <tr>
                  <td>${s.name}</td>
                  <td>${s.quizzes}</td>
                  <td>${s.accuracy}%</td>
                  <td class="${s.accuracy >= 80 ? 'grade-good' : s.accuracy >= 60 ? 'grade-medium' : 'grade-low'}">
                    ${s.accuracy >= 80 ? '✓ Excelente' : s.accuracy >= 60 ? '◐ Bom' : '✗ A melhorar'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="section">
        <div class="section-title">📝 Histórico Recente de Quizzes</div>
        <div class="card">
          <table class="history-table">
            <thead>
              <tr>
                <th>Disciplina</th>
                <th>Data</th>
                <th>Corretas</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${(studentData.quiz_history || []).slice(0, 10).map(q => `
                <tr>
                  <td>${q.subject}</td>
                  <td>${q.date ? new Date(q.date).toLocaleDateString('pt-PT') : '-'}</td>
                  <td>${q.correct}</td>
                  <td>${q.total}</td>
                </tr>
              `).join('')}
              ${(!studentData.quiz_history || studentData.quiz_history.length === 0) ? '<tr><td colspan="4" style="text-align: center; color: #94a3b8;">Sem histórico disponível</td></tr>' : ''}
            </tbody>
          </table>
        </div>
      </div>

      <div class="section">
        <div class="section-title">🏆 Conquistas Desbloqueadas</div>
        <div class="card">
          <div class="achievements">
            ${(studentData.achievements || ['Aventureiro']).map(a => 
              `<span class="achievement">🎖️ ${a}</span>`
            ).join('')}
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">💡 Recomendações</div>
        <div class="card">
          <ul style="list-style-type: none; padding: 0;">
            <li style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
              📌 Continue a praticar <strong>diariamente</strong> para manter o streak ativo
            </li>
            <li style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
              📌 Foque em disciplinas com menor taxa de acerto para melhorar
            </li>
            <li style="padding: 8px 0;">
              📌 Complete os desafios semanais para ganhar recompensas extra
            </li>
          </ul>
        </div>
      </div>

      <div class="footer">
        <p>Relatório gerado automaticamente por QUESTEDUCA</p>
        <p>© ${new Date().getFullYear()} QUESTEDUCA - Aprender a Brincar</p>
      </div>
    </body>
    </html>
  `;

  return reportHTML;
};

// Componente de botão de exportação
export const ExportReportButton = ({ studentData, onExport }) => {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const reportHTML = await generateProgressReport(studentData);
      
      // Abrir em nova janela para impressão/PDF
      const printWindow = window.open('', '_blank');
      printWindow.document.write(reportHTML);
      printWindow.document.close();
      
      // Dar tempo para carregar e depois abrir diálogo de impressão
      setTimeout(() => {
        printWindow.print();
      }, 500);
      
      toast.success('Relatório gerado! Use "Guardar como PDF" na janela de impressão.');
      onExport?.();
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Erro ao gerar relatório');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 transition disabled:opacity-50"
    >
      {loading ? (
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
      ) : (
        <FileText size={18} />
      )}
      Exportar PDF
    </button>
  );
};

// Modal completo de exportação de relatórios
const ReportExportModal = ({ isOpen, onClose, children }) => {
  const [selectedReport, setSelectedReport] = useState('progress');
  const [dateRange, setDateRange] = useState('month');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [fetchingData, setFetchingData] = useState(false);

  const reportTypes = [
    { id: 'progress', name: 'Relatório de Progresso', icon: TrendingUp, description: 'Visão geral do desempenho' },
    { id: 'achievements', name: 'Conquistas', icon: Award, description: 'Lista de badges desbloqueados' },
    { id: 'activity', name: 'Atividade', icon: Calendar, description: 'Histórico de quizzes e jogos' },
    { id: 'ranking', name: 'Classificação', icon: Trophy, description: 'Posição nas ligas e rankings' }
  ];

  // Fetch real data when modal opens
  useEffect(() => {
    const fetchReportData = async () => {
      if (isOpen && children?.student_id) {
        setFetchingData(true);
        try {
          const response = await axios.get(`${API}/reports/student/${children.student_id}`, {
            withCredentials: true
          });
          setReportData(response.data);
        } catch (error) {
          console.error('Error fetching report data:', error);
          // Fallback to children data if API fails
          setReportData(children);
        } finally {
          setFetchingData(false);
        }
      }
    };
    fetchReportData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, children?.student_id]);

  const handleExport = async () => {
    setLoading(true);
    
    try {
      // Use fetched data or children data as fallback
      const dataToUse = reportData || children || {};
      
      // Generate and open report
      const reportHTML = await generateProgressReport(dataToUse);
      const printWindow = window.open('', '_blank');
      printWindow.document.write(reportHTML);
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
      }, 500);
      
      toast.success('Relatório gerado com sucesso!');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Erro ao gerar relatório');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-xl">
              <FileText size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                Exportar Relatório
              </h2>
              <p className="text-white/80 text-sm">
                Gera um PDF com o progresso do aluno
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Tipo de relatório */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Tipo de Relatório
            </label>
            <div className="grid grid-cols-2 gap-3">
              {reportTypes.map(type => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => setSelectedReport(type.id)}
                    className={`p-4 rounded-xl border-2 text-left transition ${
                      selectedReport === type.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon size={18} className={selectedReport === type.id ? 'text-blue-600' : 'text-slate-400'} />
                      <span className={`font-semibold text-sm ${selectedReport === type.id ? 'text-blue-700' : 'text-slate-700'}`}>
                        {type.name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{type.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Período */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Período
            </label>
            <div className="flex gap-2">
              {[
                { id: 'week', label: 'Última Semana' },
                { id: 'month', label: 'Último Mês' },
                { id: 'year', label: 'Este Ano' },
                { id: 'all', label: 'Tudo' }
              ].map(range => (
                <button
                  key={range.id}
                  onClick={() => setDateRange(range.id)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${
                    dateRange === range.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
            <p className="flex items-start gap-2">
              <Check size={18} className="flex-shrink-0 mt-0.5" />
              <span>
                O relatório será aberto numa nova janela. Use "Guardar como PDF" 
                ou "Imprimir para PDF" para guardar o ficheiro.
              </span>
            </p>
          </div>

          {/* Botões */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleExport}
              disabled={loading || fetchingData}
              className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
              data-testid="generate-pdf-btn"
            >
              {fetchingData ? (
                <>
                  <RefreshCw className="animate-spin" size={18} />
                  A carregar dados...
                </>
              ) : loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  A gerar...
                </>
              ) : (
                <>
                  <Download size={18} />
                  Gerar PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export { ReportExportModal, generateProgressReport };
export default ReportExportModal;
