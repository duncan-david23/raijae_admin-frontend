import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight, Eye, EyeOff, Mail, Lock,
  ShoppingBag, Package, BarChart3, Users,
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import axios from 'axios';

const AdminLogin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [msg, setMsg]                   = useState('');
  const [formData, setFormData]         = useState({ email: '', password: '' });
  const [isLoading, setIsLoading]       = useState(false);

  const navigate = useNavigate();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (msg) setMsg('');
  };

  const checkUserRole = async (userId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await axios.get('https://raijae-backend.onrender.com/api/users/profile/check-role', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        return response.data.role;
      }
      return null;
    } catch (error) {
      console.error('Error checking role:', error);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email:    formData.email,
        password: formData.password,
      });
      
      if (error) { 
        setMsg(error.message); 
        setIsLoading(false);
        return; 
      }
      
      const userId = data.user?.id;
      if (!userId) {
        setMsg('Error: Could not retrieve user information.');
        setIsLoading(false);
        return;
      }

      // Check user role
      const userRole = await checkUserRole(userId);
      
      if (userRole !== 'admin') {
        // Sign out immediately if not admin
        await supabase.auth.signOut();
        setMsg('Access Denied: You do not have admin privileges.');
        setIsLoading(false);
        return;
      }

      navigate('/admin-panel');
    } catch (error) {
      console.error('Error signing in:', error);
      setMsg('An error occurred. Please check your details and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const FEATURES = [
    { icon: BarChart3, label: 'Dashboard',  desc: 'Real-time store analytics' },
    { icon: Package,   label: 'Orders',     desc: 'Manage & track all orders' },
    { icon: ShoppingBag, label: 'Products', desc: 'Full catalogue management' },
    { icon: Users,     label: 'Customers',  desc: 'Customer profiles & data'  },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,500&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        img { display: block; }

        :root {
          --bg:      #f5f5f3;
          --white:   #ffffff;
          --ink:     #111111;
          --ink2:    #444444;
          --muted:   #888888;
          --faint:   #cccccc;
          --line:    #e4e4e4;
          --line2:   #d0d0d0;
          --hover:   #f0f0f0;
        }

        .al-page {
          min-height: 100vh;
          background: var(--bg);
          font-family: 'DM Sans', sans-serif;
          color: var(--ink);
          display: flex;
          flex-direction: column;
        }

        /* ── HEADER ── */
        .al-header {
          height: 58px;
          background: var(--white);
          border-bottom: 1px solid var(--line);
          display: flex; align-items: center;
          padding: 0 32px;
          gap: 10px;
        }
        @media(max-width:480px){ .al-header { padding: 0 16px; } }

        .al-brand {
          font-family: 'Playfair Display', serif;
          font-size: 19px; font-weight: 900;
          letter-spacing: -0.02em; color: var(--ink);
          text-decoration: none;
        }
        .al-brand-badge {
          font-family: 'DM Mono', monospace;
          font-size: 9px; font-weight: 500;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--muted); padding: 2px 8px;
          border: 1px solid var(--line); border-radius: 4px;
        }
        .al-header-right {
          margin-left: auto;
        }
        .al-back-link {
          font-size: 12px; color: var(--muted);
          text-decoration: none; letter-spacing: 0.04em;
          transition: color .15s;
        }
        .al-back-link:hover { color: var(--ink); }

        /* ── GRID ── */
        .al-grid {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 1fr;
        }
        @media(max-width:768px){ .al-grid { grid-template-columns: 1fr; } }

        /* ── LEFT — FORM ── */
        .al-form-side {
          display: flex; flex-direction: column;
          justify-content: center; align-items: center;
          padding: 48px 40px;
          background: var(--white);
          border-right: 1px solid var(--line);
          position: relative; overflow: hidden;
        }
        @media(max-width:480px){ .al-form-side { padding: 36px 20px; } }

        /* ghost watermark */
        .al-form-side::after {
          content: 'RAIJAM';
          position: absolute; bottom: -20px; left: -10px;
          font-family: 'Playfair Display', serif;
          font-size: 100px; font-weight: 900;
          letter-spacing: -0.04em;
          color: rgba(0,0,0,0.03);
          pointer-events: none; user-select: none;
          white-space: nowrap;
        }

        .al-form-wrap {
          width: 100%; max-width: 360px;
          position: relative; z-index: 2;
        }

        .al-form-eyebrow {
          font-family: 'DM Mono', monospace;
          font-size: 9.5px; font-weight: 700;
          letter-spacing: 0.2em; text-transform: uppercase;
          color: var(--muted); margin-bottom: 10px;
        }
        .al-form-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(26px, 4vw, 34px); font-weight: 900;
          letter-spacing: -0.03em; color: var(--ink);
          line-height: 0.95; margin-bottom: 6px;
        }
        .al-form-title em { font-style: italic; font-weight: 500; }
        .al-form-sub {
          font-size: 12.5px; color: var(--muted); margin-bottom: 36px;
        }

        /* error */
        .al-error {
          background: rgba(220,38,38,0.07);
          border: 1px solid rgba(220,38,38,0.2);
          border-radius: 8px; padding: 10px 14px;
          font-size: 12px; color: #dc2626;
          margin-bottom: 18px; letter-spacing: 0.02em;
        }

        /* fields */
        .al-field { position: relative; margin-bottom: 14px; }
        .al-field-icon {
          position: absolute; left: 13px; top: 50%;
          transform: translateY(-50%); color: var(--faint);
          pointer-events: none;
        }
        .al-input {
          width: 100%; background: var(--bg);
          border: 1px solid var(--line); border-radius: 8px;
          padding: 12px 42px 12px 40px;
          font-size: 13px; font-family: 'DM Sans', sans-serif;
          color: var(--ink); outline: none;
          transition: border-color .18s;
        }
        .al-input::placeholder { color: var(--faint); }
        .al-input:focus { border-color: var(--line2); background: var(--white); }

        .al-eye {
          position: absolute; right: 12px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: var(--muted); padding: 4px;
          display: flex; align-items: center;
          transition: color .16s;
        }
        .al-eye:hover { color: var(--ink); }

        /* submit */
        .al-submit {
          width: 100%; background: var(--ink); color: #fff;
          border: none; border-radius: 8px;
          padding: 13px 24px; margin-top: 6px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; font-weight: 700;
          letter-spacing: 0.12em; text-transform: uppercase;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: opacity .18s;
        }
        .al-submit:hover:not(:disabled) { opacity: .82; }
        .al-submit:disabled { opacity: .45; cursor: not-allowed; }

        .al-spin {
          width: 14px; height: 14px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          animation: al-spin .6s linear infinite;
        }
        @keyframes al-spin { to { transform: rotate(360deg); } }

        .al-divider {
          display: flex; align-items: center; gap: 10px;
          margin: 20px 0 0;
        }
        .al-divider-line { flex: 1; height: 1px; background: var(--line); }
        .al-divider-txt { font-size: 10.5px; color: var(--faint); letter-spacing: 0.06em; }

        .al-store-link {
          display: block; text-align: center; margin-top: 14px;
          font-size: 11.5px; color: var(--muted); letter-spacing: 0.04em;
          text-decoration: none; transition: color .15s;
        }
        .al-store-link:hover { color: var(--ink); }
        .al-store-link span {
          color: var(--ink); font-weight: 700;
          border-bottom: 1.5px solid var(--ink); padding-bottom: 1px;
        }

        /* ── RIGHT — DARK PANEL ── */
        .al-panel {
          background: linear-gradient(145deg, #1a1a18 0%, #2e2e2b 55%, #1c1c1a 100%);
          display: flex; flex-direction: column;
          justify-content: space-between;
          padding: 52px 56px; position: relative; overflow: hidden;
        }
        @media(max-width:768px){ .al-panel { display: none; } }

        .al-panel::before {
          content: '';
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse at 70% 60%, rgba(200,185,160,0.08) 0%, transparent 60%),
            radial-gradient(ellipse at 20% 20%, rgba(255,255,255,0.03) 0%, transparent 50%);
        }
        .al-panel-orb {
          position: absolute; left: -80px; top: 50%; transform: translateY(-50%);
          width: 380px; height: 380px; border-radius: 50%;
          background: radial-gradient(circle at 60% 34%, rgba(255,255,255,0.05) 0%, transparent 70%);
          border: 1px solid rgba(255,255,255,0.05);
        }

        .al-panel-brand {
          position: relative; z-index: 2;
        }
        .al-panel-name {
          font-family: 'Playfair Display', serif;
          font-size: 15px; font-weight: 900;
          letter-spacing: 0.18em; color: #f0f0f0;
          margin-bottom: 5px;
        }
        .al-panel-tagline {
          font-size: 11px; color: rgba(255,255,255,0.3);
          font-style: italic; letter-spacing: 0.04em;
        }

        .al-panel-mid {
          position: relative; z-index: 2;
        }
        .al-panel-rule {
          width: 28px; height: 2px;
          background: rgba(200,185,160,0.5);
          margin-bottom: 20px;
        }
        .al-panel-quote {
          font-family: 'Playfair Display', serif;
          font-size: clamp(18px, 2.2vw, 24px); font-weight: 300;
          color: rgba(255,255,255,0.8); line-height: 1.5;
          letter-spacing: -0.01em; margin-bottom: 28px;
        }

        /* feature list */
        .al-features { display: flex; flex-direction: column; gap: 10px; }
        .al-feature {
          display: flex; align-items: center; gap: 12px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px; padding: 12px 14px;
        }
        .al-feature-icon {
          width: 32px; height: 32px; border-radius: 8px;
          background: rgba(255,255,255,0.08);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; color: rgba(255,255,255,0.6);
        }
        .al-feature-label {
          font-size: 12.5px; font-weight: 600; color: rgba(255,255,255,0.8);
          margin-bottom: 1px;
        }
        .al-feature-desc {
          font-size: 10.5px; color: rgba(255,255,255,0.3);
          font-family: 'DM Mono', monospace; letter-spacing: 0.03em;
        }

        .al-panel-foot {
          position: relative; z-index: 2;
          font-family: 'DM Mono', monospace;
          font-size: 9.5px; color: rgba(255,255,255,0.2);
          letter-spacing: 0.1em; text-transform: uppercase;
          line-height: 1.8;
        }
      `}</style>

      <div className="al-page">

        {/* ── HEADER ── */}
        <header className="al-header">
          <Link to="/" className="al-brand">RAIJAM</Link>
          <span className="al-brand-badge">Admin</span>
        </header>

        {/* ── GRID ── */}
        <div className="al-grid">

          {/* FORM SIDE */}
          <div className="al-form-side">
            <div className="al-form-wrap">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <p className="al-form-eyebrow">Admin Portal</p>
                <h1 className="al-form-title">
                  Welcome<br /><em>back.</em>
                </h1>
                <p className="al-form-sub">Sign in to manage your Raijam store.</p>

                {msg && <div className="al-error">{msg}</div>}

                <form onSubmit={handleSubmit} noValidate>

                  {/* Email */}
                  <motion.div
                    className="al-field"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.45 }}
                  >
                    <Mail size={15} strokeWidth={1.8} className="al-field-icon" />
                    <input
                      type="email"
                      className="al-input"
                      placeholder="Email address"
                      value={formData.email}
                      onChange={e => handleInputChange('email', e.target.value)}
                      autoComplete="email"
                      required
                    />
                  </motion.div>

                  {/* Password */}
                  <motion.div
                    className="al-field"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.22, duration: 0.45 }}
                  >
                    <Lock size={15} strokeWidth={1.8} className="al-field-icon" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="al-input"
                      placeholder="Password"
                      value={formData.password}
                      onChange={e => handleInputChange('password', e.target.value)}
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      className="al-eye"
                      onClick={() => setShowPassword(v => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword
                        ? <EyeOff size={15} strokeWidth={1.5} />
                        : <Eye    size={15} strokeWidth={1.5} />
                      }
                    </button>
                  </motion.div>

                  {/* Submit */}
                  <motion.button
                    type="submit"
                    className="al-submit"
                    disabled={isLoading}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.42 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isLoading
                      ? <><div className="al-spin" /> Please wait…</>
                      : <>Sign In <ArrowRight size={14} strokeWidth={2.5} /></>
                    }
                  </motion.button>
                </form>

                <div className="al-divider">
                  <div className="al-divider-line" />
                  <span className="al-divider-txt">Raijam Admin</span>
                  <div className="al-divider-line" />
                </div>

              </motion.div>
            </div>
          </div>

          {/* DARK PANEL */}
          <div className="al-panel">
            <div className="al-panel-orb" />

            <div className="al-panel-brand">
              <div className="al-panel-name">RAIJAM</div>
              <div className="al-panel-tagline">Curated Luxury for the Modern Home.</div>
            </div>

            <div className="al-panel-mid">
              <div className="al-panel-rule" />
              <p className="al-panel-quote">
                "Everything you need to run Raijam Store — in one place."
              </p>

              <div className="al-features">
                {FEATURES.map(({ icon: Icon, label, desc }, i) => (
                  <motion.div
                    key={label}
                    className="al-feature"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.08, duration: 0.4 }}
                  >
                    <div className="al-feature-icon"><Icon size={15} strokeWidth={1.5} /></div>
                    <div>
                      <div className="al-feature-label">{label}</div>
                      <div className="al-feature-desc">{desc}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="al-panel-foot">
              Raijam Admin Portal<br />
              Secure · Encrypted · Always On
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default AdminLogin;