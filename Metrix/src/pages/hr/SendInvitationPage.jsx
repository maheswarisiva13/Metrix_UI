import React, { useState } from 'react';
import HRSidebar  from '../../components/hr/HRSidebar';
import HRTopbar   from '../../components/hr/HRTopbar';
import { sendInvitation } from '../../utils/hrService';
import '../../styles/hr/HRDashboard.css';

const PURPOSES = ['Meeting', 'Interview', 'Audit', 'Delivery', 'Vendor Visit', 'Training', 'Demo', 'Other'];

const today = new Date().toISOString().split('T')[0];

const SendInvitationPage = () => {
  const [form, setForm] = useState({
    visitorName: '', visitorEmail: '', purpose: '', visitDate: '',
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [result,  setResult]  = useState(null);  // { token, inviteLink }

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (form.visitDate < today) { setError('Visit date cannot be in the past.'); return; }
    setLoading(true);
    try {
      const data = await sendInvitation(form);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Failed to send invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setForm({ visitorName:'', visitorEmail:'', purpose:'', visitDate:'', notes:'' });
  };

  return (
    <div className="hr-layout">
      <HRSidebar />

      <div className="hr-main">
        <HRTopbar title="Send Invitation" breadcrumb="HR Portal / Send Invitation" />

        <div className="page-content">
          <div className="page-header">
            <div>
              <div className="page-header__title">✉️ Send Visitor Invitation</div>
              <div className="page-header__sub">
                A unique registration link will be emailed to the visitor
              </div>
            </div>
          </div>

          <div className="two-col" style={{ alignItems:'start' }}>

            {/* ── Form card ──────────────────────────── */}
            <div className="content-card">
              <div className="content-card__head">
                <span className="content-card__title">Invitation Details</span>
              </div>
              <div className="content-card__body">

                {result ? (
                  /* ── Success state ─────────────────── */
                  <div style={{ textAlign:'center', padding:'20px 0' }}>
                    <div style={{ fontSize:'3.5rem', marginBottom:16 }}>🎉</div>
                    <h3 style={{ fontFamily:'var(--font-heading)', fontSize:'1.3rem', fontWeight:900, color:'var(--text-dark)', marginBottom:8 }}>
                      Invitation Sent!
                    </h3>
                    <p style={{ color:'var(--text-mid)', fontSize:'0.88rem', marginBottom:24 }}>
                      An email has been sent to <strong>{form.visitorEmail}</strong> with a registration link.
                    </p>

                    {/* Invite link box */}
                    <div style={{
                      background:'var(--teal-soft)', border:'1.5px solid var(--teal)',
                      borderRadius:12, padding:'14px 16px', marginBottom:24,
                      textAlign:'left', wordBreak:'break-all',
                    }}>
                      <div style={{ fontSize:'0.7rem', fontWeight:700, color:'var(--teal-dark)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>
                        Registration Link
                      </div>
                      <code style={{ fontSize:'0.78rem', color:'var(--teal-dark)' }}>
                        {result.inviteLink}
                      </code>
                      <button
                        style={{ marginTop:10, display:'block', fontSize:'0.78rem', color:'var(--teal-dark)', fontWeight:700, background:'none', border:'none', cursor:'pointer', textDecoration:'underline' }}
                        onClick={() => navigator.clipboard.writeText(result.inviteLink)}
                      >
                        📋 Copy link
                      </button>
                    </div>

                    <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
                      <button className="btn btn--primary" onClick={handleReset}>
                        + Send Another
                      </button>
                    </div>
                  </div>

                ) : (
                  /* ── Form ──────────────────────────── */
                  <form onSubmit={handleSubmit} noValidate>
                    {error && (
                      <div className="alert alert--error">⚠️ {error}</div>
                    )}

                    <div className="field-group">
                      <label className="field-label">Visitor's Full Name *</label>
                      <input
                        className="field-input"
                        type="text"
                        name="visitorName"
                        placeholder="John Doe"
                        value={form.visitorName}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="field-group">
                      <label className="field-label">Visitor's Email *</label>
                      <input
                        className="field-input"
                        type="email"
                        name="visitorEmail"
                        placeholder="john@company.com"
                        value={form.visitorEmail}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="field-row">
                      <div className="field-group">
                        <label className="field-label">Purpose of Visit *</label>
                        <select
                          className="field-select"
                          name="purpose"
                          value={form.purpose}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Select purpose…</option>
                          {PURPOSES.map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>

                      <div className="field-group">
                        <label className="field-label">Visit Date *</label>
                        <input
                          className="field-input"
                          type="date"
                          name="visitDate"
                          value={form.visitDate}
                          onChange={handleChange}
                          min={today}
                          required
                        />
                      </div>
                    </div>

                    <div className="field-group">
                      <label className="field-label">Notes (optional)</label>
                      <textarea
                        className="field-textarea"
                        name="notes"
                        placeholder="Any special instructions or additional details…"
                        value={form.notes}
                        onChange={handleChange}
                        rows={3}
                      />
                    </div>

                    <div className="alert alert--info" style={{ marginBottom:0 }}>
                      ℹ️ The visitor will receive an email with a unique link to complete their registration. The link expires in 7 days.
                    </div>

                    <button
                      type="submit"
                      className="btn btn--primary"
                      disabled={loading}
                      style={{ width:'100%', justifyContent:'center', marginTop:18, padding:'12px' }}
                    >
                      {loading ? <span className="spin" /> : '✉️'}
                      {loading ? 'Sending…' : 'Send Invitation Email'}
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* ── Info / instructions card ────────────── */}
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div className="content-card">
                <div className="content-card__head">
                  <span className="content-card__title">📋 How it works</span>
                </div>
                <div className="content-card__body" style={{ display:'flex', flexDirection:'column', gap:14 }}>
                  {[
                    { step:'1', icon:'✉️', title:'You send the invite',     desc:'Fill in visitor details and click Send. A unique link is generated.' },
                    { step:'2', icon:'📝', title:'Visitor registers',        desc:'They click the link and fill their details — name, ID, photo.' },
                    { step:'3', icon:'✅', title:'You approve or reject',    desc:'Review their info in Pending Approvals and make a decision.' },
                    { step:'4', icon:'🏢', title:'Visitor arrives',          desc:'Security checks their Registration ID at entry.' },
                  ].map(item => (
                    <div key={item.step} style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                      <div style={{
                        width:32, height:32, borderRadius:'50%',
                        background:'var(--teal-soft)', border:'2px solid var(--teal)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontFamily:'var(--font-heading)', fontWeight:800, fontSize:'0.8rem', color:'var(--teal-dark)',
                        flexShrink:0,
                      }}>
                        {item.step}
                      </div>
                      <div>
                        <div style={{ fontWeight:700, fontSize:'0.88rem', color:'var(--text-dark)' }}>
                          {item.icon} {item.title}
                        </div>
                        <div style={{ fontSize:'0.8rem', color:'var(--text-light)', marginTop:2, lineHeight:1.5 }}>
                          {item.desc}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default SendInvitationPage;