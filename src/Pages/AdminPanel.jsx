import React, { useState, useEffect, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import axios from 'axios';
import { 
  User, 
  LayoutDashboard, 
  Package, 
  MessageSquare,
  Tag,
  ShoppingBag,
  Settings,
  LogOut,
  ChevronRight,
  BarChart3,
  Users,
  Bell,
  HelpCircle,
  Home,
  Zap
} from 'lucide-react';
import { data, useNavigate } from 'react-router-dom';
import DashboardSection from '../components/DashboardSection';
import OrdersSection from '../components/OrdersSection';
import CustomOrdersSection from '../components/CustomOrdersSection';
import MessagesSection from '../components/MessagesSection';
import ProductsSection from '../components/ProductsSection';
import CustomersSection from '../components/CustomersSection';



const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

  :root {
    --bg-base:      #0d0f0e;
    --bg-surface:   #141714;
    --bg-raised:    #1c201c;
    --bg-hover:     #222722;
    --green:        #84e08a;
    --green-dim:    #3dba46;
    --green-glow:   rgba(132,224,138,0.12);
    --green-glow2:  rgba(132,224,138,0.06);
    --border:       #2a2f2a;
    --border-green: rgba(132,224,138,0.25);
    --text:         #e8f0e9;
    --text-muted:   #7a8a7b;
    --text-faint:   #4a554b;
    --red:          #f87171;
    --amber:        #fbbf24;
  }

  .ap-root * { box-sizing: border-box; }
  .ap-root { font-family: 'DM Sans', sans-serif; background: var(--bg-base); color: var(--text); min-height: 100vh; }

  /* ── Header ── */
  .ap-header {
    background: var(--bg-surface);
    border-bottom: 1px solid var(--border);
    position: sticky; top: 0; z-index: 50;
    backdrop-filter: blur(12px);
  }
  .ap-header-inner {
    max-width: 1280px; margin: 0 auto;
    padding: 0 1.5rem;
    height: 60px;
    display: flex; align-items: center; justify-content: space-between;
  }

  /* Logo mark */
  .ap-logo {
    display: flex; align-items: center; gap: 10px;
  }
  .ap-logo-icon {
    width: 36px; height: 36px;
    background: var(--green-glow);
    border: 1px solid var(--border-green);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
  }
  .ap-logo-icon svg { color: var(--green); }
  .ap-logo-title {
    font-family: 'Syne', sans-serif;
    font-weight: 700; font-size: 1rem;
    color: var(--text);
    letter-spacing: -0.02em;
  }
  .ap-logo-sub {
    font-size: 0.65rem;
    color: var(--text-muted);
    font-family: 'DM Mono', monospace;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  /* Header right cluster */
  .ap-header-right { display: flex; align-items: center; gap: 10px; }

  .ap-avatar-wrap { position: relative; }
  .ap-avatar {
    width: 34px; height: 34px; border-radius: 8px;
    border: 1px solid var(--border-green);
    object-fit: cover;
  }
  .ap-online-dot {
    position: absolute; bottom: -2px; right: -2px;
    width: 9px; height: 9px;
    background: var(--green); border-radius: 50%;
    border: 2px solid var(--bg-surface);
  }

  .ap-user-info { text-align: right; }
  .ap-user-name { font-size: 0.82rem; font-weight: 500; color: var(--text); }
  .ap-user-role {
    font-family: 'DM Mono', monospace;
    font-size: 0.62rem; color: var(--green); letter-spacing: 0.05em; text-transform: uppercase;
  }

  .ap-btn-ghost {
    display: flex; align-items: center; gap: 6px;
    padding: 6px 12px;
    background: transparent;
    border: 1px solid var(--border);
    color: var(--text-muted);
    border-radius: 8px;
    font-size: 0.78rem;
    cursor: pointer;
    transition: border-color .2s, color .2s, background .2s;
    font-family: 'DM Sans', sans-serif;
  }
  .ap-btn-ghost:hover {
    border-color: var(--border-green);
    color: var(--green);
    background: var(--green-glow2);
  }

  /* ── Layout ── */
  .ap-layout {
    max-width: 1280px; margin: 0 auto;
    padding: 1.5rem;
    display: grid;
    grid-template-columns: 240px 1fr;
    gap: 1.5rem;
    align-items: start;
  }

  /* ── Sidebar ── */
  .ap-sidebar {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 1.25rem;
    position: sticky; top: 76px;
  }

  /* Profile card */
  .ap-profile-card {
    background: var(--bg-raised);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1rem;
    text-align: center;
    margin-bottom: 1.25rem;
    position: relative;
    overflow: hidden;
  }
  .ap-profile-card::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent, var(--green), transparent);
  }
  .ap-profile-avatar-wrap { position: relative; display: inline-block; margin-bottom: 0.75rem; }
  .ap-profile-avatar {
    width: 64px; height: 64px; border-radius: 12px;
    border: 1px solid var(--border-green);
    object-fit: cover;
  }
  .ap-profile-badge {
    position: absolute; bottom: -4px; right: -4px;
    width: 22px; height: 22px;
    background: var(--green);
    border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    border: 2px solid var(--bg-raised);
  }
  .ap-profile-badge svg { color: #0d0f0e; width: 11px; height: 11px; }

  .ap-profile-username {
    font-family: 'DM Mono', monospace;
    font-size: 0.82rem; font-weight: 500;
    color: var(--text); margin-bottom: 2px;
  }
  .ap-profile-email {
    font-size: 0.7rem; color: var(--text-muted); margin-bottom: 0.6rem;
    word-break: break-all;
  }
  .ap-role-chip {
    display: inline-flex; align-items: center;
    padding: 3px 10px;
    background: var(--green-glow);
    border: 1px solid var(--border-green);
    border-radius: 20px;
    font-family: 'DM Mono', monospace;
    font-size: 0.62rem;
    color: var(--green);
    letter-spacing: 0.07em;
    text-transform: uppercase;
  }

  /* Nav items */
  .ap-nav { display: flex; flex-direction: column; gap: 3px; }

  .ap-nav-item {
    width: 100%;
    display: flex; align-items: center; justify-content: space-between;
    padding: 9px 12px;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 10px;
    color: var(--text-muted);
    cursor: pointer;
    transition: all .2s;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.82rem; font-weight: 500;
    text-align: left;
  }
  .ap-nav-item:hover {
    background: var(--bg-hover);
    color: var(--text);
    border-color: var(--border);
  }
  .ap-nav-item.active {
    background: var(--green-glow);
    border-color: var(--border-green);
    color: var(--green);
  }
  .ap-nav-item.active .ap-nav-icon { color: var(--green); }

  .ap-nav-left { display: flex; align-items: center; gap: 10px; }
  .ap-nav-icon {
    width: 30px; height: 30px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 7px;
    background: var(--bg-raised);
    transition: background .2s;
  }
  .ap-nav-item.active .ap-nav-icon { background: rgba(132,224,138,0.2); }
  .ap-nav-icon svg { width: 14px; height: 14px; }

  .ap-nav-badge {
    font-family: 'DM Mono', monospace;
    font-size: 0.6rem;
    background: var(--green);
    color: #0d0f0e;
    padding: 2px 6px;
    border-radius: 20px;
    font-weight: 500;
  }

  /* ── Main Content ── */
  .ap-main { min-width: 0; }

  .ap-page-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 1.25rem;
    gap: 1rem;
  }
  .ap-page-title {
    font-family: 'Syne', sans-serif;
    font-size: 1.6rem; font-weight: 700;
    color: var(--text);
    letter-spacing: -0.03em;
    margin-bottom: 2px;
  }
  .ap-page-sub {
    font-size: 0.78rem;
    color: var(--text-muted);
    font-family: 'DM Mono', monospace;
  }

  .ap-page-actions { display: flex; gap: 8px; flex-shrink: 0; }

  .ap-btn-primary {
    display: flex; align-items: center; gap: 6px;
    padding: 8px 16px;
    background: var(--green);
    color: #0d0f0e;
    border: none;
    border-radius: 8px;
    font-size: 0.78rem; font-weight: 600;
    cursor: pointer;
    transition: opacity .15s, transform .1s;
    font-family: 'DM Sans', sans-serif;
  }
  .ap-btn-primary:hover { opacity: 0.88; transform: translateY(-1px); }

  .ap-btn-outline {
    display: flex; align-items: center; gap: 6px;
    padding: 8px 16px;
    background: transparent;
    color: var(--text-muted);
    border: 1px solid var(--border);
    border-radius: 8px;
    font-size: 0.78rem; font-weight: 500;
    cursor: pointer;
    transition: border-color .2s, color .2s;
    font-family: 'DM Sans', sans-serif;
  }
  .ap-btn-outline:hover { border-color: var(--border-green); color: var(--green); }

  /* Content card */
  .ap-content-card {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 1.5rem;
    position: relative;
    overflow: hidden;
  }
  .ap-content-card::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent 10%, var(--border-green) 50%, transparent 90%);
    opacity: 0.6;
  }

  /* Mobile nav strip */
  .ap-mobile-nav {
    display: none;
    background: var(--bg-surface);
    border-bottom: 1px solid var(--border);
    padding: 8px 1rem;
    gap: 6px;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .ap-mobile-nav::-webkit-scrollbar { display: none; }

  .ap-mobile-nav-btn {
    flex-shrink: 0;
    display: flex; align-items: center; gap: 6px;
    padding: 7px 12px;
    border-radius: 8px;
    border: 1px solid transparent;
    background: transparent;
    color: var(--text-muted);
    font-size: 0.75rem; font-weight: 500;
    cursor: pointer;
    transition: all .2s;
    font-family: 'DM Sans', sans-serif;
    white-space: nowrap;
  }
  .ap-mobile-nav-btn svg { width: 14px; height: 14px; }
  .ap-mobile-nav-btn.active {
    background: var(--green-glow);
    border-color: var(--border-green);
    color: var(--green);
  }

  @media (max-width: 768px) {
    .ap-layout {
      grid-template-columns: 1fr;
      padding: 1rem;
    }
    .ap-sidebar { display: none; }
    .ap-mobile-nav { display: flex; }
    .ap-page-title { font-size: 1.25rem; }
  }
`;

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [orders, setOrders] = useState([]);
  const [adminName, setAdminName] = useState('');
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    role: 'Admin',
    avatar: 'https://img.icons8.com/fluency/96/administrator-male.png'
  });

  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    newMessages: 0,
    activeCoupons: 0,
    todayOrders: 0
  });

  const navigate = useNavigate();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error.message);
    } else {
      window.location.href = '/login';
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('business_name');
    }
  };

  const sidebarItems = [
    { id: 'dashboard',     icon: <LayoutDashboard />, label: 'Dashboard',     badge: null },
    { id: 'orders',        icon: <Package />,          label: 'Orders',        badge: stats.todayOrders > 0 ? stats.todayOrders : null },
    { id: 'products',      icon: <ShoppingBag />,      label: 'Products',      badge: null },
    { id: 'customers',     icon: <Users />,            label: 'Customers',     badge: null },
  ];

  const pageMeta = {
    dashboard:       { title: 'Dashboard',          sub: 'overview / store performance' },
    orders:          { title: 'Orders',              sub: 'manage & track customer orders' },
    'custom-orders': { title: 'Custom Orders',       sub: 'view & manage custom orders' },
    messages:        { title: 'Messages',            sub: 'communicate with customers' },
    products:        { title: 'Product Catalog',     sub: 'add, edit & manage products' },
 
    customers:       { title: 'Customers',           sub: 'view & manage customer profiles' },
  };

  const getUsernameFromEmail = (email) => {
    if (!email) return 'admin';
    return email.split('@')[0];
  };

  const renderActiveSection = () => {
    switch (activeTab) {
      case 'dashboard':     return <DashboardSection stats={stats} orders={orders} />;
      case 'orders':        return <OrdersSection />;
      case 'custom-orders': return <CustomOrdersSection />;
      case 'messages':      return <MessagesSection />;
      case 'customers':     return <CustomersSection />;
      case 'products':      return <ProductsSection />;
      default:              return <DashboardSection stats={stats} />;
    }
  };

  const meta = pageMeta[activeTab] || pageMeta.dashboard;

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      const admin_name = getUsernameFromEmail(session.user.email);
      setAdminName(admin_name);
      setProfile(prev => ({ ...prev, name: admin_name, email: session.user.email }));
    };

    fetchData();
  }, [activeTab]);

  return (
    <>
      <style>{styles}</style>
      <div className="ap-root">

        {/* ── Header ── */}
        <header className="ap-header">
          <div className="ap-header-inner">

            {/* Logo */}
            <div className="ap-logo">
              <div className="ap-logo-icon">
                <Zap size={16} />
              </div>
              <div>
                <div className="ap-logo-title">RAIJAM Admin Panel</div>
                <div className="ap-logo-sub">Store Management</div>
              </div>
            </div>

            {/* Right cluster */}
            <div className="ap-header-right">
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }} className="ap-user-info">
                <span className="ap-user-name">{profile.name || 'Admin'}</span>
                <span className="ap-user-role">{profile.role}</span>
              </div>

              <div className="ap-avatar-wrap">
                <img src={profile.avatar} alt="Admin" className="ap-avatar" />
                <div className="ap-online-dot" />
              </div>

              <button
                onClick={() => navigate('/')}
                className="ap-btn-ghost"
                style={{ display: 'none' }} /* show on desktop via media query override if needed */
              >
                <Home size={13} />
                Store
              </button>

              <button onClick={handleSignOut} className="ap-btn-ghost">
                <LogOut size={13} />
                Sign Out
              </button>
            </div>
          </div>
        </header>

        {/* ── Mobile Nav Strip ── */}
        <nav className="ap-mobile-nav">
          {sidebarItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`ap-mobile-nav-btn${activeTab === item.id ? ' active' : ''}`}
            >
              {item.icon}
              {item.label}
              {item.badge && (
                <span className="ap-nav-badge">{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        {/* ── Body ── */}
        <div className="ap-layout">

          {/* Sidebar */}
          <aside className="ap-sidebar">

            {/* Profile card */}
            <div className="ap-profile-card">
              <div className="ap-profile-avatar-wrap">
                <img src={profile.avatar} alt="Admin" className="ap-profile-avatar" />
                <div className="ap-profile-badge"><User /></div>
              </div>
              <div className="ap-profile-username">@{getUsernameFromEmail(profile.email)}</div>
              <div className="ap-profile-email">{profile.email || 'admin@store.com'}</div>
              <span className="ap-role-chip">{profile.role}</span>
            </div>

            {/* Nav */}
            <nav className="ap-nav">
              {sidebarItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`ap-nav-item${activeTab === item.id ? ' active' : ''}`}
                >
                  <div className="ap-nav-left">
                    <div className="ap-nav-icon">{item.icon}</div>
                    {item.label}
                  </div>
                  {item.badge && (
                    <span className="ap-nav-badge">{item.badge}</span>
                  )}
                </button>
              ))}
            </nav>
          </aside>

          {/* Main */}
          <main className="ap-main">
            {/* Page header */}
            <div className="ap-page-header">
              <div>
                <h1 className="ap-page-title">{meta.title}</h1>
                <p className="ap-page-sub">{meta.sub}</p>
              </div>

              {activeTab === 'dashboard' && (
                <div className="ap-page-actions">
                  <button className="ap-btn-primary">
                    <BarChart3 size={13} />
                    Generate Report
                  </button>
                  <button className="ap-btn-outline">
                    Export Data
                  </button>
                </div>
              )}
            </div>

            {/* Content card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="ap-content-card"
              >
                {renderActiveSection()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </>
  );
};

export default AdminPanel;