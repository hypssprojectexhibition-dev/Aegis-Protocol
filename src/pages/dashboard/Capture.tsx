import { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { PhotoCameraRounded as Camera, FlipCameraIosRounded as RefreshCcw } from '@mui/icons-material';
import { encodeStega } from '../../lib/api';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';

export default function CapturePage() {
  const webcamRef = useRef<Webcam>(null);
  const [isMirrored, setIsMirrored] = useState(true);
  const [secret, setSecret] = useState('AEGIS_771');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImg, setResultImg] = useState<string | null>(null);
  const [intensity, setIntensity] = useState<'quality' | 'balanced' | 'rough'>('balanced');

  const INTENSITY_MAP = {
    quality: 0.45,
    balanced: 0.65,
    rough: 1.0,
  };

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

      const response = await encodeStega(file, secret || 'VAULT', INTENSITY_MAP[intensity]);
      if (response.stego) {
        setResultImg(response.stego);
      }
    } catch (err) {
      console.error("Capture encoding failed", err);
    } finally {
      setIsProcessing(false);
    }
  }, [webcamRef, secret]);

  const handleSave = async () => {
    if (!resultImg) return;
    try {
      const path = await save({
        filters: [{ name: 'Image', extensions: ['png'] }],
        defaultPath: 'vault_capture.png'
      });
      if (path) {
        const base64Data = resultImg.split(',')[1];
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

  const toggleMirror = () => {
    setIsMirrored(prev => !prev);
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
          <button className="btn-primary" style={{ flex: 1 }} onClick={handleSave}>Save Local Copy</button>
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
        videoConstraints={{ width: 1920, height: 1080 }}
        style={{
          width: '100%', height: '100%', objectFit: 'cover',
          transform: isMirrored ? 'scaleX(-1)' : 'none',
          filter: 'brightness(0.9) contrast(1.1)'
        }}
      />

      {/* Grid Overlay */}
      <div className="viewfinder-grid" style={{ position: 'absolute', inset: 0, opacity: 0.15, pointerEvents: 'none' }} />

      {/* UI Overlays */}
      <div style={{ position: 'absolute', inset: 0, padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 20 }}>
        
        {/* Top Status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(10px)', padding: '6px 12px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="status-dot online" />
            <span className="text-label" style={{ color: 'var(--accent-primary)' }}>System Interface Active</span>
          </div>
        </div>

        {/* Center Focus Brackets */}
        <div style={{ 
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 200, height: 200, border: '1px solid rgba(203, 202, 210, 0.1)', opacity: 0.5, pointerEvents: 'none'
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: 16, height: 16, borderTop: '1px solid var(--accent-primary)', borderLeft: '1px solid var(--accent-primary)' }} />
          <div style={{ position: 'absolute', top: 0, right: 0, width: 16, height: 16, borderTop: '1px solid var(--accent-primary)', borderRight: '1px solid var(--accent-primary)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: 16, height: 16, borderBottom: '1px solid var(--accent-primary)', borderLeft: '1px solid var(--accent-primary)' }} />
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 16, height: 16, borderBottom: '1px solid var(--accent-primary)', borderRight: '1px solid var(--accent-primary)' }} />
          
          <input 
            type="text" 
            value={secret}
            onChange={e => setSecret(e.target.value.substring(0, 7))}
            maxLength={7}
            style={{ 
              position: 'absolute', top: '120%', left: '50%', transform: 'translate(-50%, 0)',
              background: 'rgba(0,0,0,0.6)', border: '1px solid var(--border)', color: 'var(--accent-primary)',
              textAlign: 'center', width: 140, padding: '8px 12px', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase',
              outline: 'none', pointerEvents: 'auto', fontWeight: 700
            }}
          />
        </div>

        {/* Bottom Camera Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 30 }}>
          
          <div style={{ width: 80 }} /> {/* Spacer for symmetry */}

          {/* Shutter */}
          <div>
            <button 
              onClick={capture}
              disabled={isProcessing}
              style={{
                width: 72, height: 72, border: '4px solid var(--border)',
                background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: isProcessing ? 'wait' : 'pointer', transition: 'transform 0.1s', borderRadius: 0
              }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div style={{ width: '100%', height: '100%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Camera sx={{ fontSize: 24, color: 'var(--bg-primary)' }} />
              </div>
            </button>
          </div>

          {/* Mirror Toggle */}
          <div onClick={toggleMirror} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-muted)', width: 80 }}>
            <RefreshCcw sx={{ fontSize: 20 }} />
            <span className="text-label" style={{ marginTop: 8, fontSize: 9 }}>Mirror</span>
          </div>

          {/* Intensity Selector */}
          <div style={{ position: 'absolute', bottom: 120, left: '50%', transform: 'translateX(-50%)', width: 240, display: 'flex', flexDirection: 'column', gap: 10 }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
                <span className="text-label" style={{ fontSize: 9, opacity: 0.8 }}>ENCODER INTENSITY</span>
                <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--accent-primary)', opacity: 0.8 }}>{INTENSITY_MAP[intensity].toFixed(2)}</span>
             </div>
             <div className="tab-switcher" style={{ width: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)' }}>
                {(['quality', 'balanced', 'rough'] as const).map(lvl => (
                  <button
                    key={lvl}
                    className={`tab-btn ${intensity === lvl ? 'active' : ''}`}
                    onClick={() => setIntensity(lvl)}
                    style={{ fontSize: 9, padding: '8px 2px' }}
                  >
                    {lvl}
                  </button>
                ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
