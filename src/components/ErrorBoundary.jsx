import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('Erro ao apresentar a página:', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md text-center space-y-4">
          <p className="text-xl font-bold text-slate-900">Não foi possível mostrar esta página.</p>
          <p className="text-slate-600">Recarregue a página. Se o problema continuar, avise o suporte.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-3 rounded-xl bg-[hsl(35,92%,50%)] text-white font-semibold hover:opacity-90 transition"
          >
            Recarregar
          </button>
        </div>
      </div>
    )
  }
}

export default ErrorBoundary
