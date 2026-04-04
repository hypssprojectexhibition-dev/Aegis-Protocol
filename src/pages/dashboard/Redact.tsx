import { useState } from 'react';
import { REDACT_API } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { 
  Upload, 
  Download, 
  RefreshCw, 
  AlertCircle,
  HelpCircle,
  ShieldX,
  CheckCircle,
  Settings2,
  Maximize2
} from 'lucide-react';

export default function Redact() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Settings
  const [settings, setSettings] = useState({
    faces: true,
    objects: false,
    names: true,
    passwords: true,
    phone_numbers: true,
    emails: true,
    addresses: false,
    ip_addresses: true
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
      setResult(null);
      setError(null);
    }
  };

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleRedact = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    const fd = new FormData();
    fd.append('image', file);
    Object.entries(settings).forEach(([k, v]) => fd.append(k, String(v)));

    try {
      const res = await fetch(`${REDACT_API}/api/redact`, {
        method: 'POST',
        body: fd
      });

      if (!res.ok) throw new Error('Redaction engine failure. Check API logs.');
      
      const data = await res.json();
      setResult(data.redacted_image);

      // Log
      try {
        const { data: userData } = await supabase.auth.getUser();
        await supabase.from('operations').insert([{
          user_id: userData.user?.id || 'dev-user',
          operation_type: 'redact',
          status: 'success'
        }]);
      } catch {}

    } catch (err: any) {
      setError(err.message || 'Failed to process redaction');
    } finally {
      setLoading(false);
    }
  };

  const Option = ({ id, label, icon: Icon }: { id: keyof typeof settings, label: string, icon: any }) => (
    <label style={{ 
      display: 'flex', alignItems: 'center', gap: 16, padding: '20px 24px', borderRadius: 16, 
      background: settings[id] ? 'var(--bg-card)' : 'var(--bg-secondary)', 
      border: `1.5px solid ${settings[id] ? 'var(--accent-blue)' : 'var(--border)'}`,
      cursor: 'pointer', transition: 'all 0.2s', boxShadow: settings[id] ? '0 8px 16px -4px rgba(59, 130, 246, 0.2)' : 'none'
    }}>
      <div style={{ color: settings[id] ? 'var(--accent-blue)' : 'var(--text-muted)' }}>
        <Icon size={24} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: settings[id] ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{settings[id] ? 'ACTIVE' : 'INACTIVE'}</div>
      </div>
      <div style={{ 
        width: 24, height: 24, borderRadius: 6, border: '2px solid var(--border)', 
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: settings[id] ? 'var(--accent-blue)' : 'transparent',
        borderColor: settings[id] ? 'var(--accent-blue)' : 'var(--border)'
      }}>
        {settings[id] && <CheckCircle size={16} color="white" />}
      </div>
      <input type="checkbox" checked={settings[id]} onChange={() => handleToggle(id)} style={{ display: 'none' }} />
    </label>
  );

  return (
    <div className="fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 32 }}>
      
      {/* Contextual Header */}
      <div className="info-badge" style={{ background: 'rgba(239, 64, 64, 0.05)', borderColor: 'rgba(239, 64, 64, 0.2)' }}>
        <HelpCircle size={24} style={{ color: 'var(--error)', marginTop: 2 }} />
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 16, marginBottom: 4 }}>Privacy first redaction</div>
          <p style={{ opacity: 0.8 }}>
            Aegis Redact uses **BERT** and **TFLite/YOLO** models to scan your material for PII (Personally Identifiable Information). 
            Select filters below to digitally purge sensitive data before distribution. All redactions are applied locally in your secure vault.
          </p>
        </div>
      </div>

      {error && (
        <div style={{ padding: '20px 24px', borderRadius: 12, background: 'var(--error-bg)', border: '1px solid var(--error)', fontSize: 14, color: 'var(--error)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <AlertCircle size={20} />
          <div style={{ fontWeight: 600 }}>{error}</div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '480px 1fr', gap: 40, flex: 1, minHeight: 0 }}>
        
        {/* Settings & Input Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          
          <div className="panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div className="step-number" style={{ background: 'var(--error)' }}>1</div>
              <h2 style={{ fontSize: 18, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Detection Hub</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, flex: 1, overflowY: 'auto', paddingRight: 8 }}>
              <Option id="faces" label="Identity Faces" icon={Settings2} />
              <Option id="names" label="Legal Names" icon={Settings2} />
              <Option id="passwords" label="Auth Strings" icon={Settings2} />
              <Option id="emails" label="Email Paths" icon={Settings2} />
              <Option id="phone_numbers" label="Contact IDs" icon={Settings2} />
              <Option id="ip_addresses" label="System IPs" icon={Settings2} />
              <Option id="objects" label="Classified Obj" icon={Settings2} />
              <Option id="addresses" label="Geolocations" icon={Settings2} />
            </div>

            <button 
              className="btn-primary" 
              onClick={handleRedact} 
              disabled={!file || loading}
              style={{ width: '100%', height: 64, marginTop: 32, background: 'var(--error)' }}
            >
              {loading ? <RefreshCw className="spin" size={24} /> : <ShieldX size={24} />}
              <span style={{ fontSize: 18 }}>{loading ? 'Purging PII...' : 'Initiate Redaction'}</span>
            </button>
          </div>

          <div style={{ padding: '24px', borderRadius: 20, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
             <h3 style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 16, textTransform: 'uppercase' }}>Source Input</h3>
             <label style={{ height: 160, border: '2px dashed var(--border)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'pointer', background: 'var(--bg-card)' }}>
                {preview ? (
                  <img src={preview} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <Upload size={32} style={{ opacity: 0.3 }} />
                )}
                <input type="file" onChange={handleFileChange} style={{ display: 'none' }} />
             </label>
          </div>
        </div>

        {/* Massive Result Display */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div className="step-number" style={{ background: 'var(--error)' }}>2</div>
            <h2 style={{ fontSize: 18, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sanitized Master</h2>
          </div>

          <div className="panel-inset" style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {result ? (
              <div className="fade-in" style={{ width: '100%', height: '100%', padding: 40, display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, padding: 24, border: '1px solid var(--border)', background: 'var(--bg-card)', borderRadius: 20, position: 'relative' }}>
                   <div style={{ position: 'absolute', top: 12, right: 12, background: 'var(--error-bg)', color: 'var(--error)', padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 800 }}>REDACTED</div>
                   <img src={result} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                
                <button 
                  onClick={() => {
                    const l = document.createElement('a'); l.href = result; l.download = 'redacted_master.png'; l.click();
                  }}
                  className="btn-primary" 
                  style={{ width: '100%', height: 60, marginTop: 32, background: 'var(--text-primary)' }}
                >
                  <Download size={20} /> Download Sanitized Material
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', opacity: 0.2 }}>
                <Maximize2 size={120} strokeWidth={1} style={{ marginBottom: 24 }} />
                <div style={{ fontSize: 24, fontWeight: 800 }}>Awaiting Sanitization</div>
                <div style={{ fontSize: 16, marginTop: 12 }}>Select source material and parameters to begin</div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
