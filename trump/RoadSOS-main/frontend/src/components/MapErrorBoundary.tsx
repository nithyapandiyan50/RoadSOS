import React from 'react';

interface State { hasError: boolean; error?: Error }

export class MapErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[MapErrorBoundary] Map crashed:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100%', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'var(--bg-secondary)', color: 'var(--text-muted)',
          gap: '0.5rem', padding: '2rem', textAlign: 'center'
        }}>
          <span style={{ fontSize: '2rem' }}>🗺️</span>
          <strong style={{ color: 'var(--text-primary)' }}>Map unavailable</strong>
          <p style={{ fontSize: '0.8rem', margin: 0 }}>
            Could not load the interactive map.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{
              marginTop: '0.5rem', padding: '0.4rem 1rem', borderRadius: '6px',
              background: 'var(--accent)', color: '#fff', border: 'none',
              cursor: 'pointer', fontSize: '0.8rem'
            }}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
