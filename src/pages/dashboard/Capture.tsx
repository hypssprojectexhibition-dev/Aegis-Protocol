import { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, RefreshCcw } from 'lucide-react';
import { encodeStega } from '../../lib/api';

export default function CapturePage() {
  const webcamRef = useRef<Webcam>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [secret, setSecret] = useState('VAULT_771');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImg, setResultImg] = useState<string | null>(null);

  const capture = useCallback(async () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    setIsProcessing(true);
    try {
      // Convert base64 to File object for the API
      const res = await fetch(imageSrc);
      const blob = await res.blob();
      const file = new File([blob], "capture.png", { type: "image/png" });

      const response = await encodeStega(file, secret || 'VAULT', 1.0);
      if (response.stego) {
        setResultImg(response.stego);
      }
    } catch (err) {
      console.error("Capture encoding failed", err);
    } finally {
      setIsProcessing(false);
    }
  }, [webcamRef, secret]);

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  if (resultImg) {
    return (
      <div style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <h2 className="font-headline" style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>Encrypted Snapshot</h2>
        <div style={{ flex: 1, background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: 16, border: '1px solid var(--border)' }}>
          <img src={resultImg} alt="Stego Result" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <div style={{ marginTop: 24, display: 'flex', gap: 16 }}>
          <button className="btn-outline" style={{ flex: 1 }} onClick={() => setResultImg(null)}>Take Another</button>
          <a href={resultImg} download="vault_capture.png" className="btn-primary" style={{ flex: 1 }}>Save Local Copy</a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: 'black', overflow: 'hidden' }}>
      
      {/* Live Viewfinder */}
      <Webcam
        ref={webcamRef}
        audio={false}
        screenshotFormat="image/png"
        videoConstraints={{ facingMode, width: 1920, height: 1080 }}
        style={{
          width: '100%', height: '100%', objectFit: 'cover',
          filter: 'grayscale(0.8) brightness(0.7) contrast(1.2)'
        }}
      />

      {/* Grid Overlay */}
      <div className="viewfinder-grid" style={{ position: 'absolute', inset: 0, opacity: 0.4, pointerEvents: 'none' }} />

      {/* UI Overlays */}
      <div style={{ position: 'absolute', inset: 0, padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 20 }}>
        
        {/* Top Status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ background: 'rgba(0, 81, 61, 0.8)', backdropFilter: 'blur(10px)', padding: '6px 12px', border: '1px solid rgba(113, 217, 180, 0.2)', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="status-dot online" />
              <span className="text-label" style={{ color: 'var(--accent-primary)' }}>Watermark Layer Active</span>
            </div>
            <div style={{ fontSize: 10, fontFamily: 'monospace', color: 'rgba(113, 217, 180, 0.6)', textTransform: 'uppercase', paddingLeft: 4 }}>
              Aegis Encryption Protocol 4.0.2
            </div>
          </div>

          <div style={{ background: 'rgba(33, 39, 36, 0.6)', backdropFilter: 'blur(10px)', padding: '8px 12px', borderRadius: 4, border: '1px solid var(--border)', textAlign: 'right' }}>
            <div className="font-headline" style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent-primary)' }}>ISO 400</div>
            <div className="font-headline" style={{ fontSize: 12, color: 'var(--text-muted)' }}>F 1.8 | 1/60</div>
          </div>
        </div>

        {/* Center Focus Brackets */}
        <div style={{ 
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 200, height: 200, border: '1px solid rgba(113, 217, 180, 0.2)', opacity: 0.5, pointerEvents: 'none'
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: 16, height: 16, borderTop: '2px solid var(--accent-primary)', borderLeft: '2px solid var(--accent-primary)' }} />
          <div style={{ position: 'absolute', top: 0, right: 0, width: 16, height: 16, borderTop: '2px solid var(--accent-primary)', borderRight: '2px solid var(--accent-primary)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: 16, height: 16, borderBottom: '2px solid var(--accent-primary)', borderLeft: '2px solid var(--accent-primary)' }} />
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 16, height: 16, borderBottom: '2px solid var(--accent-primary)', borderRight: '2px solid var(--accent-primary)' }} />
          
          {/* Secret Input embedded inside crosshair */}
          <input 
            type="text" 
            value={secret}
            onChange={e => setSecret(e.target.value.substring(0, 7))}
            maxLength={7}
            placeholder="SECRET"
            style={{ 
              position: 'absolute', top: '120%', left: '50%', transform: 'translate(-50%, 0)',
              background: 'rgba(0,0,0,0.5)', border: '1px solid var(--accent-primary)', color: 'var(--accent-primary)',
              textAlign: 'center', width: 120, padding: 8, fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase',
              outline: 'none', pointerEvents: 'auto', borderRadius: 4, fontWeight: 800
            }}
          />
        </div>

        {/* Bottom Camera Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 30 }}>
          
          {/* Gallery Shortcut */}
          <div style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: 4, border: '1px solid rgba(225, 231, 226, 0.3)', overflow: 'hidden', background: '#111413' }}>
              <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCraxhlyuYRbjYbL7MT0ftINgty2tvEZruVQJcVVslIAWfH3XE1v2ngXWA8e8B1JnleoL00tUljDyCEud-07gf5R0H5TAxr_Y1FrrZV4l3z4toOuYJPNVi5TvwYl5NCj-WDneaaPBNIXu5UZERS5kgz2vqh5xmolt_mbw0EHy9carU5qyNV790Qd-4fpbXjnyCPJOhb5ZBDJJmcqpAk-sId_Yqgy8HgYY7RMUUfu_QXCALxrqfdV4h6Fla874xrCBri-jOUcCC3mA" alt="Gallery" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} />
            </div>
            <span className="text-label" style={{ marginTop: 8 }}>Recent</span>
          </div>

          {/* Shutter */}
          <div>
            <button 
              onClick={capture}
              disabled={isProcessing}
              style={{
                width: 80, height: 80, borderRadius: '50%', border: '4px solid rgba(225, 231, 226, 0.2)',
                background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: isProcessing ? 'wait' : 'pointer', transition: 'transform 0.1s'
              }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div className="shutter-glow" style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Camera size={32} color="var(--text-inverse)" />
              </div>
            </button>
          </div>

          {/* Flip */}
          <div onClick={toggleCamera} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-muted)' }}>
            <RefreshCcw size={28} />
            <span className="text-label" style={{ marginTop: 8 }}>Flip</span>
          </div>

        </div>

      </div>
    </div>
  );
}
