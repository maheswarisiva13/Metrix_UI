import React, { useState, useEffect, useCallback, useRef } from 'react';
import SecuritySidebar from '../../components/security/SecuritySidebar';
import SecurityTopbar  from '../../components/security/Securitytopbar';
import {
  getCheckedInVisitors,
  lookupVisitor,
  checkInVisitor,
  checkOutVisitor,
} from '../../utils/securityService';
import '../../styles/security/SecurityDashboard.css';

/* ── helpers ─────────────────────────────────────────────── */
const initials = (name) =>
  name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

const fmt = (iso) =>
  iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const badgeClass = (status) => {
  const s = (status || '').toLowerCase();
  if (s === 'approved') return 'sec-badge sec-badge--approved';
  if (s === 'pending')  return 'sec-badge sec-badge--pending';
  if (s === 'rejected') return 'sec-badge sec-badge--rejected';
  return 'sec-badge';
};

/* ── CheckIn Page ─────────────────────────────────────────── */
const CheckInPage = () => {
  const inputRef = useRef(null);

  const [regInput,   setRegInput]   = useState('');
  const [lookupRes,  setLookupRes]  = useState(null);
  const [lookupErr,  setLookupErr]  = useState('');
  const [looking,    setLooking]    = useState(false);
  const [actionId,   setActionId]   = useState(null);
  const [toast,      setToast]      = useState(null);
  const [insideList, setInsideList] = useState([]);
  const [loadingIn,  setLoadingIn]  = useState(true);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadInside = useCallback(async () => {
    setLoadingIn(true);
    try {
      const data = await getCheckedInVisitors();
      setInsideList(data || []);
    } finally { setLoadingIn(false); }
  }, []);

  useEffect(() => { loadInside(); }, [loadInside]);

  /* ── Lookup visitor ──────────────────────────────────────── */
  const handleLookup = async () => {
    const id = regInput.trim();
    if (!id) return;
    setLooking(true);
    setLookupErr('');
    setLookupRes(null);
    try {
      const res = await lookupVisitor(id);
      setLookupRes(res);
    } catch {
      setLookupErr('No visitor found with that Registration ID. Verify the ID and try again.');
    } finally {
      setLooking(false);
    }
  };

  /* ── Check In ────────────────────────────────────────────── */
  const handleCheckIn = async (id, name) => {
    setActionId(id);
    try {
      await checkInVisitor(id);
      showToast(`✅ ${name} has been checked in successfully.`);
      setLookupRes(null);
      setRegInput('');
      await loadInside();
      inputRef.current?.focus();
    } catch (err) {
      showToast(err.message || 'Check-in failed. Please try again.', 'error');
    } finally { setActionId(null); }
  };

  /* ── Check Out ───────────────────────────────────────────── */
  const handleCheckOut = async (id, name) => {
    setActionId(id);
    try {
      await checkOutVisitor(id);
      showToast(`🚪 ${name} has been checked out.`);
      setLookupRes(null);        // ← clears the result card
      setRegInput('');           // ← resets the input
      await loadInside();
      inputRef.current?.focus(); // ← returns focus to input
    } catch (err) {
      showToast(err.message || 'Check-out failed. Please try again.', 'error');
    } finally { setActionId(null); }
  };

  const canCheckIn = lookupRes &&
    lookupRes.status === 'Approved' &&
    !lookupRes.checkedInAt;

  const alreadyIn = lookupRes?.checkedInAt && !lookupRes?.checkedOutAt;

  return (
    <div className="sec-layout">
      <SecuritySidebar pendingCount={insideList.length} />

      <div className="sec-main">
        <SecurityTopbar
          title="Check In / Check Out"
          breadcrumb="Security / Check In"
        />

        <div className="sec-page-content">

          {/* Toast */}
          {toast && (
            <div className={`sec-toast sec-toast--${toast.type}`}>{toast.msg}</div>
          )}

          <div className="sec-page-header">
            <div>
              <div className="sec-page-header__title">🔍 Visitor Check In / Out</div>
              <div className="sec-page-header__sub">
                Enter a Registration ID to look up and check in or check out a visitor
              </div>
            </div>
          </div>

          {/* ── Two column layout ─────────────────────── */}
          <div className="sec-two-col" style={{ alignItems: 'start' }}>

            {/* LEFT: Lookup panel */}
            <div>
              <div className="sec-card">
                <div className="sec-card__head">
                  <span className="sec-card__title">🪪 Lookup by Registration ID</span>
                </div>

                {/* Input row */}
                <div className="sec-lookup">
                  <input
                    ref={inputRef}
                    className="sec-lookup__input"
                    placeholder="Enter Registration ID  (e.g. VIS-2026-0001)"
                    value={regInput}
                    onChange={e => setRegInput(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && handleLookup()}
                    autoFocus
                  />
                  <button
                    className="sec-lookup__btn"
                    onClick={handleLookup}
                    disabled={looking || !regInput.trim()}
                  >
                    {looking ? <span className="sec-spin" /> : '🔍 Lookup'}
                  </button>
                </div>

                {/* Error */}
                {lookupErr && (
                  <div style={{ padding: '16px 20px' }}>
                    <div className="sec-inline-alert sec-inline-alert--error">
                      ❌ {lookupErr}
                    </div>
                  </div>
                )}

                {/* Result card */}
                {lookupRes && (
                  <div className="sec-result" style={{ margin: '16px 20px' }}>
                    <div className="sec-result__header">
                      <div className="sec-visitor-avatar" style={{ width: 36, height: 36, fontSize: '0.75rem', flexShrink: 0 }}>
                        {initials(lookupRes.name)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{lookupRes.name}</div>
                        <div style={{ opacity: 0.7, fontSize: '0.8rem', fontFamily: 'inherit', fontWeight: 400 }}>
                          {lookupRes.purpose}
                        </div>
                      </div>
                      <span className={badgeClass(lookupRes.status)} style={{ marginLeft: 'auto' }}>
                        {lookupRes.status}
                      </span>
                    </div>

                    <div className="sec-result__body">
                      {[
                        ['Registration ID', <span style={{ fontFamily: 'Courier New, monospace', fontWeight: 800, color: 'var(--teal-dark)' }}>{lookupRes.registrationId}</span>],
                        ['Visit Date',      fmtDate(lookupRes.visitDate)],
                        ['Phone',           lookupRes.phone || '—'],
                        ['ID Proof',        lookupRes.idProofType || '—'],
                        ['Invited By',      lookupRes.hrName || '—'],
                        ['Company / Email', lookupRes.email || '—'],
                      ].map(([label, val]) => (
                        <div className="sec-result__field" key={label}>
                          <label>{label}</label>
                          <span>{val}</span>
                        </div>
                      ))}
                    </div>

                    {/* Status context */}
                    {lookupRes.status === 'Pending' && (
                      <div style={{ padding: '10px 18px', background: '#fffbeb', borderTop: '1px solid var(--border-color)' }}>
                        <div className="sec-inline-alert sec-inline-alert--warning">
                          ⚠️ This visitor is still pending HR approval. Cannot check in yet.
                        </div>
                      </div>
                    )}
                    {lookupRes.status === 'Rejected' && (
                      <div style={{ padding: '10px 18px', background: '#fef2f2', borderTop: '1px solid var(--border-color)' }}>
                        <div className="sec-inline-alert sec-inline-alert--error">
                          ❌ This visitor's request was rejected. Entry not permitted.
                        </div>
                      </div>
                    )}
                    {alreadyIn && (
                      <div style={{ padding: '10px 18px', background: '#f0fdf4', borderTop: '1px solid var(--border-color)' }}>
                        <div className="sec-inline-alert sec-inline-alert--success">
                          ✅ Visitor is currently inside. Checked in at {fmt(lookupRes.checkedInAt)}.
                        </div>
                      </div>
                    )}
                    {lookupRes.checkedOutAt && (
                      <div style={{ padding: '10px 18px', background: '#f8fafc', borderTop: '1px solid var(--border-color)' }}>
                        <div className="sec-inline-alert sec-inline-alert--info">
                          🚪 Visitor already checked out at {fmt(lookupRes.checkedOutAt)}.
                        </div>
                      </div>
                    )}

                    <div className="sec-result__actions">
                      <button
                        style={{ padding: '8px 18px', background: '#e2e8f0', color: 'var(--text-mid)', borderRadius: 8, fontSize: '0.82rem', fontWeight: 700 }}
                        onClick={() => { setLookupRes(null); setRegInput(''); inputRef.current?.focus(); }}
                      >
                        ✕ Clear
                      </button>

                      {alreadyIn && (
                        <button
                          className="sec-btn-check-out"
                          onClick={() => handleCheckOut(lookupRes.id, lookupRes.name)}
                          disabled={actionId === lookupRes.id}
                        >
                          {actionId === lookupRes.id
                            ? <><span className="sec-spin" /> Processing…</>
                            : '🚪 Check Out'}
                        </button>
                      )}

                      {canCheckIn && (
                        <button
                          className="sec-btn-check-in"
                          style={{ padding: '8px 22px' }}
                          onClick={() => handleCheckIn(lookupRes.id, lookupRes.name)}
                          disabled={actionId === lookupRes.id}
                        >
                          {actionId === lookupRes.id
                            ? <><span className="sec-spin" /> Checking In…</>
                            : '✅ Check In'}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Idle hint */}
                {!lookupRes && !lookupErr && (
                  <div className="sec-empty">
                    <div className="sec-empty__icon">🪪</div>
                    <div className="sec-empty__title">Type a Registration ID</div>
                    <div>Only HR-approved visitors can be checked in</div>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: Currently inside */}
            <div>
              <div className="sec-card">
                <div className="sec-card__head">
                  <span className="sec-card__title">
                    🏢 Currently Inside
                    {insideList.length > 0 && (
                      <span className="sec-sidebar__badge" style={{ background: 'var(--success)', marginLeft: 6 }}>
                        {insideList.length}
                      </span>
                    )}
                  </span>
                  <button
                    style={{ fontSize: '0.78rem', color: 'var(--teal-dark)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
                    onClick={loadInside}
                  >
                    ↻ Refresh
                  </button>
                </div>

                {loadingIn ? (
                  <div className="sec-empty">
                    <span className="sec-spin sec-spin--lg" />
                    <div style={{ marginTop: 10 }}>Loading…</div>
                  </div>
                ) : insideList.length === 0 ? (
                  <div className="sec-empty">
                    <div className="sec-empty__icon">🏢</div>
                    <div className="sec-empty__title">Building is clear</div>
                    <div>No visitors currently inside</div>
                  </div>
                ) : (
                  insideList.map(v => (
                    <div className="sec-visitor-row" key={v.id}>
                      <div className="sec-visitor-avatar">{initials(v.name)}</div>
                      <div className="sec-visitor-info">
                        <div className="sec-visitor-name">{v.name}</div>
                        <div className="sec-visitor-meta">
                          {v.purpose} · In since {fmt(v.checkedInAt)}
                        </div>
                      </div>
                      <span className="sec-visitor-reg">{v.registrationId}</span>
                      <div className="sec-visitor-actions">
                        <button
                          className="sec-btn-check-out"
                          onClick={() => handleCheckOut(v.id, v.name)}
                          disabled={actionId === v.id}
                        >
                          {actionId === v.id ? '…' : '🚪 Out'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckInPage;