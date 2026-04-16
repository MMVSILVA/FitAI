import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div style={{ padding: '20px', backgroundColor: '#000', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
          <h1 style={{ color: '#ff4444' }}>Ocorreu um erro no aplicativo.</h1>
          <p>Desculpe pelo transtorno. Nossa equipe foi notificada.</p>
          <pre style={{ backgroundColor: '#222', padding: '10px', borderRadius: '5px', overflowX: 'auto', marginTop: '20px' }}>
            {this.state.error?.message}
          </pre>
          <button 
            onClick={() => window.location.reload()} 
            style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#a855f7', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold' }}
          >
            Recarregar página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
