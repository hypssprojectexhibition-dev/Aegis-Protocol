import { useState } from 'react';
import { CRYPTO_API } from '../../lib/api';
import { Upload, Scissors, Download, RefreshCw, AlertCircle, Info } from 'lucide-react';

export default function Split() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shares, setShares] = useState<string[]>([]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setPreview(URL.createObjectURL(f)); setShares([]); setError(''); }
  };

  const split = async () => {
    if (!file) return;
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('image1', file);
      fd.append('operation', 'encryption');
      fd.append('algorithm', 'vc_grayscale_halftone');
      const res = await fetch(`${CRYPTO_API}/process`, { method: 'POST', body: fd });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || `Server returned ${res.status}`); }
      const data = await res.json();
      if (data.status !== 'success') throw new Error(data.message || 'Splitting failed');
      setShares(data.shares);
    } catch (e: any) {
      setError(e.message || 'Splitting failed');
    } finally { setLoading(false); }
  };

  const dl = (src: string, name: string) => { const a = document.createElement('a'); a.href = src; a.download = name; a.click(); };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="info-badge">
        <Info size={18} style={{ color: 'var(--accent-blue)', flexShrink: 0, marginTop: 2 }} />
        <div>
          <strong>Visual Cryptography — Split</strong> — Splits a single image into 2 cryptographic noise shares using a (2,2) visual cryptography scheme.
          Each share looks like random noise on its own. The original image can only be seen when both shares are stacked together.
          Store each share in a separate location for maximum security.
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: 8, background: 'var(--error-bg)', border: '1px solid var(--error)', fontSize: 13, color: 'var(--error)', display: 'flex', gap: 10, alignItems: 'center' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Input */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="step-number">1</div>
            <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Source Image</span>
          </div>

          <label className="upload-zone" style={{ flex: 1, minHeight: 300 }}>
            {preview
              ? <img src={preview} alt="" className="result-img" style={{ position: 'absolute', inset: 0 }} />
              : <><Upload size={36} style={{ opacity: 0.3, marginBottom: 8 }} /><span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Click to select image to split</span></>
            }
            <input type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
          </label>

          <button className="btn-primary" onClick={split} disabled={!file || loading} style={{ width: '100%', height: 48 }}>
            {loading ? <RefreshCw size={18} className="spin" /> : <Scissors size={18} />}
            {loading ? 'Splitting...' : 'Split into Shares'}
          </button>
        </div>

        {/* Output */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="step-number">2</div>
            <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Generated Shares</span>
          </div>

          {shares.length > 0 ? (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
              {shares.map((s, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Share {String.fromCharCode(65 + i)}</div>
                  <div className="panel-inset" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 140 }}>
                    <img src={s} alt="" className="result-img" />
                  </div>
                  <button className="btn-outline" onClick={() => dl(s, `share_${String.fromCharCode(65 + i).toLowerCase()}.png`)} style={{ width: '100%' }}>
                    <Download size={14} /> Download Share {String.fromCharCode(65 + i)}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="panel-inset" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
              <div style={{ textAlign: 'center', opacity: 0.2 }}>
                <Scissors size={48} />
                <div style={{ marginTop: 8, fontSize: 13, fontWeight: 600 }}>Shares will appear here</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
