import { useState } from 'react';
import { supabase } from '../lib/supabase';
import logo from '../assets/logo.png';


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
      {/* Decorative Background Elements */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, var(--accent-blue) 0%, transparent 70%)', opacity: 0.05, filter: 'blur(100px)' }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, var(--accent-gold) 0%, transparent 70%)', opacity: 0.05, filter: 'blur(100px)' }} />

      <div className="panel fade-in" style={{ width: 440, padding: 48, textAlign: 'center', border: '1px solid var(--border)', boxShadow: '0 24px 48px -12px rgba(0,0,0,0.1)' }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{ 
            display: 'inline-flex', padding: 20, borderRadius: 24, background: 'var(--bg-secondary)', 
            marginBottom: 24, boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' 
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
              <div className="spin" style={{ width: 20, height: 20, border: '2px solid #e5e7eb', borderTopColor: '#4285F4', borderRadius: '50%' }} />
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20">
                <path d="M19.6 10.23c0-.66-.06-1.29-.17-1.91H10v3.61h5.38a4.61 4.61 0 0 1-2 3.02v2.51h3.24c1.89-1.75 2.98-4.32 2.98-7.23z" fill="#4285F4"/>
                <path d="M10 20c2.7 0 4.96-.89 6.62-2.42l-3.24-2.51c-.9.6-2.04.96-3.38.96-2.6 0-4.8-1.75-5.59-4.12H1.36v2.6A9.99 9.99 0 0 0 10 20z" fill="#34A853"/>
                <path d="M4.41 11.91c-.2-.6-.31-1.23-.31-1.91s.11-1.31.31-1.91V5.5H1.36A9.99 9.99 0 0 0 0 10c0 1.63.39 3.17 1.08 4.54l3.33-2.63z" fill="#FBBC05"/>
                <path d="M10 3.94c1.47 0 2.79.5 3.82 1.49l2.88-2.88A9.95 9.95 0 0 0 10 0C6.18 0 2.87 2.14 1.36 5.5l3.05 2.41c.79-2.37 2.99-4.12 5.59-4.12z" fill="#EA4335"/>
              </svg>
            )}
            <span style={{ fontWeight: 600 }}>
              {loading ? 'Connecting to Identity Provider...' : 'Sign in with Google'}
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
            placeholder="operative@aegis.local" 
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ width: '100%', height: 48, padding: '0 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
          />
          <input 
            type="password" 
            placeholder="Encryption Key (Password)" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ width: '100%', height: 48, padding: '0 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
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
          <div style={{ marginTop: 24, padding: '16px', background: error.includes('Check your email') ? 'rgba(113, 217, 180, 0.1)' : 'var(--error-bg)', border: `1px solid ${error.includes('Check your email') ? 'var(--accent-primary)' : 'var(--error)'}`, borderRadius: '12px', fontSize: 13, color: error.includes('Check your email') ? 'var(--accent-primary)' : 'var(--error)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <img src={logo} alt="" style={{ flexShrink: 0, width: 20, height: 20, filter: error.includes('Check your email') ? 'none' : 'grayscale(1)' }} />
            <div style={{ textAlign: 'left' }}>{error}</div>
          </div>
        )}



        <p style={{ marginTop: 40, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Certified Secure Environment • ISO/IEC 27001
        </p>
      </div>
    </div>
  );
}
