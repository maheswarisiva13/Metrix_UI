import React, { useState, useRef, useEffect } from 'react';
import FormInput from './FormInput';

const ForgotPasswordModal = ({ onClose, onBack }) => {
  const [email, setEmail]       = useState('');
  const [sent, setSent]         = useState(false);
  const [loading, setLoading]   = useState(false);
  const overlayRef              = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // TODO: POST /api/auth/forgot-password  { email }
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    setSent(true);
  };

  return (
    <div
      className="modal-overlay"
      ref={overlayRef}
      onClick={e => e.target === overlayRef.current && onClose()}
    >
      <div className="modal" style={{ position: 'relative' }}>
        <div className="modal__stripe modal__stripe--hr" />
        <button className="modal__close" onClick={onClose} aria-label="Close">✕</button>

        <div className="modal__body">
          {!sent ? (
            <>
              <h2 className="modal__title">Forgot Password</h2>
              <p className="modal__subtitle">Enter your email and we'll send a reset link.</p>
              <form onSubmit={handleSubmit}>
                <FormInput
                  label="Email Address"
                  type="email"
                  name="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                />
                <button type="submit" className="modal__submit modal__submit--hr" disabled={loading}>
                  {loading && <span className="spinner" />}
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>📬</div>
              <h2 className="modal__title">Email Sent!</h2>
              <p className="modal__subtitle" style={{ marginBottom: 28 }}>
                Check <strong>{email}</strong> for your password reset link.
              </p>
              <button
                type="button"
                className="modal__submit modal__submit--hr"
                onClick={onClose}
              >
                Done
              </button>
            </div>
          )}

          {!sent && (
            <div className="modal__footer">
              <button type="button" onClick={onBack}>← Back to Login</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;