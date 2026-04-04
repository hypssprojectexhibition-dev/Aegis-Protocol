import { useState, useRef } from 'react';
import { REDACT_API } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { Upload, EyeOff, Save, RefreshCw, X, Check } from 'lucide-react';

type RedactionStage = 'idle' | 'processing' | 'done' | 'error';

export default function Redact() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [redactedImage, setRedactedImage] = useState<string | null>(null);
  const [stage, setStage] = useState<RedactionStage>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [processingTime, setProcessingTime] = useState('');

  const [settings, setSettings] = useState({
    Faces: true,
    Objects: false,
    Names: true,
    Passwords: true,
    PhoneNumbers: true,
    Emails: true,
    Addresses: false,
    IPAddresses: true
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const pickFile = () => fileRef.current?.click();

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setRedactedImage(null);
    setStage('idle');
    setErrorMsg('');
  };

  const runRedaction = async () => {
    if (!file) return;
    setStage('processing');
    setErrorMsg('');

    try {
      const fd = new FormData();
      fd.append('image', file);
      fd.append('faces', settings.Faces.toString());
      fd.append('objects', settings.Objects.toString());
      fd.append('names', settings.Names.toString());
      fd.append('passwords', settings.Passwords.toString());
      fd.append('phone_numbers', settings.PhoneNumbers.toString());
      fd.append('emails', settings.Emails.toString());
      fd.append('addresses', settings.Addresses.toString());
      fd.append('ip_addresses', settings.IPAddresses.toString());

      const res = await fetch(`${REDACT_API}/api/redact`, {
        method: 'POST',
        body: fd
      });

      if (!res.ok) throw new Error(`Redaction engine returned ${res.status}`);
      
      const data = await res.json();
      if (data.status === 'success') {
        setRedactedImage(data.redacted_image);
        setProcessingTime(data.time);
        setStage('done');

        // Log to Supabase
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user && userData.user.id !== 'dev-user') {
          await supabase.from('operations').insert({
            user_id: userData.user.id,
            operation_type: 'redact',
            status: 'success',
            created_at: new Date().toISOString(),
          });
        }
      } else {
        throw new Error(data.message || 'Redaction failed');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Connection failed');
      setStage('error');
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setRedactedImage(null);
    setStage('idle');
    setErrorMsg('');
  };

  const downloadRedacted = () => {
    if (!redactedImage) return;
    const link = document.createElement('a');
    link.href = redactedImage;
    link.download = `redacted_${file?.name || 'image.png'}`;
    link.click();
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Redact Information</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          Automatically detect and mask sensitive information in your images using AI.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 32, alignItems: 'start' }}>
        {/* Settings Sidebar */}
        <div className="panel" style={{ padding: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 20, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Redaction Rules
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginTop: 8 }}>Visual Detections</div>
            {(['Faces', 'Objects'] as const).map(key => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{key}</span>
                <input 
                  type="checkbox" 
                  checked={settings[key]} 
                  onChange={() => toggleSetting(key)}
                  style={{ width: 16, height: 16, accentColor: 'var(--accent-blue)' }}
                />
              </label>
            ))}

            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginTop: 16 }}>Textual Detections</div>
            {(['Names', 'Passwords', 'PhoneNumbers', 'Emails', 'Addresses', 'IPAddresses'] as const).map(key => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                <input 
                  type="checkbox" 
                  checked={settings[key]} 
                  onChange={() => toggleSetting(key)}
                  style={{ width: 16, height: 16, accentColor: 'var(--accent-blue)' }}
                />
              </label>
            ))}
          </div>

          <div style={{ marginTop: 32 }}>
            <button 
              className="btn-primary" 
              onClick={runRedaction}
              disabled={!file || stage === 'processing'}
              style={{ width: '100%' }}
            >
              {stage === 'processing' ? <RefreshCw size={16} className="spin" /> : <EyeOff size={16} />}
              Apply Redaction
            </button>
            {file && (
              <button 
                onClick={reset} 
                className="btn-outline" 
                style={{ width: '100%', marginTop: 12, fontSize: 13 }}
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {errorMsg && (
            <div style={{ padding: '12px 16px', borderRadius: 8, background: 'var(--error-bg)', border: '1px solid var(--error)', fontSize: 13, color: 'var(--error)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <X size={16} />
              {errorMsg}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Input Side */}
            <div className="panel" style={{ padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 16, textTransform: 'uppercase' }}>Input Image</div>
              
              <input ref={fileRef} type="file" accept="image/*" onChange={onFileSelected} style={{ display: 'none' }} />
              
              {!preview ? (
                <div onClick={pickFile} style={{
                  border: '2px dashed var(--border)', borderRadius: 12, padding: '60px 20px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer',
                  transition: 'all 0.2s', background: 'var(--bg-secondary)'
                }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent-blue)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  <Upload size={32} style={{ marginBottom: 12, color: 'var(--text-muted)' }} />
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>Select image to redact</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>JPEG, PNG supported</div>
                </div>
              ) : (
                <div className="panel-inset" style={{ position: 'relative', overflow: 'hidden', height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={preview} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  <button onClick={pickFile} style={{
                    position: 'absolute', bottom: 12, right: 12, background: 'rgba(0,0,0,0.6)',
                    border: 'none', borderRadius: 6, color: 'white', fontSize: 12,
                    padding: '6px 12px', cursor: 'pointer', backdropFilter: 'blur(4px)'
                  }}>Change Image</button>
                </div>
              )}
            </div>

            {/* Output Side */}
            <div className="panel" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Redacted Result</div>
                {stage === 'done' && (
                  <div style={{ fontSize: 11, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Check size={12} /> Processed in {processingTime}
                  </div>
                )}
              </div>

              {!redactedImage ? (
                <div className="panel-inset" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400, color: 'var(--text-muted)' }}>
                  <EyeOff size={32} style={{ opacity: 0.2, marginBottom: 12 }} />
                  <div style={{ fontSize: 13 }}>Redacted result will appear here</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="panel-inset" style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={redactedImage} alt="Redacted" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  </div>
                  <button onClick={downloadRedacted} className="btn-primary">
                    <Save size={16} />
                    Download Redacted Image
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
