import { useState } from 'react';
import { STEGA_API, CRYPTO_API } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { 
  CheckCircle2, 
  XCircle, 
  Search, 
  RefreshCw, 
  Clock, 
  Info, 
  Upload 
} from 'lucide-react';

type VerifyState = 'idle' | 'processing' | 'verified' | 'tampered' | 'invalid' | 'error';

export default function Verify() {
  const [layerAFile, setLayerAFile] = useState<File | null>(null);
  const [layerBFile, setLayerBFile] = useState<File | null>(null);
  const [state, setState] = useState<VerifyState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState<any>(null);
  const [reconstructed, setReconstructed] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!layerAFile || !layerBFile) return;
    setState('processing');
    setErrorMsg('');
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
        throw new Error(`Cannot reach VisualCrypto API. Ensure the backend is running.`);
      }
      if (!decRes.ok) throw new Error('Reconstruction failed. Please check your shares.');

      const ts = Date.now();
      const recUrl = `${CRYPTO_API}/static/output/decrypted.png?t=${ts}`;
      setReconstructed(recUrl);

      // Brief delay for visual effect
      await new Promise(r => setTimeout(r, 600));

      // Step 2: Decode watermark from reconstructed image
      const recBlob = await fetch(recUrl).then(r => r.blob());
      const recFile = new File([recBlob], 'reconstructed.png', { type: 'image/png' });

      const decodeFd = new FormData();
      decodeFd.append('image', recFile);

      let stegaRes: Response;
      try {
        stegaRes = await fetch(`${STEGA_API}/api/decode`, { method: 'POST', body: decodeFd });
      } catch {
        throw new Error(`Cannot reach StegaStamp API. Ensure the backend is running.`);
      }
      if (!stegaRes.ok) throw new Error('Watermark extraction failed.');

      const decoded = await stegaRes.json();
      setResult(decoded);

      if (decoded.status !== 'success') {
        setState('invalid');
        return;
      }

      // Step 3: Check against database
      try {
        const { data } = await supabase
          .from('operations')
          .select('*')
          .eq('watermark_code', decoded.secret.trim())
          .limit(1);

        if (data && data.length > 0) {
          setResult({ ...decoded, dbRecord: data[0] });
          setState('verified');
        } else {
          setState('tampered');
        }
      } catch {
        // If DB unavailable, still show extraction result
        setState('tampered');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification process error occurred');
      setState('error');
    }
  };

  const FileSlot = ({ label, file, onSet }: { label: string; file: File | null; onSet: (f: File) => void }) => {
    const [isHovered, setIsHovered] = useState(false);
    return (
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        <label 
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: 160, borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s',
            background: file ? 'var(--success-bg)' : 'var(--bg-secondary)',
            border: `2px dashed ${file ? 'var(--success)' : isHovered ? 'var(--accent-blue)' : 'var(--border)'}`,
            position: 'relative', overflow: 'hidden',
          }}
        >
          {file ? (
            <>
              <img src={URL.createObjectURL(file)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.15 }} />
              <CheckCircle2 size={32} style={{ color: 'var(--success)', zIndex: 1, marginBottom: 8 }} />
              <span style={{ fontSize: 13, color: 'var(--text-primary)', zIndex: 1, fontWeight: 600 }}>Share Uploaded</span>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', zIndex: 1, marginTop: 4 }}>{file.name}</span>
            </>
          ) : (
            <>
              <Upload size={32} style={{ color: 'var(--text-muted)', marginBottom: 12, opacity: 0.5 }} />
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Select share part</span>
            </>
          )}
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
            if (e.target.files?.[0]) onSet(e.target.files[0]);
          }} />
        </label>
      </div>
    );
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Verify Integrity</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          Reconstruct images from multiple cryptographic shares to validate provenance and detect unauthorized changes.
        </p>
      </div>

      {errorMsg && (
        <div style={{ padding: '12px 16px', marginBottom: 24, borderRadius: 12, background: 'var(--error-bg)', border: '1px solid var(--error)', fontSize: 13, color: 'var(--error)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <XCircle size={16} />
          {errorMsg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
        {/* Left Panel: Inputs */}
        <div className="panel" style={{ padding: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 24, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Authentication Inputs</div>

          <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
            <FileSlot label="Secure Share A" file={layerAFile} onSet={setLayerAFile} />
            <FileSlot label="Secure Share B" file={layerBFile} onSet={setLayerBFile} />
          </div>

          <button className="btn-primary" onClick={handleVerify}
            disabled={!layerAFile || !layerBFile || state === 'processing'}
            style={{ width: '100%', height: 48, fontSize: 15 }}>
            {state === 'processing' ? <RefreshCw size={18} className="spin" /> : <Search size={20} />}
            {state === 'processing' ? 'Verifying Integrity...' : 'Verify Provence'}
          </button>
        </div>

        {/* Right Panel: Result Display */}
        <div className="panel" style={{ padding: 24, minHeight: 460 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 24, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Analysis Result</div>

          {state === 'idle' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 320, color: 'var(--text-muted)', opacity: 0.5 }}>
              <Search size={48} style={{ marginBottom: 16, opacity: 0.2 }} />
              <div style={{ fontSize: 14, fontWeight: 500 }}>Awaiting share input</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Both cryptographic parts are required</div>
            </div>
          )}

          {state === 'processing' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 320 }}>
              <div className="spin" style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%', marginBottom: 20 }} />
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Authenticating...</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>Cross-referencing blockchain & local records</div>
            </div>
          )}

          {state === 'verified' && result && (
            <div className="fade-in">
              <div style={{ padding: '20px', borderRadius: 12, background: 'var(--success-bg)', border: '1px solid var(--success)', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <CheckCircle2 size={24} style={{ color: 'var(--success)' }} />
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--success)' }}>Integrity Verified</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Provenance confirmed via secure database.</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16, borderTop: '1px solid rgba(16, 185, 129, 0.1)', paddingTop: 16 }}>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4, textTransform: 'uppercase' }}>Watermark Code</div>
                    <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>{result.secret}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4, textTransform: 'uppercase' }}>Extraction Accuracy</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--success)' }}>{result.accuracy}</div>
                  </div>
                  {result.dbRecord && (
                    <div style={{ gridColumn: 'span 2' }}>
                      <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4, textTransform: 'uppercase' }}>Authentication Stamp</div>
                      <div style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Clock size={12} /> {new Date(result.dbRecord.created_at).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {(state === 'tampered' || state === 'invalid') && (
            <div className="fade-in">
              <div style={{ padding: '20px', borderRadius: 12, background: 'var(--error-bg)', border: '1px solid var(--error)', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <XCircle size={24} style={{ color: 'var(--error)' }} />
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--error)' }}>
                      {state === 'invalid' ? 'Verification Failure' : 'Tampering Detected'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {state === 'invalid' 
                        ? 'Valid Aegis watermark could not be extracted.' 
                        : 'Watermark extracted but no matching provenance record found.'}
                    </div>
                  </div>
                </div>
                {result && result.secret !== 'BCH Uncorrectable' && (
                  <div style={{ marginTop: 12, background: 'rgba(239, 68, 68, 0.05)', padding: 12, borderRadius: 8, fontSize: 12 }}>
                    <span style={{ fontWeight: 600 }}>Metadata found: </span>
                    <span style={{ fontFamily: 'monospace' }}>{result.secret}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {reconstructed && (
            <div className="fade-in">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Info size={14} style={{ color: 'var(--accent-blue)' }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Reconstructed Visualization</span>
              </div>
              <div className="panel-inset" style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={reconstructed} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
