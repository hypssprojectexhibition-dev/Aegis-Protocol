import { useState } from 'react';
import { supabase } from '../lib/supabase';
import logo from '../assets/logo.png';
import WindowControls from '../components/WindowControls';
import { Google } from '@mui/icons-material';


export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (e: any) {
      setError(e.message || 'Authentication failed. Please check your internet connection.');
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Please enter email and password."); return; }
    
    setLoading(true);
    setError(null);
    
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setError("Check your email for the confirmation link!"); // Note: using error state to show success message temporarily
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e: any) {
      setError(e.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  // dev bypass removed

  return (
    <div style={{ 
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', 
      background: 'var(--bg-primary)', position: 'relative', overflow: 'hidden' 
    }}>
      {/* Top Header & Window Controls for Auth */}
      <div 
        data-tauri-drag-region 
        style={{ 
          position: 'absolute', top: 0, left: 0, right: 0, height: 64, 
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 0,
          zIndex: 1000, pointerEvents: 'none'
        }}
      >
        <div style={{ pointerEvents: 'auto' }}>
          <WindowControls />
        </div>
      </div>

      <div className="panel fade-in" style={{ width: 440, padding: 48, textAlign: 'center', border: '1px solid var(--border)', background: 'var(--bg-card)', borderRadius: 0 }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{ 
            display: 'inline-flex', padding: 20, borderRadius: 0, background: 'var(--accent-container)', 
            marginBottom: 24, border: '1px solid var(--border)'
          }}>
            <img src={logo} alt="Aegis Logo" style={{ width: 84, height: 84, objectFit: 'contain' }} />
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.04em', marginBottom: 12 }}>
            Aegis Protocol
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: '80%', margin: '0 auto' }}>
            Unified command center for steganography, visual crypto, and professional redaction.
          </p>
        </div>

        <div style={{ marginBottom: 32 }}>
          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="btn-primary" 
            style={{ 
              width: '100%', height: 56, fontSize: 16, background: '#ffffff', color: '#1f2937', 
              border: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', gap: 16 
            }}
          >
            {loading ? (
              <div className="spin" style={{ width: 20, height: 20, border: '2px solid var(--border)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%' }} />
            ) : (
              <Google sx={{ fontSize: 20, color: 'var(--accent-primary)' }} />
            )}
            <span style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {loading ? 'AUTHENTICATING...' : 'SIGN IN WITH GOOGLE'}
            </span>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24, marginTop: 24 }}>
          <div style={{ height: 1, background: 'var(--border)', alignSelf: 'center' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Or Email</span>
          <div style={{ height: 1, background: 'var(--border)', alignSelf: 'center' }} />
        </div>

        <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          <input 
            type="email" 
            placeholder="OPERATIVE_ID" 
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ width: '100%', height: 48, padding: '0 16px', borderRadius: 0, border: '1px solid var(--border)', background: 'var(--bg-card-high)', color: 'var(--text-primary)', outline: 'none', fontSize: 13 }}
          />
          <input 
            type="password" 
            placeholder="ENCRYPTION_KEY" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ width: '100%', height: 48, padding: '0 16px', borderRadius: 0, border: '1px solid var(--border)', background: 'var(--bg-card-high)', color: 'var(--text-primary)', outline: 'none', fontSize: 13 }}
          />
          <button type="submit" disabled={loading} className="btn-primary" style={{ height: 48, marginTop: 8 }}>
             {loading ? 'Processing...' : (isSignUp ? 'Register Terminal' : 'Authenticate')}
          </button>
        </form>

        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {isSignUp ? 'Already have an account? ' : 'Need access? '}
          <span onClick={() => setIsSignUp(!isSignUp)} style={{ color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: 700 }}>
             {isSignUp ? 'Sign In' : 'Sign Up'}
          </span>
        </p>

        {error && (
          <div style={{ marginTop: 24, padding: '16px', background: 'var(--bg-card-highest)', border: `1px solid ${error.includes('Check your email') ? 'var(--accent-primary)' : 'var(--error)'}`, borderRadius: 0, fontSize: 13, color: error.includes('Check your email') ? 'var(--accent-primary)' : 'var(--error)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ textAlign: 'left', flex: 1 }}>{error}</div>
          </div>
        )}



        <p style={{ marginTop: 40, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Certified Secure Environment • ISO/IEC 27001
        </p>
      </div>
    </div>
  );
}
