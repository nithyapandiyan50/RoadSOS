import { useState, useRef } from 'react';
import { Brain, Upload, Loader2, CheckCircle, AlertTriangle, X, Image } from 'lucide-react';
import { useAlert } from '../context/AlertContext';

const presetScenarios = [
  {
    id: 'collision', label: 'Multi-Vehicle Collision', type: 'collision',
    img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=600',
    emoji: '💥'
  },
  {
    id: 'fire', label: 'Vehicle Fire', type: 'fire',
    img: 'https://images.unsplash.com/photo-1615906655593-ad0386982a0f?auto=format&fit=crop&q=80&w=600',
    emoji: '🔥'
  },
  {
    id: 'rollover', label: 'Rollover Accident', type: 'rollover',
    img: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=600',
    emoji: '🔄'
  },
  {
    id: 'minor', label: 'Minor Collision', type: 'minor',
    img: 'https://images.unsplash.com/photo-1509803874385-db7c23652552?auto=format&fit=crop&q=80&w=600',
    emoji: '⚠️'
  },
];

interface DetectionResult {
  label: string;
  confidence: number;
  boundingBox: number[];
}

export default function AIDetectionPage() {
  const { triggerAIAnalysis } = useAlert();
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ detection: DetectionResult; accident: any } | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string>('');
  const [uploadedPreview, setUploadedPreview] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileRead = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setUploadedImage(result);
      setUploadedPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileRead(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileRead(file);
  };

  const handleDetect = async (type: string, imageBase64?: string) => {
    setSelectedScenario(type);
    setIsProcessing(true);
    setResult(null);
    try {
      const res = await triggerAIAnalysis(type, imageBase64);
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUploadedAnalyze = () => {
    if (!uploadedImage) return;
    handleDetect('collision', uploadedImage);
  };

  const confidenceColor = (c: number) => {
    if (c >= 0.9) return 'var(--color-critical)';
    if (c >= 0.8) return 'var(--color-high)';
    if (c >= 0.7) return 'var(--color-medium)';
    return 'var(--color-low)';
  };

  const resultImage = uploadedPreview ||
    presetScenarios.find(s => s.type === selectedScenario)?.img ||
    presetScenarios[0].img;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1><Brain size={24} /> AI Detection Module</h1>
        <p>Upload images or select preset scenarios to simulate AI-powered accident detection</p>
      </div>

      {/* Upload Zone */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
        id="ai-file-input"
      />

      {uploadedPreview ? (
        /* Uploaded Image Preview + Analyze Button */
        <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Image size={18} style={{ color: 'var(--accent)' }} />
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Image Ready for Analysis</span>
            </div>
            <button
              onClick={() => { setUploadedImage(''); setUploadedPreview(''); setResult(null); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
            >
              <X size={18} />
            </button>
          </div>
          <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', marginBottom: '1rem' }}>
            <img
              src={uploadedPreview}
              alt="Uploaded"
              style={{ width: '100%', maxHeight: '260px', objectFit: 'cover', borderRadius: '10px', display: 'block' }}
            />
          </div>
          <button
            className="btn btn-primary w-full"
            onClick={handleUploadedAnalyze}
            disabled={isProcessing}
            style={{ padding: '0.85rem', fontSize: '1rem' }}
            id="analyze-uploaded-btn"
          >
            {isProcessing ? (
              <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing...</>
            ) : (
              <><Brain size={18} /> Run AI Detection on Uploaded Image</>
            )}
          </button>
        </div>
      ) : (
        /* Drop Zone */
        <div
          className="glass-card"
          style={{
            textAlign: 'center',
            padding: '2.5rem',
            marginBottom: '1.5rem',
            cursor: 'pointer',
            border: `2px dashed ${isDragging ? 'var(--accent)' : 'var(--border-color)'}`,
            background: isDragging ? 'var(--accent-muted)' : undefined,
            transition: 'all 0.2s ease',
          }}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          id="ai-upload-zone"
        >
          <Upload size={40} style={{ color: isDragging ? 'var(--accent)' : 'var(--text-muted)', marginBottom: '0.75rem', transition: 'color 0.2s' }} />
          <h3 style={{ marginBottom: '0.35rem' }}>Upload Image or Video</h3>
          <p style={{ fontSize: '0.85rem' }}>Drag & drop or <span style={{ color: 'var(--accent)', fontWeight: 600 }}>click to browse</span> accident footage for AI analysis</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Supported: JPG, PNG, MP4 — Max 10MB</p>
        </div>
      )}

      {/* Preset Scenarios */}
      <h3 style={{ marginBottom: '1rem' }}>Or Select a Preset Scenario</h3>
      <div className="grid grid-4" style={{ marginBottom: '2rem' }}>
        {presetScenarios.map(s => (
          <div
            key={s.id}
            className="glass-card"
            style={{
              padding: 0,
              overflow: 'hidden',
              cursor: 'pointer',
              border: selectedScenario === s.type && !uploadedPreview ? '2px solid var(--accent)' : undefined,
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onClick={() => { setUploadedPreview(''); setUploadedImage(''); handleDetect(s.type); }}
            id={`scenario-${s.id}`}
          >
            <div style={{ position: 'relative', overflow: 'hidden' }}>
              <img
                src={s.img}
                alt={s.label}
                style={{ width: '100%', height: '140px', objectFit: 'cover', display: 'block' }}
                onError={(e) => {
                  // Fallback gradient if image fails
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.style.height = '140px';
                  (e.target as HTMLImageElement).parentElement!.style.background = 'linear-gradient(135deg, #1e293b, #334155)';
                  (e.target as HTMLImageElement).parentElement!.style.display = 'flex';
                  (e.target as HTMLImageElement).parentElement!.style.alignItems = 'center';
                  (e.target as HTMLImageElement).parentElement!.style.justifyContent = 'center';
                  (e.target as HTMLImageElement).parentElement!.innerHTML = `<span style="font-size:3rem">${s.emoji}</span>`;
                }}
              />
              {selectedScenario === s.type && !uploadedPreview && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(99,102,241,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <CheckCircle size={32} style={{ color: '#fff' }} />
                </div>
              )}
            </div>
            <div style={{ padding: '0.75rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{s.emoji} {s.label}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Click to analyze</div>
            </div>
          </div>
        ))}
      </div>

      {/* Processing State */}
      {isProcessing && (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Loader2 size={48} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
          <h3>AI Processing...</h3>
          <p>Analyzing image with neural network models</p>
          <div style={{ marginTop: '1rem', maxWidth: '300px', margin: '1rem auto 0' }}>
            <div className="confidence-bar">
              <div className="confidence-fill" style={{ width: '60%', animation: 'progress-pulse 1.5s ease-in-out infinite' }} />
            </div>
          </div>
        </div>
      )}

      {/* Detection Result */}
      {result && !isProcessing && (
        <div className="glass-card animate-scale-in">
          <div className="flex items-center gap-sm mb-md">
            <CheckCircle size={22} style={{ color: 'var(--color-resolved)' }} />
            <h3 style={{ fontSize: '1.1rem' }}>Detection Complete</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* Detection Image with Bounding Box */}
            <div className="detection-preview">
              <img src={resultImage} alt="Detection" />
              <div className="detection-overlay" style={{
                left: `${(result.detection.boundingBox[0] / 600) * 100}%`,
                top: `${(result.detection.boundingBox[1] / 400) * 100}%`,
                width: `${((result.detection.boundingBox[2] - result.detection.boundingBox[0]) / 600) * 100}%`,
                height: `${((result.detection.boundingBox[3] - result.detection.boundingBox[1]) / 400) * 100}%`,
              }}>
                <div className="detection-label">
                  {result.detection.label} ({(result.detection.confidence * 100).toFixed(0)}%)
                </div>
              </div>
            </div>

            {/* Analysis Details */}
            <div>
              <div className="form-group">
                <div className="form-label">Detection Label</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertTriangle size={18} style={{ color: 'var(--color-critical)' }} />
                  {result.detection.label}
                </div>
              </div>

              <div className="form-group">
                <div className="form-label">Confidence Score</div>
                <div className="flex items-center gap-sm">
                  <div className="confidence-bar" style={{ flex: 1 }}>
                    <div className="confidence-fill" style={{
                      width: `${result.detection.confidence * 100}%`,
                      background: confidenceColor(result.detection.confidence),
                    }} />
                  </div>
                  <span style={{ fontWeight: 800, fontFamily: 'var(--font-display)', color: confidenceColor(result.detection.confidence), fontSize: '1.1rem' }}>
                    {(result.detection.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              <div className="form-group">
                <div className="form-label">Severity</div>
                <span className={`badge badge-${result.accident.severity.toLowerCase()}`} style={{ fontSize: '0.85rem', padding: '0.3rem 0.75rem' }}>
                  {result.accident.severity}
                </span>
              </div>

              <div className="form-group">
                <div className="form-label">Auto-Generated Report</div>
                <p style={{ fontSize: '0.85rem' }}>{result.accident.description}</p>
              </div>

              <div className="form-group">
                <div className="form-label">Location</div>
                <p style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
                  {result.accident.locationName}
                  <br />
                  <span style={{ color: 'var(--text-muted)' }}>{result.accident.latitude}, {result.accident.longitude}</span>
                </p>
              </div>

              <div className="flex items-center gap-sm" style={{ marginTop: '0.5rem' }}>
                <span className="badge badge-detected">{result.accident.status}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Auto-added to dashboard</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes progress-pulse {
          0%, 100% { width: 30%; }
          50% { width: 80%; }
        }
        @media (max-width: 768px) {
          .detection-preview + div { grid-column: 1 !important; }
        }
      `}</style>
    </div>
  );
}
