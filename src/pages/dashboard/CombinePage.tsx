import { useState } from 'react';
import { getCryptoApi } from '../../lib/api';
import {
  MergeRounded as Combine,
  DownloadRounded as Download,
  ErrorRounded as AlertCircle,
  InfoRounded as Info,
  BlurOnRounded as Shard,
  CheckCircleRounded as CheckCircle,
} from '@mui/icons-material';
import { RefreshCw, Upload } from 'lucide-react';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';

export default function CombinePage() {
  const isMobile = window.innerWidth <= 768;
  const [shareA, setShareA] = useState<File | null>(null);
  const [shareB, setShareB] = useState<File | null>(null);
  const [previewA, setPreviewA] = useState<string | null>(null);
  const [previewB, setPreviewB] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<string | null>(null);

  const handleA = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setShareA(f); setPreviewA(URL.createObjectURL(f)); setResult(null); setError(''); }
  };
  const handleB = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setShareB(f); setPreviewB(URL.createObjectURL(f)); setResult(null); setError(''); }
  };

  const combine = async () => {
    if (!shareA || !shareB) return;
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('image1', shareA);
      fd.append('image2', shareB);
      fd.append('operation', 'decryption');
      fd.append('algorithm', 'rg_color_additive_SS');
      const res = await fetch(`${getCryptoApi()}/process`, { method: 'POST', body: fd });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || `Server returned ${res.status}`);
      }
      const data = await res.json();
      if (data.status !== 'success') throw new Error(data.message || 'Reconstruction failed');
      setResult(data.reconstructed);
    } catch (e: any) {
      setError(e.message || 'Reconstruction failed. Ensure both shares match.');
    } finally { setLoading(false); }
  };

  const dl = async (src: string, name: string) => {
    try {
      const path = await save({
        filters: [{ name: 'Image', extensions: ['png'] }],
        defaultPath: name
      });
      if (path) {
        const base64Data = src.split(',')[1];
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        await writeFile(path, bytes);
      }
    } catch (err) {
      console.error('Native save failed', err);
    }
  };

  const bothLoaded = shareA && shareB;

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', height: '100%', width: '100%', overflow: isMobile ? 'auto' : 'hidden' }}>

      {/* Left Column: Share Previews */}
      <section style={{ flex: 1, padding: isMobile ? 16 : 32, display: 'flex', flexDirection: 'column', gap: 24, borderRight: isMobile ? 'none' : '1px solid var(--border)', borderBottom: isMobile ? '1px solid var(--border)' : 'none', background: 'var(--bg-card)' }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span className="text-label" style={{ color: 'var(--accent-gold)' }}>Visual Cryptography</span>
          <h2 className="text-hero" style={{ fontSize: 32, letterSpacing: '-0.05em' }}>Combine Shards</h2>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', background: 'var(--error-bg)', border: '1px solid var(--error)', fontSize: 13, color: 'var(--error)', display: 'flex', gap: 10, alignItems: 'center' }}>
            <AlertCircle sx={{ fontSize: 16 }} /> {error}
          </div>
        )}

        {/* Share Uploads — Side by Side */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, flex: 1 }}>
          {/* Share A */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Shard sx={{ fontSize: 14, color: 'var(--accent-gold)' }} />
              <span className="text-label" style={{ color: 'var(--accent-gold)' }}>SHARD A</span>
            </div>
            <label style={{
              flex: 1,
              position: 'relative',
              overflow: 'hidden',
              background: previewA ? 'transparent' : 'var(--bg-card-highest)',
              border: `1.5px dashed ${previewA ? 'var(--accent-gold)' : 'var(--border)'}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 220,
              transition: 'border-color 0.15s',
            }}>
              {previewA ? (
                <>
                  <img src={previewA} alt="Share A" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 40%)' }} />
                  <div style={{ position: 'absolute', bottom: 12, left: 12 }}>
                    <span className="text-label" style={{ color: 'var(--accent-gold)', fontFamily: 'monospace' }}>SHARD A · {shareA?.name}</span>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', opacity: 0.3 }}>
                  <Upload size={32} style={{ marginBottom: 8 }} />
                  <div style={{ fontSize: 12, fontWeight: 700 }}>Upload Shard A</div>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleA} style={{ display: 'none' }} />
            </label>
          </div>

          {/* Share B */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Shard sx={{ fontSize: 14, color: 'var(--accent-gold)' }} />
              <span className="text-label" style={{ color: 'var(--accent-gold)' }}>SHARD B</span>
            </div>
            <label style={{
              flex: 1,
              position: 'relative',
              overflow: 'hidden',
              background: previewB ? 'transparent' : 'var(--bg-card-highest)',
              border: `1.5px dashed ${previewB ? 'var(--accent-gold)' : 'var(--border)'}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 220,
              transition: 'border-color 0.15s',
            }}>
              {previewB ? (
                <>
                  <img src={previewB} alt="Share B" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 40%)' }} />
                  <div style={{ position: 'absolute', bottom: 12, left: 12 }}>
                    <span className="text-label" style={{ color: 'var(--accent-gold)', fontFamily: 'monospace' }}>SHARD B · {shareB?.name}</span>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', opacity: 0.3 }}>
                  <Upload size={32} style={{ marginBottom: 8 }} />
                  <div style={{ fontSize: 12, fontWeight: 700 }}>Upload Shard B</div>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleB} style={{ display: 'none' }} />
            </label>
          </div>
        </div>

      </section>

      {/* Right Column: Status + Output */}
      <section style={{ width: isMobile ? '100%' : 450, padding: isMobile ? 16 : 32, display: 'flex', flexDirection: 'column', gap: 32, flexShrink: 0, background: 'var(--bg-primary)' }}>

        {/* Reconstruction Status */}
        <div className="panel" style={{ padding: 24, boxShadow: 'var(--shadow-heavy)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Combine sx={{ fontSize: 20, color: 'var(--accent-gold)' }} />
              <span className="font-headline text-label" style={{ fontWeight: 800 }}>Reconstruction Status</span>
            </div>
            <span className="font-headline" style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-gold)' }}>
              {loading ? '72%' : (result ? '100%' : (bothLoaded ? 'READY' : '0%'))}
            </span>
          </div>

          <div style={{ width: '100%', height: 6, background: 'var(--bg-card-highest)', borderRadius: 3, marginBottom: 16, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              background: 'var(--accent-gold)',
              width: loading ? '72%' : (result ? '100%' : (bothLoaded ? '50%' : '0%')),
              transition: 'width 0.8s ease-out'
            }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
            <span>{loading ? 'Reconstructing...' : (result ? 'Reconstruction Complete' : (bothLoaded ? 'Ready to Combine' : 'Awaiting Shards'))}</span>
            <span>{shareA ? '1' : '0'}/{shareB ? '2' : (shareA ? '1' : '0')} SHARDS</span>
          </div>
        </div>

        {/* Info Box */}
        <div className="info-badge" style={{ background: 'rgba(212, 160, 32, 0.05)', borderColor: 'rgba(212, 160, 32, 0.2)' }}>
          <Info sx={{ fontSize: 18, color: 'var(--accent-gold)', flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 12, lineHeight: 1.7 }}>
            Upload both cryptographic shares to reconstruct the original full-color image. The shards are combined using modular addition — if either shard is tampered with, the reconstruction will fail.
          </div>
        </div>

        {/* Reconstructed Result Preview */}
        {result && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle sx={{ fontSize: 16, color: 'var(--success)' }} />
              <span className="text-label" style={{ color: 'var(--success)' }}>Reconstructed Output</span>
            </div>
            <div style={{
              flex: 1,
              background: 'var(--bg-card-highest)',
              border: '1px solid var(--success)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 140,
            }}>
              <img src={result} alt="Reconstructed" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {result && (
            <button
              className="btn-primary fade-in"
              onClick={() => dl(result, 'reconstructed.png')}
              style={{ width: '100%', height: 48, background: 'var(--accent-gold)' }}
            >
              <Download sx={{ fontSize: 18 }} /> Download Reconstructed Image
            </button>
          )}

          <button
            className="btn-primary"
            onClick={combine}
            disabled={!shareA || !shareB || loading}
            style={{ width: '100%', height: 64, background: result ? 'transparent' : undefined, border: result ? '1px solid var(--border)' : 'none', color: result ? 'var(--text-primary)' : undefined }}
          >
            {loading
              ? <><RefreshCw size={18} className="spin" /> Combining Shards...</>
              : <><Combine sx={{ fontSize: 18 }} /> {result ? 'Recombine Shards' : 'Combine Cryptographic Shards'}</>
            }
          </button>
        </div>

      </section>
    </div>
  );
}
