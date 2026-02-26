import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginModal         from '../components/LoginModal';
import HRSignUpModal      from '../components/HRSignUpModal';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import { useRipple }      from '../utils/useRipple';
import { saveSession, dashboardPath } from '../utils/auth';
import '../styles/LoginPage.css';

/**
 * Which modal is currently open:
 *   null | 'security' | 'hr' | 'admin' | 'hr-signup' | 'forgot'
 */

const LoginPage = () => {
  const [modal, setModal] = useState(null);
  const navigate          = useNavigate();
  const ripple            = useRipple();

  /* ── Handlers ────────────────────────────────────── */
  const openModal  = useCallback((name) => setModal(name), []);
  const closeModal = useCallback(()     => setModal(null),  []);

  const handleLoginSuccess = useCallback((user, token) => {
    saveSession(token, user);
    closeModal();
    navigate(dashboardPath(user.role));
  }, [navigate, closeModal]);

  /* ── Security Login icon ─────────────────────────── */
  const SecurityIcon = () => (
    <svg className="panel__icon" width="56" height="56" viewBox="0 0 56 56" fill="none">
      <circle cx="28" cy="28" r="28" fill="rgba(26,60,58,0.12)" />
      <path d="M28 14l-12 5.5v8c0 6.6 5.1 12.8 12 14.5 6.9-1.7 12-7.9 12-14.5v-8L28 14z"
        fill="rgba(26,60,58,0.25)" />
      <path d="M24 28l3 3 6-6" stroke="rgba(26,60,58,0.65)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  /* ── HR icon ─────────────────────────────────────── */
  const HRIcon = () => (
    <svg className="panel__icon" width="56" height="56" viewBox="0 0 56 56" fill="none">
      <circle cx="28" cy="28" r="28" fill="rgba(61,43,43,0.08)" />
      <circle cx="28" cy="23" r="7" fill="rgba(61,43,43,0.22)" />
      <path d="M14 42c0-7.7 6.3-14 14-14s14 6.3 14 14" stroke="rgba(61,43,43,0.3)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    </svg>
  );

  /* ── Render ──────────────────────────────────────── */
  return (
    <div className="login-page">

      {/* ── Top-right Admin Login button ─────────── */}
      <button
        className="admin-corner-btn"
        onClick={(e) => { ripple(e); openModal('admin'); }}
      >
        Admin Login
      </button>

      {/* ── Big split card ───────────────────────── */}
      <div className="login-card" role="main">

        {/* LEFT — Security ─────────────────────── */}
        <div className="panel panel--security">
          <SecurityIcon />

          <h1 className="panel__title">Security Login</h1>
          <p className="panel__subtitle">Login to access security dashboard</p>

          <button
            className="panel__btn"
            onClick={(e) => { ripple(e); openModal('security'); }}
          >
            Login as Security
          </button>

          <div className="panel__links">
            <button
              className="panel__link"
              type="button"
              onClick={() => openModal('forgot')}
            >
              Forgot Password?
            </button>
          </div>
        </div>

        {/* RIGHT — HR ──────────────────────────── */}
        <div className="panel panel--hr">
          <HRIcon />

          <h1 className="panel__title">HR Login</h1>
          <p className="panel__subtitle">Login to manage invitations</p>

          <button
            className="panel__btn"
            onClick={(e) => { ripple(e); openModal('hr'); }}
          >
            Login as HR
          </button>

          <div className="panel__links">
            <button
              className="panel__link"
              type="button"
              onClick={() => openModal('hr-signup')}
            >
              Sign Up
            </button>
            <button
              className="panel__link"
              type="button"
              onClick={() => openModal('forgot')}
            >
              Forgot Password?
            </button>
          </div>
        </div>

      </div>{/* end .login-card */}

      {/* ── Modals ───────────────────────────────── */}

      {(modal === 'security' || modal === 'hr' || modal === 'admin') && (
        <LoginModal
          role={modal}
          onClose={closeModal}
          onSuccess={handleLoginSuccess}
          onSignUp={() => setModal('hr-signup')}
          onForgot={() => setModal('forgot')}
        />
      )}

      {modal === 'hr-signup' && (
        <HRSignUpModal
          onClose={closeModal}
          onDone={() => setModal('hr')}
        />
      )}

      {modal === 'forgot' && (
        <ForgotPasswordModal
          onClose={closeModal}
          onBack={() => setModal('hr')}
        />
      )}

    </div>
  );
};

export default LoginPage;