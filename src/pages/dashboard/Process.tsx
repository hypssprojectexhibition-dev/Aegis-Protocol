import { useState, useRef } from 'react';
import { STEGA_API, CRYPTO_API } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { 
  Upload, 
  Shield, 
  Lock, 
  Layers, 
  Download, 
  RefreshCw, 
  X, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

type PipelineStage = 'idle' | 'uploading' | 'watermarking' | 'splitting' | 'done' | 'error';

export default function Process() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [stage, setStage] = useState<PipelineStage>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [watermarkCode, setWatermarkCode] = useState('');
  const [stegoB64, setStegoB64] = useState<string | null>(null);
  const [layerA, setLayerA] = useState<string | null>(null);
  const [layerB, setLayerB] = useState<string | null>(null);
  const [residual, setResidual] = useState<string | null>(null);

  const pickFile = () => fileRef.current?.click();

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setStage('idle');
    setStegoB64(null);
    setLayerA(null);
    setLayerB(null);
    setResidual(null);
    setErrorMsg('');
  };

  const runPipeline = async () => {
    if (!file) return;
    setErrorMsg('');

    try {
      // --- Stage 1: Watermark ---
      setStage('watermarking');
      const code = Math.random().toString(36).substring(2, 9).toUpperCase();
      setWatermarkCode(code);

      const fd = new FormData();
      fd.append('image', file);
      fd.append('secret_text', code);
      fd.append('alpha', '1.0');

      let stegaRes: Response;
      try {
        stegaRes = await fetch(`${STEGA_API}/api/encode`, { method: 'POST', body: fd });
      } catch (e) {
        throw new Error(`Cannot reach StegaStamp engine. Please ensure it is running.`);
      }

      if (!stegaRes.ok) throw new Error(`Watermarking engine returned ${stegaRes.status}`);
      const stegaData = await stegaRes.json();
      setStegoB64(stegaData.stego);
      if (stegaData.residual) setResidual(stegaData.residual);

      // --- Stage 2: Split ---
      setStage('splitting');

      const b64Resp = await fetch(stegaData.stego);
      const stegoBlob = await b64Resp.blob();
      const stegoFile = new File([stegoBlob], 'stego.png', { type: 'image/png' });

      const vcFd = new FormData();
      vcFd.append('operation', 'encryption');
      vcFd.append('algorithm', 'vc_grayscale_halftone');
      vcFd.append('image1', stegoFile);

      let splitRes: Response;
      try {
        splitRes = await fetch(`${CRYPTO_API}/process`, { method: 'POST', body: vcFd });
      } catch (e) {
        throw new Error(`Cannot reach VisualCrypto engine. Please ensure it is running.`);
      }

      if (!splitRes.ok) throw new Error(`Splitting engine returned ${splitRes.status}`);

      const ts = Date.now();
      setLayerA(`${CRYPTO_API}/static/output/share1.png?t=${ts}`);
      setLayerB(`${CRYPTO_API}/static/output/share2.png?t=${ts}`);

      // --- Stage 3: Log to Supabase ---
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user && userData.user.id !== 'dev-user') {
          await supabase.from('operations').insert({
            user_id: userData.user.id,
            watermark_code: code,
            operation_type: 'protect',
            status: 'success',
            created_at: new Date().toISOString(),
          });
        }
      } catch {
        // Non-critical
      }

      setStage('done');
    } catch (err: any) {
      setErrorMsg(err.message || 'Unknown error');
      setStage('error');
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setStage('idle');
    setStegoB64(null);
    setLayerA(null);
    setLayerB(null);
    setResidual(null);
    setErrorMsg('');
    setWatermarkCode('');
  };

  const downloadImage = (url: string, name: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
  };

  const stageLabels: Record<PipelineStage, string> = {
    idle: 'Ready to Process',
    uploading: 'Preparing Assets...',
    watermarking: 'Embedding Secure Watermark...',
    splitting: 'Generating Cryptographic Shares...',
    done: 'Protection Complete',
    error: 'Process Failed',
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Protect Image</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          Traceably secure your imagery by embedding hidden watermarks and splitting into encrypted shares.
        </p>
      </div>

      {/* Global Status Bar */}
      {stage !== 'idle' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px',
          marginBottom: 24, borderRadius: 12,
          background: stage === 'error' ? 'var(--error-bg)' : stage === 'done' ? 'var(--success-bg)' : 'var(--bg-secondary)',
          border: `1px solid ${stage === 'error' ? 'var(--error)' : stage === 'done' ? 'var(--success)' : 'var(--border)'}`,
        }}>
          {stage !== 'done' && stage !== 'error' ? (
            <RefreshCw size={18} className="spin" style={{ color: 'var(--accent-blue)' }} />
          ) : stage === 'done' ? (
            <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
          ) : (
            <AlertCircle size={18} style={{ color: 'var(--error)' }} />
          )}
          
          <span style={{ fontSize: 14, fontWeight: 600, color: stage === 'error' ? 'var(--error)' : stage === 'done' ? 'var(--success)' : 'var(--text-primary)' }}>
            {stageLabels[stage]}
          </span>

          {stage === 'done' && (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Watermark Code:</span>
              <code style={{ background: 'var(--bg-primary)', padding: '2px 8px', borderRadius: 4, color: 'var(--accent-blue)', fontWeight: 700, border: '1px solid var(--border)' }}>{watermarkCode}</code>
            </div>
          )}
        </div>
      )}

      {errorMsg && (
        <div style={{ padding: '12px 16px', marginBottom: 24, borderRadius: 12, background: 'var(--error-bg)', border: '1px solid var(--error)', fontSize: 13, color: 'var(--error)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <X size={16} />
          {errorMsg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
        {/* Left Column: Input & Watermark */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Input Panel */}
          <div className="panel" style={{ padding: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Source Image</div>
            
            <input ref={fileRef} type="file" accept="image/*" onChange={onFileSelected} style={{ display: 'none' }} />

            {!preview ? (
              <div onClick={pickFile} style={{
                border: '2px dashed var(--border)', borderRadius: 12, padding: '48px 20px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer',
                transition: 'all 0.2s', background: 'var(--bg-secondary)'
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent-blue)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                <Upload size={32} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>Click to upload image</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>High resolution PNG/JPG recommended</div>
              </div>
            ) : (
              <div className="panel-inset" style={{ position: 'relative', overflow: 'hidden', minHeight: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={preview} alt="" style={{ maxWidth: '100%', maxHeight: 400, objectFit: 'contain' }} />
                <button onClick={pickFile} style={{
                  position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.6)',
                  border: 'none', borderRadius: 6, color: 'white', fontSize: 12,
                  padding: '6px 12px', cursor: 'pointer', backdropFilter: 'blur(4px)'
                }}>Change</button>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button className="btn-primary" onClick={runPipeline}
                disabled={!file || (stage !== 'idle' && stage !== 'error' && stage !== 'done')}
                style={{ flex: 1 }}>
                {stage === 'done' ? <RefreshCw size={16} /> : <Shield size={16} />}
                {stage === 'done' ? 'Process New' : 'Apply Aegis Protection'}
              </button>
              {stage !== 'idle' && (
                <button onClick={reset} className="btn-outline">
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Watermarked Preview Panel */}
          {stegoB64 && (
            <div className="panel fade-in" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Watermarked Image</div>
                <button onClick={() => downloadImage(stegoB64, 'aegis_protected.png')} className="btn-outline" style={{ padding: '6px 10px', fontSize: 11, height: 'auto' }}>
                  <Download size={14} /> Download
                </button>
              </div>
              <div className="panel-inset" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', maxHeight: 300, overflow: 'hidden' }}>
                <img src={stegoB64} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              </div>
              
              {residual && (
                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>Visual Residual (10x Amplified)</div>
                  <div className="panel-inset" style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={residual} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', opacity: 0.7 }} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Cryptographic Shares */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="panel" style={{ padding: 24, minHeight: 400 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 24, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Secure Layered Shares</div>

            {!layerA ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 320, color: 'var(--text-muted)', opacity: 0.5 }}>
                <Lock size={48} style={{ marginBottom: 16, opacity: 0.2 }} />
                <div style={{ fontSize: 14, fontWeight: 500 }}>Encrypted output pending</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Complete protection to see shares</div>
              </div>
            ) : (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                      <Layers size={14} /> Secure Share A
                    </div>
                    <button onClick={() => downloadImage(layerA, 'aegis_share_a.png')} className="btn-outline" style={{ padding: '4px 8px', fontSize: 11, height: 'auto' }}>
                      <Download size={12} /> Save
                    </button>
                  </div>
                  <div className="panel-inset" style={{ padding: 8, display: 'flex', justifyContent: 'center', background: 'var(--bg-secondary)' }}>
                    <img src={layerA} alt="Share 1" style={{ maxWidth: '100%', borderRadius: 4 }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                      <Layers size={14} /> Secure Share B
                    </div>
                    <button onClick={() => downloadImage(layerB!, 'aegis_share_b.png')} className="btn-outline" style={{ padding: '4px 8px', fontSize: 11, height: 'auto' }}>
                      <Download size={12} /> Save
                    </button>
                  </div>
                  <div className="panel-inset" style={{ padding: 8, display: 'flex', justifyContent: 'center', background: 'var(--bg-secondary)' }}>
                    <img src={layerB!} alt="Share 2" style={{ maxWidth: '100%', borderRadius: 4 }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
