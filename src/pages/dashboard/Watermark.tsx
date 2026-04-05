import { useState } from 'react';
import { getStegaApi } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import {
  Upload,
  ShieldCheck,
  Download,
  RefreshCw,
  AlertCircle,
  Info,
  ScanSearch,
  CheckCircle2,
  XCircle,
  Clock,
  Fingerprint,
} from 'lucide-react';

type WatermarkTab = 'embed' | 'decode';

// ─── Embed Sub-Page ───────────────────────────────────────────────────────────
function EmbedTab() {
  const isMobile = window.innerWidth <= 768;
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [secret, setSecret] = useState('AEGIS');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stegoB64, setStegoB64] = useState<string | null>(null);
  const [residual, setResidual] = useState<string | null>(null);
  const [intensity, setIntensity] = useState<'quality' | 'balanced' | 'rough'>('balanced');

  const INTENSITY_MAP = {
    quality: 0.45,
    balanced: 0.65,
    rough: 1.0,
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setPreview(URL.createObjectURL(f)); setStegoB64(null); setResidual(null); setError(''); }
  };

  const encode = async () => {
    if (!file) return;
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('image', file);
      fd.append('secret_text', secret.slice(0, 7));
      fd.append('alpha', INTENSITY_MAP[intensity].toString());
      const res = await fetch(`${getStegaApi()}/api/encode`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      setStegoB64(data.stego);
      setResidual(data.residual);
      try {
        const { data: u } = await supabase.auth.getUser();
        await supabase.from('operations').insert([{
          user_id: u.user?.id || 'dev',
          operation_type: 'watermark',
          watermark_code: secret,
          status: 'success'
        }]);
      } catch {}
    } catch (e: any) {
      setError(e.message || 'Encoding failed');
    } finally { setLoading(false); }
  };

  const dl = (src: string, name: string) => { const a = document.createElement('a'); a.href = src; a.download = name; a.click(); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="info-badge">
        <Info size={18} style={{ color: 'var(--accent-blue)', flexShrink: 0, marginTop: 2 }} />
        <div>
          <strong>StegaStamp Watermarking</strong> — Embeds an invisible, robust watermark into your image using a neural network.
          The watermark survives screenshots, compression, and cropping. You can later decode the image to prove its provenance.
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: 8, background: 'var(--error-bg)', border: '1px solid var(--error)', fontSize: 13, color: 'var(--error)', display: 'flex', gap: 10, alignItems: 'center' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 24 }}>
        {/* Input */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="step-number">1</div>
            <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Source & Settings</span>
          </div>

          <label className="upload-zone" style={{ flex: 1, minHeight: 260 }}>
            {preview
              ? <img src={preview} alt="" className="result-img" style={{ position: 'absolute', inset: 0 }} />
              : <><Upload size={36} style={{ opacity: 0.3, marginBottom: 8 }} /><span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Click to select image</span></>
            }
            <input type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
          </label>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Hidden message (max 7 chars)</label>
            <input className="input-field" value={secret} onChange={e => setSecret(e.target.value)} maxLength={7} placeholder="AEGIS" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Embed Intensity</label>
              <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--accent-blue)', opacity: 0.8 }}>ALPHA: {INTENSITY_MAP[intensity]}</span>
            </div>
            <div className="tab-switcher" style={{ width: '100%' }}>
              {(['quality', 'balanced', 'rough'] as const).map(lvl => (
                <button
                  key={lvl}
                  className={`tab-btn ${intensity === lvl ? 'active' : ''}`}
                  onClick={() => setIntensity(lvl)}
                  style={{ fontSize: 10, padding: '10px 4px' }}
                >
                  {lvl}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic', opacity: 0.7 }}>
              {intensity === 'quality' && '★ Higher invisibility, lower robustness'}
              {intensity === 'balanced' && '★ Optimal balance for standard distribution'}
              {intensity === 'rough' && '★ Maximum robustness, higher visual noise'}
            </div>
          </div>

          <button className="btn-primary" onClick={encode} disabled={!file || loading} style={{ width: '100%', height: 48 }}>
            {loading ? <RefreshCw size={18} className="spin" /> : <ShieldCheck size={18} />}
            {loading ? 'Encoding...' : 'Embed Watermark'}
          </button>
        </div>

        {/* Output */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="step-number">2</div>
            <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Protected Output</span>
          </div>

          <div className="panel-inset" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 260 }}>
            {stegoB64
              ? <img src={stegoB64} alt="" className="result-img" />
              : <div style={{ textAlign: 'center', opacity: 0.2 }}><ShieldCheck size={48} /><div style={{ marginTop: 8, fontSize: 13, fontWeight: 600 }}>Output will appear here</div></div>
            }
          </div>

          {residual && (
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>
              Residual (10× amplified):
              <div className="panel-inset" style={{ height: 80, marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={residual} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', opacity: 0.7 }} />
              </div>
            </div>
          )}

          {stegoB64 && (
            <button className="btn-primary" onClick={() => dl(stegoB64, 'watermarked.png')} style={{ width: '100%' }}>
              <Download size={16} /> Download Watermarked Image
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Decode Sub-Page ──────────────────────────────────────────────────────────
type DecodeStatus = 'idle' | 'loading' | 'success' | 'warning' | 'error';

function DecodeTab() {
  const isMobile = window.innerWidth <= 768;
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<DecodeStatus>('idle');
  const [result, setResult] = useState<{ secret: string; accuracy: string; time: string; status: string } | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setPreview(URL.createObjectURL(f)); setResult(null); setError(''); setStatus('idle'); }
  };

  const decode = async () => {
    if (!file) return;
    setLoading(true); setError(''); setResult(null); setStatus('idle');
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch(`${getStegaApi()}/api/decode`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      setResult(data);
      setStatus(data.status as DecodeStatus);
    } catch (e: any) {
      setError(e.message || 'Decoding failed. Ensure the Stega backend is running.');
      setStatus('error');
    } finally { setLoading(false); }
  };

  const statusConfig = {
    success: { icon: CheckCircle2, color: 'var(--success)', bg: 'var(--success-bg)', border: 'var(--success)', label: 'WATERMARK DECODED' },
    warning: { icon: AlertCircle,   color: 'var(--accent-gold)', bg: 'rgba(212,160,32,0.08)', border: 'var(--accent-gold)', label: 'PARTIAL DECODE' },
    error:   { icon: XCircle,       color: 'var(--error)',   bg: 'var(--error-bg)',   border: 'var(--error)',   label: 'NO WATERMARK FOUND' },
    idle:    { icon: ScanSearch,    color: 'var(--text-muted)', bg: 'transparent', border: 'transparent', label: '' },
    loading: { icon: RefreshCw,     color: 'var(--accent-blue)', bg: 'transparent', border: 'transparent', label: '' },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="info-badge">
        <ScanSearch size={18} style={{ color: 'var(--accent-blue)', flexShrink: 0, marginTop: 2 }} />
        <div>
          <strong>Watermark Decoder</strong> — Upload any image to extract an embedded StegaStamp watermark.
          The neural decoder will extract the hidden message, report accuracy, and confirm if the pulse is intact.
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: 8, background: 'var(--error-bg)', border: '1px solid var(--error)', fontSize: 13, color: 'var(--error)', display: 'flex', gap: 10, alignItems: 'center' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 24 }}>
        {/* Input */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="step-number">1</div>
            <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Upload Image</span>
          </div>

          <label className="upload-zone" style={{ flex: 1, minHeight: 280 }}>
            {preview
              ? <img src={preview} alt="" className="result-img" style={{ position: 'absolute', inset: 0 }} />
              : (
                <div style={{ textAlign: 'center', opacity: 0.35 }}>
                  <ScanSearch size={40} style={{ marginBottom: 10 }} />
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Click to select watermarked image</div>
                  <div style={{ fontSize: 11, marginTop: 4, opacity: 0.7 }}>PNG, JPG, WEBP accepted</div>
                </div>
              )
            }
            <input type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
          </label>

          <button
            className="btn-primary"
            onClick={decode}
            disabled={!file || loading}
            style={{ width: '100%', height: 48 }}
          >
            {loading ? <RefreshCw size={18} className="spin" /> : <Fingerprint size={18} />}
            {loading ? 'Extracting Pulse...' : 'Decode Watermark'}
          </button>
        </div>

        {/* Result */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="step-number">2</div>
            <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Extraction Result</span>
          </div>

          {/* Empty state */}
          {status === 'idle' && (
            <div className="panel-inset" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 280, gap: 12, opacity: 0.25 }}>
              <Fingerprint size={56} strokeWidth={1} />
              <div style={{ fontSize: 13, fontWeight: 700 }}>Results will appear here</div>
            </div>
          )}

          {/* Loading state */}
          {status === 'idle' && loading && (
            <div className="panel-inset" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 280, gap: 12 }}>
              <RefreshCw size={40} className="spin" style={{ color: 'var(--accent-blue)', opacity: 0.6 }} />
              <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.6 }}>Scanning neural residual...</div>
            </div>
          )}

          {/* Actual result */}
          {result && (
            <div
              className="fade-in panel-inset"
              style={{
                flex: 1,
                border: `1px solid ${statusConfig[status]?.border || 'var(--border)'}`,
                background: statusConfig[status]?.bg || 'transparent',
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
                minHeight: 280,
                justifyContent: 'center',
                padding: 24,
              }}
            >
              {/* Status Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {(() => {
                  const cfg = statusConfig[status] || statusConfig.error;
                  const Icon = cfg.icon;
                  return (
                    <>
                      <Icon size={28} style={{ color: cfg.color }} />
                      <div style={{ fontSize: 18, fontWeight: 800, color: cfg.color }}>{cfg.label}</div>
                    </>
                  );
                })()}
              </div>

              <div style={{ height: 1, background: 'var(--border)' }} />

              {/* Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)' }}>
                    Extracted Secret
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.05em' }}>
                    {result.secret}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)' }}>
                    Decoding Accuracy
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: statusConfig[status]?.color || 'var(--text-primary)' }}>
                    {result.accuracy}
                  </div>
                </div>
              </div>

              {/* Time row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: 0.6 }}>
                <Clock size={13} />
                <span style={{ fontSize: 12, fontFamily: 'monospace' }}>Inference time: {result.time}</span>
              </div>

              {/* BCH confidence bar */}
              {result.accuracy && result.accuracy !== '0.00%' && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    BCH Confidence
                  </div>
                  <div style={{ height: 6, background: 'var(--bg-card-highest)', borderRadius: 3, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: result.accuracy,
                        background: statusConfig[status]?.color || 'var(--accent-primary)',
                        transition: 'width 0.8s ease-out',
                        borderRadius: 3,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Export ───────────────────────────────────────────────────────────────
export default function Watermark() {
  const [activeTab, setActiveTab] = useState<WatermarkTab>('embed');

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Tab Switcher */}
      <div className="tab-switcher" style={{ maxWidth: 340 }}>
        <button
          className={`tab-btn ${activeTab === 'embed' ? 'active' : ''}`}
          onClick={() => setActiveTab('embed')}
        >
          <ShieldCheck size={13} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
          Embed Watermark
        </button>
        <button
          className={`tab-btn ${activeTab === 'decode' ? 'active' : ''}`}
          onClick={() => setActiveTab('decode')}
        >
          <ScanSearch size={13} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
          Decode Watermark
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'embed' ? <EmbedTab /> : <DecodeTab />}
    </div>
  );
}
