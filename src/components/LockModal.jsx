// src/components/LockModal.jsx
import { useState } from 'react';
import { Lock } from 'lucide-react';

export default function LockModal({ title, description, onSubmit, onClose }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const ok = onSubmit(password);
    if (!ok) setError('Incorrect access code. Please try again.');
  };

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 360 }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'var(--surface-3)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 12px'
          }}>
            <Lock size={22} color="var(--text-secondary)" />
          </div>
          <h3 style={{ marginBottom: 6 }}>{title}</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{description}</p>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            className="input"
            type="password"
            placeholder="Access code"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
            autoFocus
            style={{ marginBottom: 10 }}
          />
          {error && <p style={{ fontSize: '0.8125rem', color: 'var(--danger)', marginBottom: 10 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Unlock</button>
          </div>
        </form>
      </div>
    </div>
  );
}
