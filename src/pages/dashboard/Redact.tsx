import { useState } from 'react';
import { getRedactApi } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import {
  CloudUploadRounded as Upload,
  DownloadRounded as Download,
  DocumentScannerRounded as Scan,
  CheckCircleRounded as CheckCircle2, 
  ErrorRounded as AlertCircle 
} from '@mui/icons-material';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';

export default function RedactPage() {
  const isMobile = window.innerWidth <= 768;

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState('');

  const [settings, setSettings] = useState({
    faces: true,
    passwords: false,
    phone_numbers: false,
    emails: false
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
      // Fill the rest with false so the backend API doesn't complain
      const payload = {
        faces: settings.faces, objects: false, names: false, passwords: settings.passwords,
        phone_numbers: settings.phone_numbers, emails: settings.emails, addresses: false, ip_addresses: false,
      };
      Object.entries(payload).forEach(([k, v]) => fd.append(k, String(v)));

      const res = await fetch(`${getRedactApi()}/api/redact`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Redaction engine failed');
      const data = await res.json();
      setResult(data.redacted_image);

      try {
        const { data: u } = await supabase.auth.getUser();
        await supabase.from('operations').insert([{ user_id: u.user?.id || 'dev', operation_type: 'redact', status: 'success' }]);
      } catch { }
    } catch (e: any) {
      setError(e.message || 'Redaction failed');
    } finally { setLoading(false); }
  };

  const dl = async () => {
    if (!result) return;
    try {
      const path = await save({
        filters: [{ name: 'Image', extensions: ['png'] }],
        defaultPath: 'aegis_redacted.png'
      });
      if (path) {
        const base64Data = result.split(',')[1];
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        await writeFile(path, bytes);
      }
    } catch (err) {
      console.error("Native save failed", err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', height: '100%', width: '100%', overflow: isMobile ? 'auto' : 'hidden' }}>

      {/* LEFT SIDEBAR: Targets */}
      <aside style={{ width: isMobile ? '100%' : 320, background: 'var(--bg-card)', borderRight: isMobile ? 'none' : '1px solid var(--border)', borderBottom: isMobile ? '1px solid var(--border)' : 'none', padding: 24, display: 'flex', flexDirection: 'column', gap: 32, flexShrink: 0 }}>

        {/* Engine Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h2 className="text-label" style={{ color: 'rgba(225, 231, 226, 0.5)' }}>Processing Engine</h2>
          <div style={{ background: 'var(--bg-card-high)', borderLeft: '2px solid var(--accent-primary)', padding: 16, borderRadius: 0 }}>
            <p className="text-label" style={{ color: 'var(--accent-primary)', marginBottom: 4 }}>Status</p>
            <p style={{ fontSize: 14, fontWeight: 700 }}>{loading ? 'Analyzing Source...' : (file ? 'Ready' : 'Awaiting Input')}</p>
          </div>
          <div style={{ background: 'var(--bg-card-highest)', padding: 16, borderRadius: 0 }}>
            <p className="text-label" style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Sensitivity</p>
            <p style={{ fontSize: 14, fontWeight: 700 }}>ECC-8 Standard</p>
          </div>
        </div>

        {/* Targets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h2 className="text-label" style={{ color: 'rgba(225, 231, 226, 0.5)', marginBottom: 8 }}>Redaction Targets</h2>

          {(Object.keys(settings) as Array<keyof typeof settings>).map(key => (
            <div key={key} onClick={() => toggle(key)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px',
              borderRadius: 0, cursor: 'pointer', background: settings[key] ? 'var(--bg-card-highest)' : 'transparent',
              transition: 'background 0.1s'
            }}>
              <span style={{ fontSize: 12, color: settings[key] ? 'var(--accent-primary)' : 'var(--text-muted)', textTransform: 'capitalize' }}>
                {key.replace('_', ' ')}
              </span>
              <div style={{
                width: 32, height: 16, borderRadius: 0, position: 'relative',
                background: settings[key] ? 'var(--accent-primary)' : 'var(--bg-card-highest)'
              }}>
                <div style={{
                  position: 'absolute', top: 2, left: settings[key] ? 18 : 2, width: 12, height: 12,
                  borderRadius: 0, background: settings[key] ? 'var(--bg-primary)' : 'var(--text-muted)',
                  transition: 'left 0.15s'
                }} />
              </div>
            </div>
          ))}
        </div>

      </aside>

      {/* CENTER STAGE: Canvas */}
      <section style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? 16 : 48, minHeight: isMobile ? 350 : 'auto' }}>

        {/* Glow bg */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, rgba(113, 217, 180, 0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {error && (
          <div style={{ position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)', background: 'var(--error-bg)', color: 'var(--error)', padding: '12px 24px', borderRadius: 0, display: 'flex', alignItems: 'center', gap: 12, zIndex: 50, border: '1px solid var(--error)' }}>
            <AlertCircle sx={{ fontSize: 18 }} /> {error}
          </div>
        )}

        <label style={{
          width: '100%', maxWidth: 800, aspectRatio: '4/3', position: 'relative', cursor: 'pointer',
          background: 'var(--bg-card)', border: '1px dashed rgba(113, 217, 180, 0.3)', borderRadius: 'var(--radius-lg)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
        }}>

          <input type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />

          {/* BG Image context */}
          {!file && (
            <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuC57NxSTZ1aQCCjTQbZlv2UUSe_BU9uCIs3yyAC66GFslCJ2gxGTii_zRpHzTgeM0-_ueTOAPntcxJ7nIUW3tACMUD-pAZixjJS4dMb3-zqF77rQaqXcWAZVbXFrmjhm5jYikTUJC4An8qz9t3-capx2m_DMtNJTSskKQmCeMDDXLTXicn4wkXZKUSRZQwqsYtj45vZPmW99Cj5yJie8WagrKLNp_qLPpF9T4gEboLwOXwMcRFzUmzbIk2_Ek5SWIhkKkxgYOA5Tg"
              alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.2, filter: 'grayscale(1) contrast(1.2)' }} />
          )}

          {preview && !result && (
            <img src={preview} alt="input" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
          )}

          {result && (
            <img src={result} alt="redacted" className="fade-in" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
          )}

          {!file && (
            <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: 24 }}>
              <div style={{ width: 64, height: 64, background: 'var(--bg-card-high)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Upload sx={{ fontSize: 28, color: 'var(--accent-primary)' }} />
              </div>
              <h3 className="font-headline" style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Upload Target for Sanitization</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 280 }}>Supported formats: JPEG, PNG, WEBP. Maximum file size 50MB.</p>
            </div>
          )}

          {loading && <div className="scanner-line" />}

          {/* Corners */}
          <div style={{ position: 'absolute', top: -1, left: -1, width: 16, height: 16, borderTop: '2px solid var(--accent-primary)', borderLeft: '2px solid var(--accent-primary)' }} />
          <div style={{ position: 'absolute', top: -1, right: -1, width: 16, height: 16, borderTop: '2px solid var(--accent-primary)', borderRight: '2px solid var(--accent-primary)' }} />
          <div style={{ position: 'absolute', bottom: -1, left: -1, width: 16, height: 16, borderBottom: '2px solid var(--accent-primary)', borderLeft: '2px solid var(--accent-primary)' }} />
          <div style={{ position: 'absolute', bottom: -1, right: -1, width: 16, height: 16, borderBottom: '2px solid var(--accent-primary)', borderRight: '2px solid var(--accent-primary)' }} />
        </label>

      </section>

      {/* RIGHT SIDEBAR: Actions */}
      <aside style={{ width: isMobile ? '100%' : 320, background: 'var(--bg-card)', borderLeft: isMobile ? 'none' : '1px solid var(--border)', borderTop: isMobile ? '1px solid var(--border)' : 'none', padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flexShrink: 0 }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <button className="btn-primary" onClick={redact} disabled={!file || loading} style={{ width: '100%', padding: '20px 0' }}>
            <Scan sx={{ fontSize: 18, marginRight: 1 }} />
            Scan & Auto-Redact
          </button>

          <button className="btn-outline" onClick={dl} disabled={!result} style={{ width: '100%', padding: '20px 0', border: '1px solid var(--border)', color: result ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
            <Download sx={{ fontSize: 18, marginRight: 1 }} />
            Save Locally
          </button>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 24, marginTop: 24, flex: 1 }}>
          <h2 className="text-label" style={{ color: 'var(--text-muted)', marginBottom: 16 }}>Sanitization Ledger</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {result && (
              <div className="fade-in" style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <CheckCircle2 sx={{ fontSize: 14, color: 'var(--accent-primary)', marginTop: 0.25 }} />
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700 }}>Operation Successful</p>
                  <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>{file?.name}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ background: 'var(--bg-card-highest)', padding: 16, border: '1px solid var(--border)', marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span className="text-label">Confidence Level</span>
            <span className="text-label" style={{ color: 'var(--accent-primary)' }}>100%</span>
          </div>
          <div style={{ width: '100%', height: 4, background: 'var(--bg-card-high)', borderRadius: 0, overflow: 'hidden' }}>
            <div style={{ width: '100%', height: '100%', background: 'var(--accent-primary)' }} />
          </div>
        </div>

      </aside>

    </div>
  );
}
