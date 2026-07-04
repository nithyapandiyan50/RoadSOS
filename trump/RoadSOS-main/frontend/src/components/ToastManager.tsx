import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useAlert } from '../context/AlertContext';

export default function ToastManager() {
  const { notifications, dismissNotification } = useAlert();
  const [visibleToasts, setVisibleToasts] = useState<string[]>([]);
  const [leavingToasts, setLeavingToasts] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Show only latest 3 notifications as toasts
    const latestIds = notifications.slice(0, 3).map(n => n.id);
    setVisibleToasts(latestIds);

    // Auto-dismiss after 6 seconds
    const timers = latestIds.map(id =>
      setTimeout(() => handleDismiss(id), 6000)
    );
    return () => timers.forEach(clearTimeout);
  }, [notifications]);

  const handleDismiss = (id: string) => {
    setLeavingToasts(prev => new Set(prev).add(id));
    setTimeout(() => {
      setLeavingToasts(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      dismissNotification(id);
    }, 300);
  };

  const toasts = notifications.filter(n => visibleToasts.includes(n.id));

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast ${leavingToasts.has(toast.id) ? 'leaving' : ''}`}>
          <div className={`toast-severity-bar ${toast.severity.toLowerCase()}`} />
          <div className="toast-content">
            <div className="toast-title">{toast.title}</div>
            <div className="toast-message">{toast.message}</div>
            <div className="toast-time">{toast.timestamp}</div>
          </div>
          <button className="toast-close" onClick={() => handleDismiss(toast.id)}>
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
