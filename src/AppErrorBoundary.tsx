import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { error: Error | null }

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Dibot runtime error:', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
        <section role="alert" style={{ maxWidth: 560, border: '1px solid #fecaca', borderRadius: 16, padding: 24, color: '#7f1d1d', background: '#fff1f2' }}>
          <h1 style={{ margin: 0, fontSize: 20 }}>La aplicación encontró un error</h1>
          <p style={{ marginBottom: 16 }}>El equipo de reparación debe corregir este bloqueo antes de entregar.</p>
          <pre style={{ overflowX: 'auto', whiteSpace: 'pre-wrap', fontSize: 12 }}>{this.state.error.message}</pre>
          <button type="button" onClick={() => window.location.reload()} style={{ minHeight: 44, border: 0, borderRadius: 10, padding: '0 16px', cursor: 'pointer' }}>
            Recargar aplicación
          </button>
        </section>
      </main>
    )
  }
}
