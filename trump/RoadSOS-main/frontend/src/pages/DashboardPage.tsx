import { LayoutDashboard, Filter } from 'lucide-react';
import { useAlert } from '../context/AlertContext';
import AccidentMap from '../components/AccidentMap';
import { MapErrorBoundary } from '../components/MapErrorBoundary';
import { useState } from 'react';

const formatTime = (ts: string) => {
  const d = new Date(ts);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (diff < 1) return 'Just now';
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return d.toLocaleDateString();
};

export default function DashboardPage() {
  const { accidents, isLoading } = useAlert();
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = accidents.filter(a => {
    if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    return true;
  });

  const counts = {
    total: accidents.length,
    critical: accidents.filter(a => a.severity === 'Critical').length,
    active: accidents.filter(a => a.status !== 'Resolved').length,
    resolved: accidents.filter(a => a.status === 'Resolved').length,
  };

  if (isLoading) {
    return (
      <div className="loading-overlay">
        <div className="loading-spinner" />
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1><LayoutDashboard size={24} /> Live Accident Dashboard</h1>
        <p>Real-time monitoring of all detected road accidents</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-4" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card accent">
          <div className="stat-info">
            <div className="stat-label">Total Incidents</div>
            <div className="stat-value">{counts.total}</div>
          </div>
        </div>
        <div className="stat-card danger">
          <div className="stat-info">
            <div className="stat-label">Critical</div>
            <div className="stat-value" style={{ color: 'var(--color-critical)' }}>{counts.critical}</div>
          </div>
        </div>
        <div className="stat-card warning">
          <div className="stat-info">
            <div className="stat-label">Active</div>
            <div className="stat-value" style={{ color: 'var(--color-medium)' }}>{counts.active}</div>
          </div>
        </div>
        <div className="stat-card success">
          <div className="stat-info">
            <div className="stat-label">Resolved</div>
            <div className="stat-value" style={{ color: 'var(--color-resolved)' }}>{counts.resolved}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.25rem' }}>
        {/* Map Section */}
        <div className="glass-card no-hover" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '1rem' }}>Accident Map</h3>
            <div className="flex gap-sm items-center">
              <Filter size={14} style={{ color: 'var(--text-muted)' }} />
              <select className="form-select" value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} style={{ width: 'auto', padding: '0.35rem 2rem 0.35rem 0.5rem', fontSize: '0.78rem' }}>
                <option value="all">All Severity</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
              <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 'auto', padding: '0.35rem 2rem 0.35rem 0.5rem', fontSize: '0.78rem' }}>
                <option value="all">All Status</option>
                <option value="Detected">Detected</option>
                <option value="Alert Sent">Alert Sent</option>
                <option value="Rescue Dispatched">Dispatched</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>
          <MapErrorBoundary>
            <AccidentMap accidents={filtered} height="500px" />
          </MapErrorBoundary>
        </div>

        {/* Live Feed */}
        <div className="glass-card no-hover" style={{ padding: 0, display: 'flex', flexDirection: 'column', maxHeight: '570px' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1rem' }}>Real-Time Feed</h3>
            <p style={{ fontSize: '0.78rem', marginTop: '0.15rem' }}>{filtered.length} incidents</p>
          </div>
          <div className="feed-list" style={{ padding: '0.75rem', overflowY: 'auto', flex: 1 }}>
            {filtered.length === 0 ? (
              <div className="empty-state">
                <p>No incidents match filters</p>
              </div>
            ) : (
              filtered.map(acc => (
                <div key={acc.id} className="feed-item">
                  <div className={`feed-severity-dot ${acc.severity.toLowerCase()}`} />
                  <div className="feed-content">
                    <div className="feed-location">{acc.locationName}</div>
                    <div className="feed-meta">
                      <span className={`badge badge-${acc.severity.toLowerCase()}`}>{acc.severity}</span>
                      <span className={`badge badge-${acc.status === 'Alert Sent' ? 'alert-sent' : acc.status === 'Rescue Dispatched' ? 'dispatched' : acc.status.toLowerCase()}`}>{acc.status}</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      {acc.source} • {formatTime(acc.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Responsive override for small screens */}
      <style>{`
        @media (max-width: 992px) {
          .page-container > div:last-of-type {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
