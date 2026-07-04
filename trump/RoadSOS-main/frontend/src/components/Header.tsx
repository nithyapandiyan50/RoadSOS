import { Search, Bell, Sun, Moon, Menu } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAlert } from '../context/AlertContext';
import { useState } from 'react';

interface HeaderProps {
  onMenuToggle: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { notifications, dismissNotification } = useAlert();
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <>
      <header className="top-header">
        <div className="header-left">
          <button className="mobile-menu-btn" onClick={onMenuToggle} aria-label="Toggle menu" id="menu-toggle">
            <Menu size={22} />
          </button>
          <div className="header-search hide-mobile">
            <Search className="search-icon" size={16} />
            <input type="text" placeholder="Search accidents, teams..." id="header-search" />
          </div>
        </div>

        <div className="header-right">
          <button
            className="header-icon-btn"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            id="theme-toggle"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button
            className="header-icon-btn"
            onClick={() => setNotifOpen(!notifOpen)}
            title="Notifications"
            id="notif-toggle"
          >
            <Bell size={18} />
            {notifications.length > 0 && <span className="notif-dot" />}
          </button>
        </div>
      </header>

      {/* Notification Panel */}
      <div className={`notif-panel ${notifOpen ? 'open' : ''}`}>
        <div className="notif-panel-header">
          <h4>Notifications</h4>
          <button className="btn-ghost btn-sm" onClick={() => setNotifOpen(false)}>Close</button>
        </div>
        <div className="notif-list">
          {notifications.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <Bell size={32} style={{ opacity: 0.3 }} />
              <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>No notifications yet</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className="notif-item">
                <div className={`toast-severity-bar ${n.severity.toLowerCase()}`} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{n.title}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>{n.message}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{n.timestamp}</div>
                </div>
                <button className="toast-close" onClick={() => dismissNotification(n.id)}>✕</button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
