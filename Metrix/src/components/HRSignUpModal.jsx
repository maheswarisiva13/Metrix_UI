import React, { useState, useRef, useEffect } from 'react';
import FormInput from './FormInput';

const HRSignUpModal = ({ onClose, onDone }) => {
  const [form, setForm]       = useState({ name: '', email: '', department: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);
  const overlayRef            = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleChange = (e) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (form.password.length < 8)       { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      // TODO: POST /api/hr  { name, email, department, password }
      await new Promise(r => setTimeout(r, 900));
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Signup failed.');
    } finally {
      setLoading(false);
    }
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
          {!success ? (
            <>
              <h2 className="modal__title">Create HR Account</h2>
              <p className="modal__subtitle">Fill in your details to get started</p>

              {error && <div className="form-error"><span>⚠️</span> {error}</div>}

              <form onSubmit={handleSubmit} noValidate>
                <FormInput
                  label="Full Name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Jane Smith"
                  required
                  focusColor="#a09090"
                  focusShadow="rgba(160,144,144,0.22)"
                />
                <FormInput
                  label="Work Email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="jane@company.com"
                  required
                  focusColor="#a09090"
                  focusShadow="rgba(160,144,144,0.22)"
                />
                <FormInput
                  label="Department"
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  placeholder="Human Resources"
                  required
                  focusColor="#a09090"
                  focusShadow="rgba(160,144,144,0.22)"
                />
                <FormInput
                  label="Password"
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min 8 characters"
                  required
                  focusColor="#a09090"
                  focusShadow="rgba(160,144,144,0.22)"
                />
                <FormInput
                  label="Confirm Password"
                  type="password"
                  name="confirm"
                  value={form.confirm}
                  onChange={handleChange}
                  placeholder="Repeat password"
                  required
                  focusColor="#a09090"
                  focusShadow="rgba(160,144,144,0.22)"
                />

                <button
                  type="submit"
                  className="modal__submit modal__submit--hr"
                  disabled={loading}
                >
                  {loading && <span className="spinner" />}
                  {loading ? 'Creating Account...' : 'Create HR Account'}
                </button>
              </form>

              <div className="modal__footer">
                Already have an account?{' '}
                <button type="button" onClick={onDone}>Sign In</button>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>✅</div>
              <h2 className="modal__title">Account Created!</h2>
              <p className="modal__subtitle" style={{ marginBottom: 28 }}>
                Your HR account is ready. You can now sign in.
              </p>
              <button
                type="button"
                className="modal__submit modal__submit--hr"
                onClick={onDone}
              >
                Go to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HRSignUpModal;