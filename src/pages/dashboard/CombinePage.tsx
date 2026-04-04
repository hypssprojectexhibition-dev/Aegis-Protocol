import { useState } from 'react';
import { CRYPTO_API } from '../../lib/api';
import { Upload, Combine, Download, RefreshCw, AlertCircle, Info } from 'lucide-react';

export default function CombinePage() {
  const [shareA, setShareA] = useState<File | null>(null);
  const [shareB, setShareB] = useState<File | null>(null);
  const [previewA, setPreviewA] = useState<string | null>(null);
  const [previewB, setPreviewB] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<string | null>(null);

  const handleA = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setShareA(f); setPreviewA(URL.createObjectURL(f)); setResult(null); setError(''); }
  };
  const handleB = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setShareB(f); setPreviewB(URL.createObjectURL(f)); setResult(null); setError(''); }
  };

  const combine = async () => {
    if (!shareA || !shareB) return;
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('image1', shareA);
      fd.append('image2', shareB);
      fd.append('operation', 'decryption');
      fd.append('algorithm', 'vc_grayscale_halftone');
      const res = await fetch(`${CRYPTO_API}/process`, { method: 'POST', body: fd });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || `Server returned ${res.status}`); }
      const data = await res.json();
      if (data.status !== 'success') throw new Error(data.message || 'Reconstruction failed');
      setResult(data.reconstructed);
    } catch (e: any) {
      setError(e.message || 'Reconstruction failed');
    } finally { setLoading(false); }
  };

  const dl = (src: string, name: string) => { const a = document.createElement('a'); a.href = src; a.download = name; a.click(); };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="info-badge">
        <Info size={18} style={{ color: 'var(--accent-gold)', flexShrink: 0, marginTop: 2 }} />
        <div>
          <strong>Visual Cryptography — Combine</strong> — Upload both cryptographic shares (Share A + Share B) to reconstruct the original image.
          The shares are overlaid using a bitwise OR operation. If either share has been tampered with, the reconstruction will visibly fail.
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
            <div className="step-number" style={{ background: 'var(--accent-gold)' }}>1</div>
            <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Upload Both Shares</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, flex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>SHARE A</div>
              <label className="upload-zone" style={{ flex: 1, minHeight: 200 }}>
                {previewA
                  ? <img src={previewA} alt="" className="result-img" style={{ position: 'absolute', inset: 0 }} />
                  : <Upload size={28} style={{ opacity: 0.3 }} />
                }
                <input type="file" accept="image/*" onChange={handleA} style={{ display: 'none' }} />
              </label>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>SHARE B</div>
              <label className="upload-zone" style={{ flex: 1, minHeight: 200 }}>
                {previewB
                  ? <img src={previewB} alt="" className="result-img" style={{ position: 'absolute', inset: 0 }} />
                  : <Upload size={28} style={{ opacity: 0.3 }} />
                }
                <input type="file" accept="image/*" onChange={handleB} style={{ display: 'none' }} />
              </label>
            </div>
          </div>

          <button className="btn-primary" onClick={combine} disabled={!shareA || !shareB || loading}
            style={{ width: '100%', height: 48, background: 'var(--accent-gold)' }}>
            {loading ? <RefreshCw size={18} className="spin" /> : <Combine size={18} />}
            {loading ? 'Reconstructing...' : 'Combine Shares'}
          </button>
        </div>

        {/* Output */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="step-number" style={{ background: 'var(--accent-gold)' }}>2</div>
            <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Reconstructed Image</span>
          </div>

          <div className="panel-inset" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
            {result
              ? <img src={result} alt="" className="result-img fade-in" />
              : <div style={{ textAlign: 'center', opacity: 0.2 }}><Combine size={48} /><div style={{ marginTop: 8, fontSize: 13, fontWeight: 600 }}>Reconstructed image will appear here</div></div>
            }
          </div>

          {result && (
            <button className="btn-primary" onClick={() => dl(result, 'reconstructed.png')} style={{ width: '100%' }}>
              <Download size={16} /> Download Reconstructed Image
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
