import {
  Shield, AlertTriangle, Heart, Clock, Zap, MapPin, Radio, Phone,
  ChevronRight, Activity, TrendingUp, ArrowRight
} from 'lucide-react';
import type { PageId } from '../App';
import { useAlert } from '../context/AlertContext';

interface HomePageProps {
  onNavigate: (page: PageId) => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {
  const { accidents } = useAlert();
  const resolved = accidents.filter(a => a.status === 'Resolved').length;
  const alertsSent = accidents.filter(a => a.status !== 'Detected').length;

  const stats = [
    { label: 'Accidents Detected', value: accidents.length.toString(), icon: <AlertTriangle size={22} />, variant: 'danger' as const, change: '+12% this month', up: false },
    { label: 'Rescue Alerts Sent', value: alertsSent.toString(), icon: <Radio size={22} />, variant: 'warning' as const, change: '+8% this month', up: true },
    { label: 'Lives Saved', value: (resolved * 3).toString(), icon: <Heart size={22} />, variant: 'success' as const, change: '+15% this month', up: true },
    { label: 'Avg Response Time', value: '4.2m', icon: <Clock size={22} />, variant: 'accent' as const, change: '-18% improvement', up: true },
  ];

  const howItWorks = [
    { step: 1, title: 'AI Detection', desc: 'Our AI cameras and IoT sensors continuously monitor roads for accidents in real-time.' },
    { step: 2, title: 'Instant Alert', desc: 'Within seconds of detection, SOS alerts are sent to the nearest emergency teams.' },
    { step: 3, title: 'GPS Tracking', desc: 'Precise GPS coordinates guide rescue teams to the exact accident location.' },
    { step: 4, title: 'Rapid Response', desc: 'Ambulances and rescue teams are dispatched immediately, saving critical minutes.' },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-particles">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 10}s`,
                animationDuration: `${10 + Math.random() * 10}s`,
              }}
            />
          ))}
        </div>

        <div className="hero-badge animate-slide-up stagger-1">
          <Zap size={14} />
          AI-Powered Emergency Response
        </div>

        <h1 className="hero-title animate-slide-up stagger-2">
          Saving Lives with <span className="gradient-text">Intelligent</span> Road Safety
        </h1>

        <p className="hero-subtitle animate-slide-up stagger-3">
          Road SOS uses AI cameras, IoT sensors, and GPS devices to instantly detect accidents
          and dispatch emergency teams — reducing response time by up to 60%.
        </p>

        <div className="hero-actions animate-slide-up stagger-4">
          <button className="btn-sos" onClick={() => onNavigate('sos')} id="hero-sos-btn">
            <AlertTriangle size={20} />
            Emergency SOS
          </button>
          <button className="btn btn-secondary" onClick={() => onNavigate('dashboard')} id="hero-dashboard-btn" style={{ padding: '1rem 2rem', fontSize: '1rem' }}>
            <LayoutDashboardIcon />
            Live Dashboard
            <ChevronRight size={18} />
          </button>
        </div>
      </section>

      {/* Stats Section */}
      <section style={{ padding: '0 2rem 3rem' }}>
        <div className="grid grid-4">
          {stats.map((stat, i) => (
            <div key={i} className={`stat-card ${stat.variant} animate-slide-up stagger-${i + 1}`}>
              <div className={`stat-icon ${stat.variant}`}>{stat.icon}</div>
              <div className="stat-info">
                <div className="stat-label">{stat.label}</div>
                <div className="stat-value">{stat.value}</div>
                <div className={`stat-change ${stat.up ? 'up' : 'down'}`}>
                  <TrendingUp size={12} />
                  {stat.change}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="section-header">
          <h2>How It Works</h2>
          <p style={{ maxWidth: 500, margin: '0 auto' }}>
            Our platform connects AI detection systems with emergency services for rapid accident response.
          </p>
        </div>
        <div className="grid grid-4">
          {howItWorks.map((item, i) => (
            <div key={i} className={`glass-card step-card animate-slide-up stagger-${i + 1}`}>
              <div className="step-number">{item.step}</div>
              <h3>{item.title}</h3>
              <p style={{ fontSize: '0.85rem' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ padding: '2rem' }}>
        <div className="section-header">
          <h2>Platform Features</h2>
          <p style={{ maxWidth: 500, margin: '0 auto' }}>Everything you need for comprehensive road safety management.</p>
        </div>
        <div className="grid grid-3">
          {[
            { icon: <Activity size={24} />, title: 'Real-Time Monitoring', desc: 'Live dashboard tracking all detected accidents with severity levels and response status.', action: 'dashboard' },
            { icon: <MapPin size={24} />, title: 'GPS & IoT Integration', desc: 'Vehicle GPS, IoT sensors, and mobile phones auto-send SOS with precise location data.', action: 'sos' },
            { icon: <Phone size={24} />, title: 'Emergency Dispatch', desc: 'Instantly notify and dispatch nearest ambulances, rescue teams, and police units.', action: 'response' },
          ].map((feat, i) => (
            <div
              key={i}
              className={`glass-card animate-slide-up stagger-${i + 1}`}
              style={{ cursor: 'pointer' }}
              onClick={() => onNavigate(feat.action as PageId)}
            >
              <div className="stat-icon accent" style={{ marginBottom: '1rem' }}>{feat.icon}</div>
              <h3 style={{ marginBottom: '0.5rem' }}>{feat.title}</h3>
              <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>{feat.desc}</p>
              <span style={{ color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                Learn More <ArrowRight size={14} />
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section style={{ padding: '2rem 2rem 4rem' }}>
        <div className="glass-card" style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center', padding: '3rem 2rem' }}>
          <Shield size={40} style={{ color: 'var(--accent)', marginBottom: '1rem' }} />
          <h2 style={{ marginBottom: '0.5rem' }}>Emergency Contacts</h2>
          <p style={{ marginBottom: '1.5rem' }}>Reach our emergency operations center 24/7</p>
          <div className="flex gap-md justify-center flex-wrap">
            <div className="glass-card" style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Emergency Hotline</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-critical)', fontFamily: 'var(--font-display)' }}>911</div>
            </div>
            <div className="glass-card" style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Road SOS Center</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent)', fontFamily: 'var(--font-display)' }}>1-800-SOS</div>
            </div>
            <div className="glass-card" style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Support Email</div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--accent)' }}>help@roadsos.io</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function LayoutDashboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
