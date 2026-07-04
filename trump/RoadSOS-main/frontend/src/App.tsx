import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ToastManager from './components/ToastManager';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import SOSPage from './pages/SOSPage';
import ResponsePage from './pages/ResponsePage';
import AIDetectionPage from './pages/AIDetectionPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AdminPage from './pages/AdminPage';

export type PageId = 'home' | 'dashboard' | 'sos' | 'response' | 'ai-detection' | 'analytics' | 'admin';

function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderPage = () => {
    switch (currentPage) {
      case 'home': return <HomePage onNavigate={setCurrentPage} />;
      case 'dashboard': return <DashboardPage />;
      case 'sos': return <SOSPage />;
      case 'response': return <ResponsePage />;
      case 'ai-detection': return <AIDetectionPage />;
      case 'analytics': return <AnalyticsPage />;
      case 'admin': return <AdminPage />;
      default: return <HomePage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        currentPage={currentPage}
        onNavigate={(page) => { setCurrentPage(page); setSidebarOpen(false); }}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <div className="main-content">
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        {renderPage()}
      </div>

      <ToastManager />
    </div>
  );
}

export default App;
