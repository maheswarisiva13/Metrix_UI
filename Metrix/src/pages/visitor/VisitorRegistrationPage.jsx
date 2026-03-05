// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/pages/visitor/VisitorRegistrationPage.jsx   (NEW FILE)
//
// Flow:
//   1. Page loads → reads ?token= from URL → GET /api/visitor/invite?token=XYZ
//   2. If valid: pre-fills form with name, email, purpose, visitDate
//   3. Visitor fills phone + ID proof → submit → POST /api/visitor/register
//   4. Success screen shown → backend has emailed HR
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import { getInviteDetails, registerVisitor } from '../../utils/visitorService';
import '../../styles/visitor/VisitorRegistration.css';

const ID_TYPES = [
  { value: 'Aadhaar',        label: 'Aadhaar Card' },
  { value: 'Passport',       label: 'Passport' },
  { value: 'DrivingLicense', label: 'Driving License' },
  { value: 'VoterID',        label: 'Voter ID' },
];

// ── Step indicator ────────────────────────────────────────
const Steps = ({ current }) => {
  const steps = ['Verify Link', 'Your Details', 'Done'];
  return (
    <div className="vr-steps">
      {steps.map((label, i) => {
        const num    = i + 1;
        const done   = num < current;
        const active = num === current;
        return (
          <React.Fragment key={label}>
            <div className="vr-step">
              <div className={`vr-step__dot${done ? ' vr-step__dot--done' : active ? ' vr-step__dot--active' : ''}`}>
                {done ? '✓' : num}
              </div>
              <span className={`vr-step__label${done ? ' vr-step__label--done' : active ? ' vr-step__label--active' : ''}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`vr-step-line${done ? ' vr-step-line--done' : ''}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────
const VisitorRegistrationPage = () => {
  // Read token from URL: /register?token=XXXXXXXXXXXXXXXX
  const token = new URLSearchParams(window.location.search).get('token') || '';

  // Invite details (pre-fill data from backend)
  const [invite,     setInvite]     = useState(null);   // InviteDetailsDto
  const [loadError,  setLoadError]  = useState('');     // invalid/expired token
  const [loadingInv, setLoadingInv] = useState(true);

  // Form state
  const [form,        setForm]       = useState({ name: '', email: '', phone: '', idProofType: '', idProofNumber: '' });
  const [submitting,  setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted,   setSubmitted]  = useState(false); // show success screen

  // Step: 1=loading/validating, 2=form, 3=done
  const step = loadingInv ? 1 : submitted ? 3 : 2;

  // ── On mount: validate token & pre-fill ──────────────────
  useEffect(() => {
    if (!token) {
      setLoadError('No invitation token found. Please use the link from your email.');
      setLoadingInv(false);
      return;
    }

    getInviteDetails(token)
      .then(data => {
        setInvite(data);
        // Pre-fill name and email from invitation
        setForm(f => ({
          ...f,
          name:  data.visitorName  || '',
          email: data.visitorEmail || '',
        }));
      })
      .catch(err => setLoadError(err.message || 'Invalid or expired invitation link.'))
      .finally(() => setLoadingInv(false));
  }, [token]);

  const handleChange = e =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  // ── Submit registration ───────────────────────────────────
  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitError('');

    if (!form.name.trim())         return setSubmitError('Please enter your full name.');
    if (!form.email.trim())        return setSubmitError('Please enter your email address.');
    if (!form.phone.trim())        return setSubmitError('Please enter your phone number.');
    if (!form.idProofType)         return setSubmitError('Please select an ID proof type.');
    if (!form.idProofNumber.trim())return setSubmitError('Please enter your ID proof number.');

    setSubmitting(true);
    try {
      await registerVisitor({ token, ...form });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const fmtDate = iso => {
    try { return new Date(iso).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }); }
    catch { return iso; }
  };

  // ─────────────────────────────────────────────────────────
  return (
    <div className="vr-page">

      {/* Logo */}
      <div className="vr-logo">
        <div className="vr-logo__mark">M</div>
        <div className="vr-logo__text">Metrix<span>.</span></div>
      </div>

      <Steps current={step} />

      {/* ── STATE 1: Loading ────────────────────────────── */}
      {loadingInv && (
        <div className="vr-card">
          <div className="vr-card__body" style={{ textAlign: 'center', padding: '48px 28px' }}>
            <div className="vr-spin" style={{ width: 28, height: 28, border: '3px solid rgba(78,205,196,.3)', borderTopColor: 'var(--teal)', margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>Verifying your invitation…</p>
          </div>
        </div>
      )}

      {/* ── STATE 2: Invalid / expired token ────────────── */}
      {!loadingInv && loadError && (
        <div className="vr-card">
          <div className="vr-card__body">
            <div className="vr-state">
              <span className="vr-state__icon">🔗</span>
              <div className="vr-state__title">Invalid Link</div>
              <div className="vr-state__sub">{loadError}</div>
            </div>
          </div>
        </div>
      )}

      {/* ── STATE 3: Already registered / approved / rejected ── */}
      {!loadingInv && !loadError && invite && invite.status !== 'Pending' && !submitted && (() => {
        const states = {
          Registered: { icon: '📋', title: 'Already Submitted',   sub: 'You have already completed your registration. HR will review and contact you soon.' },
          Approved:   { icon: '✅', title: 'Visit Approved',       sub: 'Your visit has been approved. Check your email for your Registration ID.' },
          Rejected:   { icon: '❌', title: 'Invitation Rejected',  sub: 'This invitation is no longer active. Please contact the HR team for more information.' },
        };
        const s = states[invite.status] || { icon: '⚠️', title: 'Link Unavailable', sub: 'This invitation link is not currently valid.' };
        return (
          <div className="vr-card">
            <div className="vr-card__body">
              <div className="vr-state">
                <span className="vr-state__icon">{s.icon}</span>
                <div className="vr-state__title">{s.title}</div>
                <div className="vr-state__sub">{s.sub}</div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── STATE 4: Show registration form ──────────────── */}
      {!loadingInv && !loadError && invite && invite.status === 'Pending' && !submitted && (
        <>
          {/* Invite banner */}
          <div className="vr-banner">
            <div className="vr-banner__eyebrow">You've been invited</div>
            <div className="vr-banner__name">Hi {invite.visitorName} 👋</div>
            <div className="vr-banner__meta">
              <strong>{invite.hrName}</strong> has invited you for <strong>{invite.purpose}</strong>
              <br />Visit date: <strong>{fmtDate(invite.visitDate)}</strong>
            </div>
          </div>

          {/* Form card */}
          <div className="vr-card">
            <div className="vr-card__head">
              <div className="vr-card__title">📝 Complete Your Registration</div>
              <div className="vr-card__sub">
                Fill in your details below. HR will review and send you a confirmation.
              </div>
            </div>
            <div className="vr-card__body">
              {submitError && (
                <div className="vr-alert vr-alert--error">⚠️ {submitError}</div>
              )}

              <form onSubmit={handleSubmit} noValidate>

                {/* Name + Email (pre-filled, editable) */}
                <div className="vr-row">
                  <div className="vr-field">
                    <label className="vr-label">Full Name <span className="vr-req">*</span></label>
                    <input
                      className="vr-input"
                      name="name"
                      placeholder="Your full name"
                      value={form.name}
                      onChange={handleChange}
                      autoComplete="name"
                    />
                  </div>
                  <div className="vr-field">
                    <label className="vr-label">Email Address <span className="vr-req">*</span></label>
                    <input
                      className="vr-input"
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      value={form.email}
                      onChange={handleChange}
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="vr-field">
                  <label className="vr-label">Phone Number <span className="vr-req">*</span></label>
                  <input
                    className="vr-input"
                    name="phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={handleChange}
                    autoComplete="tel"
                  />
                </div>

                {/* ID Proof type + number */}
                <div className="vr-row vr-row--id">
                  <div className="vr-field">
                    <label className="vr-label">ID Type <span className="vr-req">*</span></label>
                    <select
                      className="vr-select"
                      name="idProofType"
                      value={form.idProofType}
                      onChange={handleChange}
                    >
                      <option value="">Select…</option>
                      {ID_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="vr-field">
                    <label className="vr-label">ID Number <span className="vr-req">*</span></label>
                    <input
                      className="vr-input"
                      name="idProofNumber"
                      placeholder="e.g. 1234 5678 9012"
                      value={form.idProofNumber}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Read-only visit info */}
                <div className="vr-alert vr-alert--info" style={{ marginBottom: 18 }}>
                  ℹ️ <strong>Purpose:</strong> {invite.purpose} &nbsp;·&nbsp;
                  <strong>Date:</strong> {fmtDate(invite.visitDate)}
                </div>

                <button type="submit" className="vr-btn" disabled={submitting}>
                  {submitting ? <><span className="vr-spin" /> Submitting…</> : '✅ Submit Registration'}
                </button>
              </form>
            </div>
          </div>
        </>
      )}

      {/* ── STATE 5: Success screen ───────────────────────── */}
      {submitted && invite && (
        <div className="vr-card">
          <div className="vr-card__body">
            <div className="vr-success">
              <span className="vr-success__emoji">🎉</span>
              <div className="vr-success__title">Registration Complete!</div>
              <div className="vr-success__sub">
                Your details have been submitted successfully.
                The HR team will review your registration and send you a
                decision by email.
              </div>

              <div className="vr-success__box">
                <div className="vr-success__box-label">Your Submission Summary</div>
                {[
                  ['Name',       form.name],
                  ['Email',      form.email],
                  ['Phone',      form.phone],
                  ['ID Type',    ID_TYPES.find(t => t.value === form.idProofType)?.label || form.idProofType],
                  ['Purpose',    invite.purpose],
                  ['Visit Date', fmtDate(invite.visitDate)],
                  ['Invited By', invite.hrName],
                ].map(([k, v]) => (
                  <div className="vr-success__box-row" key={k}>
                    <span>{k}</span>
                    <strong>{v}</strong>
                  </div>
                ))}
              </div>

              <div className="vr-alert vr-alert--info" style={{ textAlign: 'left' }}>
                📧 HR has been notified. You will receive an email once a decision is made.
                If approved, your email will contain a <strong>Registration ID</strong> to show at security.
              </div>
            </div>
          </div>
        </div>
      )}

      <p className="vr-note">
        Metrix Visitor Management System · Your data is kept secure and used only for visit verification.
      </p>
    </div>
  );
};

export default VisitorRegistrationPage;