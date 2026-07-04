import {
  Home, LayoutDashboard, AlertTriangle, Truck, Brain, BarChart3,
  Settings, Shield
} from 'lucide-react';
import type { PageId } from '../App';
import { useAlert } from '../context/AlertContext';

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  isOpen: boolean;
  onClose: () => void;
}

const navItems: { id: PageId; label: string; icon: React.ReactNode; section?: string }[] = [
  { id: 'home', label: 'Home', icon: <Home size={20} />, section: 'Main' },
  { id: 'dashboard', label: 'Live Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: 'sos', label: 'SOS Alert', icon: <AlertTriangle size={20} /> },
  { id: 'response', label: 'Emergency Response', icon: <Truck size={20} />, section: 'Operations' },
  { id: 'ai-detection', label: 'AI Detection', icon: <Brain size={20} /> },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={20} />, section: 'Insights' },
  { id: 'admin', label: 'Admin Panel', icon: <Settings size={20} /> },
];

export default function Sidebar({ currentPage, onNavigate, isOpen }: SidebarProps) {
  const { accidents } = useAlert();
  const activeCount = accidents.filter(a => a.status !== 'Resolved').length;

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-logo">
        <div className="logo-icon">
          <Shield size={22} color="#fff" />
        </div>
        <div className="logo-text">
          Road <span>SOS</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item, idx) => (
          <div key={item.id}>
            {item.section && (
              <div className="nav-section-label" style={idx > 0 ? { marginTop: '0.5rem' } : undefined}>
                {item.section}
              </div>
            )}
            <button
              className={`nav-link ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
              id={`nav-${item.id}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
              {item.id === 'dashboard' && activeCount > 0 && (
                <span className="nav-badge">{activeCount}</span>
              )}
            </button>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div className="status-dot available" />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>System Online</span>
        </div>
      </div>
    </aside>
  );
}
