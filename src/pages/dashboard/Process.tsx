import { useState } from 'react';
import { getStegaApi, getCryptoApi } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { 
  Upload, 
  ShieldCheck, 
  Download, 
  Layers, 
  RefreshCw, 
  AlertCircle,
  HelpCircle,
  Info,
  ArrowRight
} from 'lucide-react';

export default function Process() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'watermarking' | 'crypting' | 'complete' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Results
  const [stegoB64, setStegoB64] = useState<string | null>(null);
  const [shares, setShares] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
      // Reset state
      setStegoB64(null);
      setShares([]);
      setStatus('idle');
    }
  };

  const processImage = async () => {
    if (!file) return;
    setLoading(true);
    setStatus('watermarking');
    setErrorMsg('');

    try {
      // Step 1: StegaStamp Watermarking
      const fd = new FormData();
      fd.append('image', file);
      fd.append('secret_text', 'AEGIS_X');
      fd.append('alpha', '1.0');

      let stegaRes: Response;
      try {
        stegaRes = await fetch(`${getStegaApi()}/api/encode`, { method: 'POST', body: fd });
      } catch {
        throw new Error(`Cannot reach StegaStamp Engine (8000). Please start the backend.`);
      }

      if (!stegaRes.ok) throw new Error(`Watermarking failed with status ${stegaRes.status}`);
      const stegaData = await stegaRes.json();
      setStegoB64(stegaData.stego);

      // Step 2: Visual Cryptography Splitting
      setStatus('crypting');
      const vcFd = new FormData();
      const stegoBlob = await fetch(stegaData.stego).then(r => r.blob());
      vcFd.append('image1', stegoBlob, 'stego.png');
      vcFd.append('operation', 'encryption');
      vcFd.append('algorithm', 'vc_grayscale_halftone');

      let vcRes: Response;
      try {
        vcRes = await fetch(`${getCryptoApi()}/process`, { method: 'POST', body: vcFd });
      } catch {
        throw new Error(`Cannot reach VisualCrypto Engine (5000). Please start the backend.`);
      }

      if (!vcRes.ok) throw new Error(`Cryptographic splitting failed.`);
      const vcData = await vcRes.json();
      setShares(vcData.shares);

      // Step 3: Log to Supabase
      try {
        const { data: userData } = await supabase.auth.getUser();
        await supabase.from('operations').insert([{
          user_id: userData.user?.id || 'dev-user',
          operation_type: 'protect',
          watermark_code: 'AEGIS_X',
          status: 'success'
        }]);
      } catch (err) {
        console.warn('Logging skipped:', err);
      }

      setStatus('complete');
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected processing error occurred.');
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = (b64: string, name: string) => {
    const link = document.createElement('a');
    link.href = b64;
    link.download = name;
    link.click();
  };

  return (
    <div className="fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Top Banner Context */}
      <div className="info-badge" style={{ background: 'rgba(59, 130, 246, 0.05)', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
        <HelpCircle size={24} style={{ color: 'var(--accent-blue)', marginTop: 2 }} />
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 16, marginBottom: 4 }}>Why protect your images?</div>
          <p style={{ opacity: 0.8 }}>
            Aegis Protect combines **invisible steganography** with **visual cryptography**. 
            First, your image is watermarked to ensure provenance. Then, it is split into two cryptographic "shares." 
            Neither share contains the full image, making it impossible for a single attacker to view your data.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div style={{ padding: '20px 24px', borderRadius: 12, background: 'var(--error-bg)', border: '1px solid var(--error)', fontSize: 14, color: 'var(--error)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <AlertCircle size={20} />
          <div style={{ fontWeight: 600 }}>Action Required: {errorMsg}</div>
        </div>
      )}

      {/* Main Expansive Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr 1fr', 
        gap: 40,
        flex: 1,
        minHeight: 0 // Allow container to shrink
      }}>
        
        {/* Step 1: Upload & Input */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div className="step-number">1</div>
            <h2 style={{ fontSize: 18, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Source Material</h2>
          </div>
          
          <label 
            style={{ 
              flex: 1, border: '2px dashed var(--border)', borderRadius: 16, 
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s', background: preview ? 'transparent' : 'var(--bg-secondary)',
              position: 'relative', overflow: 'hidden'
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent-blue)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            {preview ? (
              <img src={preview} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', zIndex: 1 }} />
            ) : (
              <div style={{ textAlign: 'center', opacity: 0.6 }}>
                <Upload size={48} style={{ marginBottom: 16, color: 'var(--text-muted)' }} />
                <div style={{ fontWeight: 600 }}>Click to primary source image</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Supports .jpg, .png, .webp (Max 10MB)</div>
              </div>
            )}
            <input type="file" onChange={handleFileChange} style={{ display: 'none' }} />
          </label>

          <div style={{ marginTop: 24, padding: '16px', borderRadius: 12, background: 'var(--bg-secondary)', fontSize: 13, border: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Info size={14} /> HOW IT WORKS
            </div>
            Select an image you want to secure. This original file will be processed through our dual-layer protection pipeline.
          </div>
        </div>

        {/* Step 2: Protection Engine (In-App Visualization) */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div className="step-number">2</div>
            <h2 style={{ fontSize: 18, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Protection Suite</h2>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ padding: '20px', borderRadius: 16, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12 }}>STEGASTAMP ENGINE</div>
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', borderRadius: 12, overflow: 'hidden' }}>
                {stegoB64 ? (
                  <img src={stegoB64} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <div style={{ textAlign: 'center', opacity: 0.3 }}>
                    {status === 'watermarking' ? <RefreshCw size={32} className="spin" /> : <ShieldCheck size={32} />}
                  </div>
                )}
              </div>
              <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-secondary)' }}>
                {status === 'watermarking' ? 'Embedding invisible provenance code...' : stegoB64 ? '✓ Watermark embedded successfully' : 'Ready to encode'}
              </div>
            </div>

            <div style={{ padding: '20px', borderRadius: 16, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12 }}>VISUAL CRYPTO ENGINE</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[0, 1].map(i => (
                  <div key={i} style={{ height: 100, background: 'var(--bg-secondary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {shares[i] ? (
                      <img src={shares[i]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                       <RefreshCw size={16} className={status === 'crypting' ? 'spin' : ''} style={{ opacity: 0.2 }} />
                    )}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-secondary)' }}>
                 {status === 'crypting' ? 'Generating cryptographic share layers...' : shares.length > 0 ? '✓ Shares generated successfully' : 'Ready to split'}
              </div>
            </div>
          </div>

          <button 
            className="btn-primary" 
            onClick={processImage} 
            disabled={!file || loading}
            style={{ width: '100%', marginTop: 24, padding: '18px' }}
          >
            {loading ? <RefreshCw className="spin" size={20} /> : <ShieldCheck size={20} />}
            {loading ? 'Executing Protection...' : 'Initialize Protection Core'}
          </button>
        </div>

        {/* Step 3: Secure Export */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div className="step-number">3</div>
            <h2 style={{ fontSize: 18, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Secure Export</h2>
          </div>

          <div className="panel-inset" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 24, gap: 24 }}>
            {status === 'complete' ? (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', background: 'var(--bg-card)', padding: 12 }}>
                   <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textAlign: 'center' }}>FINAL WATERMARKED MASTER</div>
                   <div style={{ height: 'calc(100% - 24px)' }}>
                     <img src={stegoB64!} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                   </div>
                </div>
                
                <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                   <button onClick={() => downloadImage(shares[0], 'share_a.png')} className="btn-outline" style={{ height: 52 }}>
                     <Download size={16} /> Share A
                   </button>
                   <button onClick={() => downloadImage(shares[1], 'share_b.png')} className="btn-outline" style={{ height: 52 }}>
                     <Download size={16} /> Share B
                   </button>
                </div>
                <button onClick={() => downloadImage(stegoB64!, 'protected_master.png')} className="btn-primary" style={{ width: '100%', marginTop: 12 }}>
                   <Download size={18} /> Download Master
                </button>
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>
                <Layers size={64} style={{ marginBottom: 24 }} />
                <div style={{ fontWeight: 700 }}>Awaiting Output</div>
              </div>
            )}
          </div>

          <div style={{ marginTop: 24, padding: '16px', borderRadius: 12, background: 'var(--success-bg)', fontSize: 13, border: '1px solid var(--success)' }}>
            <div style={{ fontWeight: 700, color: 'var(--success)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ArrowRight size={14} /> NEXT STEPS
            </div>
            Distribute the shares to different secure locations. The image cannot be reconstructed without both files.
          </div>
        </div>

      </div>
    </div>
  );
}
