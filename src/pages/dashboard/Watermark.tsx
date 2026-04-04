import { useState } from 'react';
import { STEGA_API } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { Upload, ShieldCheck, Download, RefreshCw, AlertCircle, Info } from 'lucide-react';

export default function Watermark() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [secret, setSecret] = useState('AEGIS');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stegoB64, setStegoB64] = useState<string | null>(null);
  const [residual, setResidual] = useState<string | null>(null);

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
      fd.append('alpha', '1.0');
      const res = await fetch(`${STEGA_API}/api/encode`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      setStegoB64(data.stego);
      setResidual(data.residual);
      // Log
      try {
        const { data: u } = await supabase.auth.getUser();
        await supabase.from('operations').insert([{ user_id: u.user?.id || 'dev', operation_type: 'watermark', watermark_code: secret, status: 'success' }]);
      } catch {}
    } catch (e: any) {
      setError(e.message || 'Encoding failed');
    } finally { setLoading(false); }
  };

  const dl = (src: string, name: string) => { const a = document.createElement('a'); a.href = src; a.download = name; a.click(); };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
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
