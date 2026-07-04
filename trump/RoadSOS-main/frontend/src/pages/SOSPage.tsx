import { useState, useRef } from 'react';
import { AlertTriangle, MapPin, Clock, Camera, Send, CheckCircle, Loader2, X } from 'lucide-react';
import { useAlert } from '../context/AlertContext';

export default function SOSPage() {
  const { reportAccident } = useAlert();
  const [mode, setMode] = useState<'sos' | 'form'>('sos');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'getting' | 'got' | 'error'>('idle');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const [form, setForm] = useState({
    locationName: '',
    severity: 'Medium',
    source: 'Mobile',
    description: '',
  });
  const [photoBase64, setPhotoBase64] = useState<string>('');
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setPhotoBase64(result);
      setPhotoPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const getGPS = () => {
    setGpsStatus('getting');
    if (!navigator.geolocation) {
      setGpsStatus('error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsStatus('got');
      },
      () => {
        // Fallback to SF coordinates for demo
        setCoords({ lat: 37.7749 + Math.random() * 0.01, lng: -122.4194 + Math.random() * 0.01 });
        setGpsStatus('got');
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const handleSOS = async () => {
    if (!coords) {
      getGPS();
      return;
    }
    setIsSubmitting(true);
    try {
      await reportAccident({
        latitude: coords.lat,
        longitude: coords.lng,
        locationName: `SOS Emergency Alert - GPS Location`,
        severity: 'Critical',
        source: 'Mobile',
        description: 'EMERGENCY SOS ACTIVATED — Immediate assistance required at GPS coordinates.',
        photoUrl: photoBase64 || '',
      });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coords) return;
    setIsSubmitting(true);
    try {
      await reportAccident({
        latitude: coords.lat,
        longitude: coords.lng,
        locationName: form.locationName || `Reported Location (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`,
        severity: form.severity as any,
        source: form.source as any,
        description: form.description || 'Accident reported via SOS form.',
        photoUrl: photoBase64 || '',
      });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="page-container">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
          <div className="animate-scale-in" style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--color-resolved-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <CheckCircle size={40} style={{ color: 'var(--color-resolved)' }} />
          </div>
          <h2 className="animate-slide-up stagger-1">SOS Alert Sent Successfully!</h2>
          <p className="animate-slide-up stagger-2" style={{ maxWidth: 400, marginTop: '0.75rem' }}>
            Emergency services have been notified. Help is on the way.
            Stay at your location if safe to do so.
          </p>
          <div className="animate-slide-up stagger-3" style={{ marginTop: '1.5rem' }}>
            <button className="btn btn-primary" onClick={() => { setSubmitted(false); setCoords(null); setGpsStatus('idle'); setPhotoBase64(''); setPhotoPreview(''); }}>
              Send Another Alert
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1><AlertTriangle size={24} /> SOS Alert System</h1>
        <p>Send an emergency alert with your location to nearby rescue teams</p>
      </div>

      {/* Mode Tabs */}
      <div className="tabs">
        <button className={`tab ${mode === 'sos' ? 'active' : ''}`} onClick={() => setMode('sos')}>
          🚨 Quick SOS
        </button>
        <button className={`tab ${mode === 'form' ? 'active' : ''}`} onClick={() => setMode('form')}>
          📝 Detailed Report
        </button>
      </div>

      {mode === 'sos' ? (
        /* Quick SOS Mode */
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '2rem' }}>
          {/* GPS Status */}
          <div className="glass-card" style={{ marginBottom: '2rem', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
            <div className="flex items-center justify-center gap-sm mb-sm">
              <MapPin size={18} style={{ color: coords ? 'var(--color-resolved)' : 'var(--text-muted)' }} />
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>GPS Location</span>
            </div>
            {gpsStatus === 'idle' && (
              <button className="btn btn-secondary w-full" onClick={getGPS}>
                <MapPin size={16} /> Capture GPS Location
              </button>
            )}
            {gpsStatus === 'getting' && (
              <div className="flex items-center justify-center gap-sm" style={{ color: 'var(--color-medium)' }}>
                <Loader2 size={18} className="loading-spinner" style={{ border: 'none', width: 18, height: 18 }} />
                Getting your location...
              </div>
            )}
            {gpsStatus === 'got' && coords && (
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-resolved)', fontWeight: 600, marginBottom: '0.25rem' }}>
                  ✓ Location captured
                </p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                  {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                </p>
              </div>
            )}
            {gpsStatus === 'error' && (
              <p style={{ color: 'var(--color-critical)', fontSize: '0.85rem' }}>GPS unavailable — using approximate location</p>
            )}
          </div>

          {/* SOS Button */}
          <button
            className="btn-sos"
            onClick={handleSOS}
            disabled={isSubmitting}
            id="sos-button"
            style={{ width: '200px', height: '200px', borderRadius: '50%', fontSize: '1.5rem', flexDirection: 'column', gap: '0.5rem' }}
          >
            {isSubmitting ? (
              <Loader2 size={40} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <>
                <AlertTriangle size={40} />
                SOS
              </>
            )}
          </button>
          <p style={{ marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', maxWidth: '350px' }}>
            {!coords ? 'First capture your GPS location, then press the SOS button' : 'Press the SOS button to send an emergency alert to all nearby rescue teams'}
          </p>

          {/* Timestamp */}
          <div className="glass-card" style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem' }}>
            <Clock size={16} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {new Date().toLocaleString()}
            </span>
          </div>
        </div>
      ) : (
        /* Detailed Report Form */
        <div style={{ maxWidth: '600px' }}>
          {/* GPS */}
          <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
            <div className="flex items-center justify-between mb-sm">
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>📍 Location</span>
              {coords ? (
                <span className="badge badge-resolved">✓ Captured</span>
              ) : (
                <button className="btn btn-secondary btn-sm" onClick={getGPS}>Capture GPS</button>
              )}
            </div>
            {coords && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                Lat: {coords.lat.toFixed(6)}, Lng: {coords.lng.toFixed(6)}
              </p>
            )}
          </div>

          <form onSubmit={handleFormSubmit}>
            <div className="form-group">
              <label className="form-label">Location Name</label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. Highway 101, Near Exit 25"
                value={form.locationName}
                onChange={e => setForm(p => ({ ...p, locationName: e.target.value }))}
                id="report-location"
              />
            </div>

            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Severity</label>
                <select className="form-select" value={form.severity} onChange={e => setForm(p => ({ ...p, severity: e.target.value }))} id="report-severity">
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Source</label>
                <select className="form-select" value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))} id="report-source">
                  <option value="Mobile">Mobile Phone</option>
                  <option value="GPS Device">GPS Device</option>
                  <option value="IoT">IoT Sensor</option>
                  <option value="Camera">Camera</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea"
                placeholder="Describe the accident scene..."
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                id="report-description"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Photo (optional)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handlePhotoChange}
                id="photo-file-input"
              />
              {photoPreview ? (
                <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden' }}>
                  <img src={photoPreview} alt="Preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '10px' }} />
                  <button
                    type="button"
                    onClick={() => { setPhotoBase64(''); setPhotoPreview(''); }}
                    style={{
                      position: 'absolute', top: '8px', right: '8px',
                      background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%',
                      width: '28px', height: '28px', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', cursor: 'pointer', color: '#fff'
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div
                  className="glass-card"
                  style={{ padding: '2rem', textAlign: 'center', border: '2px dashed var(--border-color)', cursor: 'pointer' }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
                  <p style={{ fontSize: '0.85rem' }}>Click to upload a photo</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>JPG, PNG up to 5MB</p>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={!coords || isSubmitting}
              id="submit-report"
              style={{ padding: '0.85rem', fontSize: '1rem' }}
            >
              {isSubmitting ? (
                <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Submitting...</>
              ) : (
                <><Send size={18} /> Submit Accident Report</>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
