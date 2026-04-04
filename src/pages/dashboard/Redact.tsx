import { useState } from 'react';
import { REDACT_API } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { Upload, Download, RefreshCw, AlertCircle, Info, ShieldOff, Check } from 'lucide-react';

export default function Redact() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState('');

  const [settings, setSettings] = useState({
    faces: true, objects: false, names: true, passwords: true,
    phone_numbers: true, emails: true, addresses: false, ip_addresses: true,
  });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setPreview(URL.createObjectURL(f)); setResult(null); setError(''); }
  };

  const toggle = (key: keyof typeof settings) => setSettings(p => ({ ...p, [key]: !p[key] }));

  const redact = async () => {
    if (!file) return;
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('image', file);
      Object.entries(settings).forEach(([k, v]) => fd.append(k, String(v)));
      const res = await fetch(`${REDACT_API}/api/redact`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Redaction engine returned an error');
      const data = await res.json();
      setResult(data.redacted_image);
      try {
        const { data: u } = await supabase.auth.getUser();
        await supabase.from('operations').insert([{ user_id: u.user?.id || 'dev', operation_type: 'redact', status: 'success' }]);
      } catch {}
    } catch (e: any) {
      setError(e.message || 'Redaction failed');
    } finally { setLoading(false); }
  };

  const dl = (src: string, name: string) => { const a = document.createElement('a'); a.href = src; a.download = name; a.click(); };

  const OPTIONS: { key: keyof typeof settings; label: string }[] = [
    { key: 'faces', label: 'Faces' }, { key: 'objects', label: 'Objects' },
    { key: 'names', label: 'Names' }, { key: 'passwords', label: 'Passwords' },
    { key: 'phone_numbers', label: 'Phone Numbers' }, { key: 'emails', label: 'Emails' },
    { key: 'addresses', label: 'Addresses' }, { key: 'ip_addresses', label: 'IP Addresses' },
  ];

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="info-badge">
        <Info size={18} style={{ color: 'var(--error)', flexShrink: 0, marginTop: 2 }} />
        <div>
          <strong>RedactionPro</strong> — Uses MediaPipe face detection, YOLO object detection, Tesseract OCR, and spaCy NLP to find and mask sensitive information in images.
          Toggle the filters below to control what gets redacted. All processing happens locally on your machine.
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: 8, background: 'var(--error-bg)', border: '1px solid var(--error)', fontSize: 13, color: 'var(--error)', display: 'flex', gap: 10, alignItems: 'center' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 24 }}>
        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Detection Filters</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {OPTIONS.map(o => (
                <button key={o.key} onClick={() => toggle(o.key)} style={{
                  padding: '10px 14px', borderRadius: 8, border: `1px solid ${settings[o.key] ? 'var(--accent-blue)' : 'var(--border)'}`,
                  background: settings[o.key] ? 'rgba(59,130,246,0.08)' : 'var(--bg-secondary)',
                  color: settings[o.key] ? 'var(--accent-blue)' : 'var(--text-secondary)',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  {settings[o.key] && <Check size={14} />}
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Source</div>
            <label className="upload-zone" style={{ minHeight: 140 }}>
              {preview
                ? <img src={preview} alt="" className="result-img" style={{ position: 'absolute', inset: 0 }} />
                : <Upload size={28} style={{ opacity: 0.3 }} />
              }
              <input type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
            </label>
            <button className="btn-primary" onClick={redact} disabled={!file || loading} style={{ width: '100%', height: 44, background: 'var(--error)' }}>
              {loading ? <RefreshCw size={16} className="spin" /> : <ShieldOff size={16} />}
              {loading ? 'Processing...' : 'Run Redaction'}
            </button>
          </div>
        </div>

        {/* Result */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Redacted Output</div>
          <div className="panel-inset" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
            {result
              ? <img src={result} alt="" className="result-img fade-in" />
              : <div style={{ textAlign: 'center', opacity: 0.2 }}><ShieldOff size={48} /><div style={{ marginTop: 8, fontSize: 13, fontWeight: 600 }}>Redacted output will appear here</div></div>
            }
          </div>
          {result && (
            <button className="btn-primary" onClick={() => dl(result, 'redacted.png')} style={{ width: '100%' }}>
              <Download size={16} /> Download Redacted Image
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
