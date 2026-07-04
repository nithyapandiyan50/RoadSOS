import { useEffect, useRef, useState } from 'react';
import type { Accident } from '../context/AlertContext';
import { useTheme } from '../context/ThemeContext';

interface AccidentMapProps {
  accidents: Accident[];
  height?: string;
  center?: [number, number];
  zoom?: number;
}

const severityColors: Record<string, string> = {
  Low: '#3b82f6',
  Medium: '#f59e0b',
  High: '#f97316',
  Critical: '#ef4444',
};

const formatTime = (ts: string) => {
  const d = new Date(ts);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (diff < 1) return 'Just now';
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return d.toLocaleDateString();
};

export default function AccidentMap({
  accidents,
  height = '450px',
  center,
  zoom = 13,
}: AccidentMapProps) {
  const { theme } = useTheme();
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<any[]>([]);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    let map: any = null;
    let resizeObserver: ResizeObserver | null = null;

    const init = async () => {
      if (!containerRef.current) return;

      try {
        const L = (await import('leaflet')).default;
        if (!mountedRef.current || !containerRef.current) return;

        // Use requestAnimationFrame to ensure container has final CSS dimensions
        requestAnimationFrame(() => {
          if (!mountedRef.current || !containerRef.current) return;

          const defaultCenter: [number, number] = center ||
            (accidents.length > 0
              ? [accidents[0].latitude, accidents[0].longitude]
              : [37.7749, -122.4194]);

          map = L.map(containerRef.current!, {
            center: defaultCenter,
            zoom,
            zoomControl: true,
            preferCanvas: true,
          });

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/">OSM</a>',
            maxZoom: 19,
          }).addTo(map);

          mapRef.current = { map, L };

          // Critical: invalidate size after mount so tiles fill the container
          setTimeout(() => {
            if (mountedRef.current && map) {
              map.invalidateSize(true);
              setMapReady(true);
            }
          }, 100);

          // Watch container resize (e.g., sidebar toggle) and re-invalidate
          resizeObserver = new ResizeObserver(() => {
            if (mountedRef.current && map) {
              map.invalidateSize(false);
            }
          });
          resizeObserver.observe(containerRef.current!);
        });
      } catch (err: any) {
        console.error('[AccidentMap] Init error:', err);
        if (mountedRef.current) setMapError(err.message || 'Failed to load map');
      }
    };

    init();

    return () => {
      mountedRef.current = false;
      if (resizeObserver) resizeObserver.disconnect();
      if (map) {
        try { map.remove(); } catch (_) {}
      }
      mapRef.current = null;
      setMapReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync markers whenever accidents change (live Socket.IO updates)
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    const { map, L } = mapRef.current;

    markersRef.current.forEach(m => { try { m.remove(); } catch (_) {} });
    markersRef.current = [];

    accidents.forEach(acc => {
      const color = severityColors[acc.severity] || '#6366f1';
      const isCritical = acc.severity === 'Critical';

      const icon = L.divIcon({
        className: '',
        html: `<div style="
          width:${isCritical ? 34 : 28}px;
          height:${isCritical ? 34 : 28}px;
          background:${color};
          border:3px solid white;
          border-radius:50%;
          box-shadow:0 2px 12px ${color}90;
          display:flex;align-items:center;justify-content:center;
        "><div style="width:8px;height:8px;background:white;border-radius:50%;"></div></div>`,
        iconSize: [isCritical ? 34 : 28, isCritical ? 34 : 28],
        iconAnchor: [isCritical ? 17 : 14, isCritical ? 17 : 14],
        popupAnchor: [0, -20],
      });

      const marker = L.marker([acc.latitude, acc.longitude], { icon })
        .bindPopup(`
          <div style="font-family:system-ui,sans-serif;min-width:190px;padding:2px;">
            <strong style="font-size:0.88rem;color:#1e293b;display:block;margin-bottom:6px;">${acc.locationName}</strong>
            <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:6px;">
              <span style="background:${color};color:#fff;padding:2px 8px;border-radius:99px;font-size:0.7rem;font-weight:700;">${acc.severity}</span>
              <span style="background:#334155;color:#cbd5e1;padding:2px 8px;border-radius:99px;font-size:0.7rem;">${acc.status}</span>
            </div>
            <p style="color:#475569;font-size:0.77rem;margin:0 0 4px;">${acc.description.slice(0, 120)}${acc.description.length > 120 ? '...' : ''}</p>
            <p style="color:#94a3b8;font-size:0.7rem;margin:0;">${acc.source} · ${formatTime(acc.timestamp)}</p>
          </div>
        `)
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [accidents, mapReady]);

  // Apply / remove dark mode filter on tile pane
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Try immediately and after a tick (tiles may not exist yet)
    const apply = () => {
      const tilePanes = container.querySelectorAll<HTMLElement>('.leaflet-tile-pane');
      tilePanes.forEach(pane => {
        pane.style.filter = theme === 'dark'
          ? 'invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)'
          : 'none';
      });
    };

    apply();
    const t = setTimeout(apply, 400);
    return () => clearTimeout(t);
  }, [theme, mapReady]);

  if (mapError) {
    return (
      <div style={{
        height, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-secondary)', color: 'var(--text-muted)',
        gap: '0.5rem', textAlign: 'center', padding: '2rem'
      }}>
        <span style={{ fontSize: '2rem' }}>🗺️</span>
        <strong style={{ color: 'var(--text-primary)' }}>Map unavailable</strong>
        <p style={{ fontSize: '0.8rem', margin: 0 }}>Could not load the interactive map.</p>
        <button
          onClick={() => setMapError(null)}
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

  return (
    <div
      ref={containerRef}
      style={{ height, width: '100%', background: '#1e293b' }}
      className={`map-container${theme === 'dark' ? ' dark-map' : ''}`}
    />
  );
}
