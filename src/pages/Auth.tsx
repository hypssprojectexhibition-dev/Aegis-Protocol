import { useState } from 'react';
import { supabase } from '../lib/supabase';
import logo from '../assets/logo.png';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  const handleBypass = () => {
    localStorage.setItem('dev_bypass', 'true');
    window.location.reload();
  };

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', position: 'relative', overflow: 'hidden' }}>
      <div className="panel" style={{ width: 400, padding: '40px' }}>
        {/* Logo area */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <img src={logo} alt="Aegis Logo" style={{ width: 80, height: 80, objectFit: 'contain' }} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>
            Aegis Protocol
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Welcome to the Image Control Center</p>
        </div>

        <form onSubmit={handleAuth}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 500 }}>Email Address</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="input-field" placeholder="you@example.com" required
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 500 }}>Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="input-field" placeholder="••••••••" required
            />
          </div>

          {error && (
            <div style={{ padding: '12px 16px', background: 'var(--error-bg)', border: '1px solid var(--error)', borderRadius: '8px', fontSize: 14, color: 'var(--error)', marginBottom: 20 }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: '12px 20px', fontSize: 15 }}>
            {loading ? 'Authenticating...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', fontSize: 14, cursor: 'pointer', fontWeight: 500 }}>
            {mode === 'login' ? 'Create an account' : 'Back to sign in'}
          </button>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', marginTop: 24, paddingTop: 24, textAlign: 'center' }}>
          <button onClick={handleBypass} className="btn-outline" style={{ fontSize: 13 }}>
            Continue without account
          </button>
        </div>
      </div>
    </div>
  );
}
