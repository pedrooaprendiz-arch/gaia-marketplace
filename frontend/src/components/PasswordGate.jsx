import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';

const CORRECT_PASSWORD = 'GRAAL33';
const AUTH_KEY = 'gaia_auth_verified';

export default function PasswordGate({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const authStatus = localStorage.getItem(AUTH_KEY);
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === CORRECT_PASSWORD) {
      localStorage.setItem(AUTH_KEY, 'true');
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Password incorreta');
      setPassword('');
    }
  };

  if (isLoading) {
    return (
      <div className="password-gate">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return children;
  }

  return (
    <div className="password-gate">
      <div className="password-logo-container">
        <Lock size={60} className="password-lock-icon" />
        <div className="password-logo">GAIA</div>
        <div className="password-subtitle">Acesso Restrito</div>
      </div>

      <form className="password-form" onSubmit={handleLogin}>
        <label className="password-label">Password de Acesso</label>
        
        <div className="password-input-container">
          <Lock size={20} />
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Introduza a password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            autoComplete="off"
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {error && (
          <div className="password-error">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <button type="submit" className="password-btn" disabled={!password}>
          Entrar
          <ArrowRight size={20} />
        </button>
      </form>

      <div className="password-footer">Demo para investidores</div>
    </div>
  );
}
