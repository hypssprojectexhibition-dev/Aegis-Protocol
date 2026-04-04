import { useState } from 'react';
import { STEGA_API, CRYPTO_API } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { 
  CheckCircle2, 
  XCircle, 
  Search, 
  RefreshCw, 
  Upload,
  ShieldCheck,
  HelpCircle
} from 'lucide-react';

type VerifyState = 'idle' | 'processing' | 'verified' | 'tampered' | 'invalid' | 'error';

export default function Verify() {
  const [layerAFile, setLayerAFile] = useState<File | null>(null);
  const [layerBFile, setLayerBFile] = useState<File | null>(null);
  const [state, setState] = useState<VerifyState>('idle');
  const [result, setResult] = useState<any>(null);
  const [reconstructed, setReconstructed] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!layerAFile || !layerBFile) return;
    setState('processing');
    setResult(null);
    setReconstructed(null);

    try {
      // Step 1: Reconstruct via VisualCrypto
      const vcFd = new FormData();
      vcFd.append('operation', 'decryption');
      vcFd.append('algorithm', 'vc_grayscale_halftone');
      vcFd.append('image1', layerAFile);
      vcFd.append('image2', layerBFile);

      let decRes: Response;
      try {
        decRes = await fetch(`${CRYPTO_API}/process`, { method: 'POST', body: vcFd });
      } catch {
        throw new Error(`Cannot reach VisualCrypto API (5000). Ensure the backend is running.`);
      }
      if (!decRes.ok) throw new Error('Reconstruction failed. Please check your shares.');

      const vcData = await decRes.json();
      const recUrl = vcData.reconstructed;
      setReconstructed(recUrl);

      // Brief delay for visual effect
      await new Promise(r => setTimeout(r, 800));

      // Step 2: Decode watermark
      const recBlob = await fetch(recUrl).then(r => r.blob());
      const recFile = new File([recBlob], 'reconstructed.png', { type: 'image/png' });

      const decodeFd = new FormData();
      decodeFd.append('image', recFile);

      let stegaRes: Response;
      try {
        stegaRes = await fetch(`${STEGA_API}/api/decode`, { method: 'POST', body: decodeFd });
      } catch {
        throw new Error(`Cannot reach StegaStamp API (8000). Ensure the backend is running.`);
      }
      if (!stegaRes.ok) throw new Error('Watermark extraction failed.');

      const decoded = await stegaRes.json();
      setResult(decoded);

      if (decoded.status !== 'success') {
        setState('invalid');
        return;
      }

      // Step 3: Check DB
      const { data } = await supabase
        .from('operations')
        .select('*')
        .eq('watermark_code', decoded.secret.trim().toUpperCase())
        .limit(1);

      if (data && data.length > 0) {
        setResult({ ...decoded, dbRecord: data[0] });
        setState('verified');
      } else {
        setState('tampered');
      }
    } catch (err: any) {
      setState('error');
    }
  };

  return (
    <div className="fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Dynamic Header */}
      <div className="info-badge" style={{ background: 'rgba(212, 160, 32, 0.05)', borderColor: 'rgba(212, 160, 32, 0.2)' }}>
        <HelpCircle size={24} style={{ color: 'var(--accent-gold)', marginTop: 2 }} />
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 16, marginBottom: 4 }}>How verification works</div>
          <p style={{ opacity: 0.8 }}>
            Upload both cryptographic shares (Share A and Share B). Aegis will **digitally stack** them to reconstruct the original master. 
            Once reconstructed, the system attempts to extract the **embedded steganographic pulse** and compares it against our secure audit logs.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, flex: 1, minHeight: 0 }}>
        
        {/* Input Panel (Full Height) */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div className="step-number" style={{ background: 'var(--accent-gold)' }}>1</div>
            <h2 style={{ fontSize: 18, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Authentication Inputs</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, flex: 1, minHeight: 0 }}>
            {/* Share A */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
               <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase' }}>SHARE A</div>
               <label style={{ flex: 1, border: '2px dashed var(--border)', borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', background: layerAFile ? 'transparent' : 'var(--bg-secondary)', cursor: 'pointer' }}>
                  {layerAFile ? (
                    <img src={URL.createObjectURL(layerAFile)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ textAlign: 'center', opacity: 0.5 }}><Upload size={32} /></div>
                  )}
                  <input type="file" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && setLayerAFile(e.target.files[0])} />
               </label>
            </div>
            {/* Share B */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
               <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase' }}>SHARE B</div>
               <label style={{ flex: 1, border: '2px dashed var(--border)', borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', background: layerBFile ? 'transparent' : 'var(--bg-secondary)', cursor: 'pointer' }}>
                  {layerBFile ? (
                    <img src={URL.createObjectURL(layerBFile)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ textAlign: 'center', opacity: 0.5 }}><Upload size={32} /></div>
                  )}
                  <input type="file" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && setLayerBFile(e.target.files[0])} />
               </label>
            </div>
          </div>

          <button className="btn-primary" onClick={handleVerify} disabled={!layerAFile || !layerBFile || state === 'processing'} style={{ width: '100%', height: 64, marginTop: 32, background: 'var(--accent-gold)' }}>
             {state === 'processing' ? <RefreshCw size={24} className="spin" /> : <ShieldCheck size={24} />}
             <span style={{ fontSize: 18 }}>{state === 'processing' ? 'Authenticating Pulse...' : 'Verify Cryptographic Integrity'}</span>
          </button>
        </div>

        {/* Results Panel */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div className="step-number" style={{ background: 'var(--accent-gold)' }}>2</div>
            <h2 style={{ fontSize: 18, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Analysis & Extraction</h2>
          </div>

          <div className="panel-inset" style={{ flex: 1, padding: 32, display: 'flex', flexDirection: 'column', gap: 32 }}>
            {!reconstructed && state === 'idle' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>
                <Search size={80} strokeWidth={1} style={{ marginBottom: 24 }} />
                <div style={{ fontWeight: 700, fontSize: 18 }}>Awaiting Material</div>
              </div>
            )}

            {reconstructed && (
               <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{ padding: 12, border: '1px solid var(--border)', background: 'var(--bg-card)', borderRadius: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textAlign: 'center' }}>RECONSTRUCTED MASTER</div>
                    <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={reconstructed} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                  </div>

                  <div style={{ flex: 1, marginTop: 32 }}>
                    {state === 'verified' && result && (
                      <div className="fade-in" style={{ padding: 24, borderRadius: 16, border: '1px solid var(--success)', background: 'var(--success-bg)', display: 'flex', flexDirection: 'column', gap: 16 }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                           <CheckCircle2 size={32} style={{ color: 'var(--success)' }} />
                           <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--success)' }}>INTEGRITY VERIFIED</div>
                         </div>
                         <div style={{ height: 1, background: 'rgba(16, 185, 129, 0.2)' }} />
                         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div>
                               <div style={{ fontSize: 11, opacity: 0.6, fontWeight: 700 }}>PULSE CODE</div>
                               <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700 }}>{result.secret}</div>
                            </div>
                            <div>
                               <div style={{ fontSize: 11, opacity: 0.6, fontWeight: 700 }}>RECONSTRUCTION CONFIDENCE</div>
                               <div style={{ fontSize: 16, fontWeight: 700 }}>{result.accuracy}</div>
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                               <div style={{ fontSize: 11, opacity: 0.6, fontWeight: 700 }}>ORIGINAL PROTECT STAMP</div>
                               <div style={{ fontSize: 14 }}>{new Date(result.dbRecord.created_at).toLocaleString()}</div>
                            </div>
                         </div>
                      </div>
                    )}

                    {(state === 'tampered' || state === 'invalid') && (
                      <div className="fade-in" style={{ padding: 24, borderRadius: 16, border: '1px solid var(--error)', background: 'var(--error-bg)', display: 'flex', gap: 16 }}>
                         <XCircle size={32} style={{ color: 'var(--error)', flexShrink: 0 }} />
                         <div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--error)' }}>
                               {state === 'invalid' ? 'DECODING FAILURE' : 'TAMPERING DETECTED'}
                            </div>
                            <div style={{ fontSize: 14, marginTop: 4 }}>
                               {state === 'invalid' ? 'The reconstructed image does not contain a valid Aegis heartbeat pulse.' : 'Heartbeat pulse found but it does not match our secure audit logs.'}
                            </div>
                         </div>
                      </div>
                    )}
                  </div>
               </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
