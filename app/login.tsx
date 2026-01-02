import { useState } from 'react';
import dynamic from 'next/dynamic';


export default function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        onLogin();
      } else if (res.status === 500) {
        setError('Server error - check env vars');
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('Connection error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950">
      <form onSubmit={handleSubmit} className="bg-slate-800 p-8 rounded-xl shadow-xl w-full max-w-sm border border-slate-700">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Sign In</h2>
        <input
          className="w-full mb-4 px-4 py-2 rounded bg-slate-900 text-white border border-slate-700 focus:outline-none"
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          autoComplete="username"
        />
        <div className="relative mb-4">
          <input
            className="w-full px-4 py-2 rounded bg-slate-900 text-white border border-slate-700 focus:outline-none pr-10"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
            tabIndex={-1}
            onClick={() => setShowPassword(v => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M17.94 17.94A10.06 10.06 0 0 1 12 20C7 20 2.73 16.11 1 12c.73-1.67 2.07-3.87 4.06-5.94M9.88 9.88A3 3 0 0 1 12 9c1.66 0 3 1.34 3 3 0 .42-.08.82-.22 1.18M6.12 6.12 3 3m18 18-3.12-3.12" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M1 12S5 5 12 5s11 7 11 7-4 7-11 7S1 12 1 12Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
        {error && <div className="text-red-500 mb-4 text-center">{error}</div>}
        <button
          type="submit"
          className="w-full bg-white hover:bg-slate-100 text-white font-semibold py-2 rounded transition-colors"
        >
          Log In
        </button>
      </form>
    </div>
  );
}

