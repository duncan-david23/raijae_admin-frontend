import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Search, User, Mail, Phone, Calendar, DollarSign,
  Package, ShoppingBag, ChevronRight, Download, Printer,
  Filter, X, Eye, TrendingUp, UserCheck, UserX,
  Crown, Star, Clock, ArrowUp, ArrowDown
} from 'lucide-react'
import axios from 'axios'
import { supabase } from '../lib/supabaseClient'

const API_BASE_URL = 'http://172.20.10.3:5000/api/users'

const SORTS = [
  { v: 'newest', l: 'Newest First' },
  { v: 'oldest', l: 'Oldest First' },
  { v: 'spent-hi', l: 'Highest Spent' },
  { v: 'spent-lo', l: 'Lowest Spent' },
  { v: 'orders-hi', l: 'Most Orders' },
  { v: 'orders-lo', l: 'Least Orders' },
]

const ROLE_CONFIG = {
  customer: { color: '#4ade80', bg: 'rgba(74,222,128,0.1)', icon: User, label: 'Customer' },
  admin: { color: '#c084fc', bg: 'rgba(192,132,252,0.1)', icon: Crown, label: 'Admin' },
  default: { color: '#888', bg: 'rgba(136,136,136,0.1)', icon: User, label: 'User' },
}

const staggerAnim = (i) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.03, duration: 0.32, ease: [0.22, 1, 0.36, 1] },
})

export default function CustomersSection() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [sort, setSort] = useState('newest')
  const [expandedCustomer, setExpandedCustomer] = useState(null)

  const fmt = (n) => `GHC ${Number(n).toFixed(2)}`
  const fmtDate = (d) => {
    try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }
    catch { return d }
  }

  // Fetch customers
  const fetchCustomers = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Please log in to view customers')
        setLoading(false)
        return
      }

      const response = await axios.get(
        `${API_BASE_URL}/profile/get-all-profiles`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          }
        }
      )
      
      

      if (response.data.customers && Array.isArray(response.data.customers)) {
        setCustomers(response.data.customers)
      }
    } catch (err) {
      console.error("Error fetching customers:", err)
      setError(err.response?.data?.error || "Failed to load customers")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  // Filter and sort customers
  const filtered = useMemo(() => {
    let r = [...customers]
    
    // Filter by role
    if (roleFilter !== 'All') {
      r = r.filter(c => c.role === roleFilter.toLowerCase())
    }
    
    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase()
      r = r.filter(c =>
        c.full_name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone_number?.includes(q)
      )
    }
    
    // Sort
    if (sort === 'newest') {
      r.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    } else if (sort === 'oldest') {
      r.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    } else if (sort === 'spent-hi') {
      r.sort((a, b) => (b.total_spent || 0) - (a.total_spent || 0))
    } else if (sort === 'spent-lo') {
      r.sort((a, b) => (a.total_spent || 0) - (b.total_spent || 0))
    } else if (sort === 'orders-hi') {
      r.sort((a, b) => (b.total_orders || 0) - (a.total_orders || 0))
    } else if (sort === 'orders-lo') {
      r.sort((a, b) => (a.total_orders || 0) - (b.total_orders || 0))
    }
    
    return r
  }, [customers, roleFilter, search, sort])

  // Stats
  const stats = useMemo(() => ({
    total: customers.length,
    customers: customers.filter(c => c.role === 'customer').length,
    admins: customers.filter(c => c.role === 'admin').length,
    totalSpent: customers.reduce((sum, c) => sum + (c.total_spent || 0), 0),
    totalOrders: customers.reduce((sum, c) => sum + (c.total_orders || 0), 0),
  }), [customers])

  const exportCSV = () => {
    const rows = [
      ['Name', 'Email', 'Phone', 'Role', 'Joined Date', 'Total Orders', 'Total Spent'],
      ...filtered.map(c => [
        c.full_name || 'N/A',
        c.email,
        c.phone_number || 'N/A',
        c.role,
        fmtDate(c.created_at),
        c.total_orders || 0,
        c.total_spent || 0
      ])
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const a = document.createElement('a')
    a.href = 'data:text/csv,' + encodeURIComponent(csv)
    a.download = `raijam_customers_${new Date().toISOString().slice(0,10)}.csv`
    a.click()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-sm">Loading customers...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-16 bg-surface border border-line rounded-xl">
        <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
          <X size={20} className="text-red-400" />
        </div>
        <p className="text-gray-400">{error}</p>
        <button 
          onClick={fetchCustomers}
          className="mt-4 px-4 py-2 bg-gray-800 text-white rounded-lg text-sm hover:bg-gray-700"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

        :root {
          --bg:      #0e0e0e;
          --surface: #161616;
          --raised:  #1e1e1e;
          --hover:   #252525;
          --line:    #2a2a2a;
          --line2:   #333;
          --text:    #f0f0f0;
          --muted:   #888;
          --faint:   #444;
          --white:   #ffffff;
        }

        .cs {
          background: var(--bg);
          color: var(--text);
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          padding: 32px 36px 80px;
        }
        @media(max-width:640px){ .cs { padding: 20px 16px 60px; } }

        .cs-header {
          display: flex; align-items: flex-start;
          justify-content: space-between; gap: 16px;
          margin-bottom: 28px; flex-wrap: wrap;
        }
        .cs-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(22px, 3vw, 30px);
          font-weight: 900; letter-spacing: -0.03em;
          color: var(--white); line-height: 1; margin-bottom: 5px;
        }
        .cs-subtitle {
          font-family: 'DM Mono', monospace;
          font-size: 10.5px; color: var(--faint);
          letter-spacing: 0.1em; text-transform: uppercase;
        }
        .cs-ts {
          font-family: 'DM Mono', monospace;
          font-size: 10.5px; color: var(--faint);
          align-self: flex-end;
        }

        .cs-label {
          font-family: 'DM Mono', monospace;
          font-size: 9.5px; letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--faint); margin-bottom: 12px;
          display: flex; align-items: center; gap: 8px;
        }
        .cs-label::after { content: ''; flex: 1; height: 1px; background: var(--line); }

        .cs-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px; margin-bottom: 28px;
        }
        @media(max-width:900px){ .cs-stats { grid-template-columns: repeat(2, 1fr); } }

        .cs-stat {
          background: var(--surface); border: 1px solid var(--line);
          border-radius: 12px; padding: 18px 20px;
          transition: border-color .2s;
        }
        .cs-stat:hover { border-color: var(--line2); }
        .cs-stat-top {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 12px;
        }
        .cs-stat-icon {
          width: 32px; height: 32px; border-radius: 8px;
          background: rgba(255,255,255,0.05); border: 1px solid var(--line2);
          display: flex; align-items: center; justify-content: center;
          color: var(--muted);
        }
        .cs-stat-val {
          font-family: 'Playfair Display', serif;
          font-size: 26px; font-weight: 700;
          color: var(--white); line-height: 1; margin-bottom: 4px;
        }
        .cs-stat-name { font-size: 12px; font-weight: 500; color: var(--muted); margin-bottom: 2px; }
        .cs-stat-desc { font-family: 'DM Mono', monospace; font-size: 9.5px; color: var(--faint); }

        .cs-toolbar {
          background: var(--surface); border: 1px solid var(--line);
          border-radius: 12px; padding: 14px 16px;
          margin-bottom: 16px;
        }
        .cs-search-wrap {
          position: relative; margin-bottom: 12px;
        }
        .cs-search-icon {
          position: absolute; left: 12px; top: 50%;
          transform: translateY(-50%); color: var(--faint);
        }
        .cs-search {
          width: 100%; padding: 10px 12px 10px 38px;
          background: var(--raised); border: 1px solid var(--line);
          border-radius: 8px; font-size: 13px;
          color: var(--text); outline: none;
        }
        .cs-search::placeholder { color: var(--faint); }
        .cs-search:focus { border-color: var(--line2); }

        .cs-filter-row {
          display: flex; align-items: center;
          gap: 8px; flex-wrap: wrap;
        }
        .cs-role-pill {
          display: flex; align-items: center; gap: 5px;
          padding: 5px 13px; border-radius: 100px;
          font-size: 11px; font-weight: 600;
          cursor: pointer; border: 1px solid var(--line);
          background: transparent; color: var(--muted);
          transition: all .16s;
        }
        .cs-role-pill:hover { color: var(--text); border-color: var(--line2); }
        .cs-role-pill.on { background: var(--raised); color: var(--white); border-color: var(--line2); }
        .cs-role-dot { width: 6px; height: 6px; border-radius: 50%; }

        .cs-sort {
          margin-left: auto; flex-shrink: 0;
          padding: 6px 12px; background: var(--raised);
          border: 1px solid var(--line); border-radius: 8px;
          font-size: 11.5px; font-family: 'DM Mono', monospace;
          color: var(--muted); outline: none; cursor: pointer;
        }

        .cs-count {
          font-family: 'DM Mono', monospace;
          font-size: 10.5px; color: var(--faint);
          letter-spacing: 0.08em; text-transform: uppercase;
          margin-bottom: 10px; padding-left: 2px;
        }

        .cs-card {
          background: var(--surface); border: 1px solid var(--line);
          border-radius: 12px; overflow: hidden;
          margin-bottom: 10px;
          transition: border-color .2s;
        }
        .cs-card:hover { border-color: var(--line2); }

        .cs-head {
          padding: 16px 18px;
          display: flex; align-items: center;
          justify-content: space-between; gap: 14px;
          cursor: pointer;
        }
        .cs-avatar {
          width: 48px; height: 48px; border-radius: 50%;
          object-fit: cover; border: 2px solid var(--line);
          flex-shrink: 0;
        }
        .cs-info { flex: 1; min-width: 0; }
        .cs-name {
          font-family: 'Playfair Display', serif;
          font-size: 15px; font-weight: 700; color: var(--white);
          margin-bottom: 4px;
        }
        .cs-meta {
          display: flex; flex-wrap: wrap; gap: 12px;
          align-items: center;
        }
        .cs-meta-item {
          display: flex; align-items: center; gap: 4px;
          font-size: 11px; color: var(--muted);
        }
        .cs-role-badge {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 2px 8px; border-radius: 100px;
          font-size: 9px; font-weight: 600;
          font-family: 'DM Mono', monospace;
        }
        .cs-stats-row {
          display: flex; gap: 16px; margin-top: 6px;
        }
        .cs-stat-badge {
          display: flex; align-items: center; gap: 4px;
          font-size: 10px; color: var(--faint);
        }
        .cs-expand-btn {
          width: 32px; height: 32px; border-radius: 8px;
          background: transparent; border: 1px solid var(--line);
          color: var(--muted); display: flex;
          align-items: center; justify-content: center;
          cursor: pointer; transition: all .16s;
        }
        .cs-expand-btn:hover { border-color: var(--line2); color: var(--text); background: var(--raised); }

        .cs-expanded {
          border-top: 1px solid var(--line);
          padding: 20px 18px;
          background: rgba(0,0,0,0.2);
        }
        .cs-detail-grid {
          display: grid; grid-template-columns: repeat(2, 1fr);
          gap: 12px; margin-bottom: 16px;
        }
        @media(max-width:600px){ .cs-detail-grid { grid-template-columns: 1fr; } }
        .cs-detail-box {
          background: var(--raised); border: 1px solid var(--line);
          border-radius: 10px; padding: 12px 14px;
        }
        .cs-detail-title {
          font-family: 'DM Mono', monospace;
          font-size: 9px; text-transform: uppercase;
          letter-spacing: 0.1em; color: var(--faint);
          margin-bottom: 8px; display: flex; align-items: center; gap: 6px;
        }

        .cs-empty {
          text-align: center; padding: 72px 20px;
          background: var(--surface); border: 1px solid var(--line);
          border-radius: 12px;
        }
        .cs-empty-icon {
          width: 48px; height: 48px; border-radius: 12px;
          background: var(--raised); border: 1px solid var(--line);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 12px; color: var(--faint);
        }
      `}</style>

      <div className="cs">
        <div className="cs-header">
          <div>
            <h1 className="cs-title">Customers</h1>
            <p className="cs-subtitle">Raijam Admin · {filtered.length} customer{filtered.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex gap-2">
            <button className="adm-btn adm-btn-ghost" onClick={exportCSV}>
              <Download size={13} /> Export CSV
            </button>
            <span className="cs-ts">
              {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Stats */}
        <p className="cs-label">Customer Insights</p>
        <div className="cs-stats">
          {[
            { title: 'Total Customers', val: stats.customers, icon: Users, desc: 'Active accounts' },
            { title: 'Total Orders', val: stats.totalOrders, icon: ShoppingBag, desc: 'Across all customers' },
            { title: 'Total Revenue', val: fmt(stats.totalSpent), icon: DollarSign, desc: 'Gross sales' },
            { title: 'Avg. per Customer', val: fmt(stats.totalSpent / (stats.customers || 1)), icon: TrendingUp, desc: 'Average spend' },
          ].map(({ title, val, icon: Icon, desc }, i) => (
            <motion.div key={title} {...staggerAnim(i)} className="cs-stat">
              <div className="cs-stat-top">
                <div className="cs-stat-icon"><Icon size={15} /></div>
              </div>
              <div className="cs-stat-val">{typeof val === 'number' ? val.toLocaleString() : val}</div>
              <div className="cs-stat-name">{title}</div>
              <div className="cs-stat-desc">{desc}</div>
            </motion.div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="cs-toolbar">
          <div className="cs-search-wrap">
            <Search size={14} className="cs-search-icon" />
            <input
              className="cs-search"
              placeholder="Search by name, email or phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="cs-filter-row">
            {['All', 'Customer', 'Admin'].map(role => {
              const roleKey = role === 'All' ? 'All' : role.toLowerCase()
              const config = ROLE_CONFIG[roleKey] || ROLE_CONFIG.default
              return (
                <button
                  key={role}
                  className={`cs-role-pill${roleFilter === role ? ' on' : ''}`}
                  onClick={() => setRoleFilter(role)}
                >
                  {role !== 'All' && <span className="cs-role-dot" style={{ background: config.color }} />}
                  {role}
                </button>
              )
            })}
            <select className="cs-sort" value={sort} onChange={e => setSort(e.target.value)}>
              {SORTS.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
            </select>
          </div>
        </div>

        <p className="cs-count">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>

        {filtered.length === 0 ? (
          <div className="cs-empty">
            <div className="cs-empty-icon"><Users size={20} /></div>
            <p className="cs-empty-title">No customers found</p>
            <p className="cs-empty-sub">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map((customer, idx) => {
              const config = ROLE_CONFIG[customer.role] || ROLE_CONFIG.default
              const Icon = config.icon
              const isExpanded = expandedCustomer === customer.id

              return (
                <motion.div
                  key={customer.id}
                  className="cs-card"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                >
                  <div className="cs-head" onClick={() => setExpandedCustomer(isExpanded ? null : customer.id)}>
                    {customer.profile_image ? (
                      <img src={customer.profile_image} alt={customer.full_name} className="cs-avatar" />
                    ) : (
                      <div className="cs-avatar bg-gray-700 flex items-center justify-center">
                        <User size={22} className="text-gray-400" />
                      </div>
                    )}
                    
                    <div className="cs-info">
                      <div className="cs-name">{customer.full_name || 'N/A'}</div>
                      <div className="cs-meta">
                        <span className="cs-meta-item"><Mail size={11} /> {customer.email}</span>
                        {customer.phone_number && (
                          <span className="cs-meta-item"><Phone size={11} /> {customer.phone_number}</span>
                        )}
                        <span className={`cs-role-badge`} style={{ background: config.bg, color: config.color }}>
                          <Icon size={8} /> {config.label}
                        </span>
                      </div>
                      <div className="cs-stats-row">
                        <span className="cs-stat-badge"><Package size={9} /> {customer.total_orders || 0} orders</span>
                        <span className="cs-stat-badge"><DollarSign size={9} /> {fmt(customer.total_spent || 0)}</span>
                        <span className="cs-stat-badge"><Calendar size={9} /> Joined {fmtDate(customer.created_at)}</span>
                      </div>
                    </div>

                    <div className="cs-expand-btn" onClick={e => e.stopPropagation()}>
                      <ChevronRight size={14} className={isExpanded ? 'rotate-90' : ''} />
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        className="cs-expanded"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22 }}
                      >
                        <div className="cs-detail-grid">
                          <div className="cs-detail-box">
                            <div className="cs-detail-title"><User size={9} /> Personal Info</div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs">
                                <span className="text-muted">Full Name</span>
                                <span className="text-white">{customer.full_name || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-muted">Email</span>
                                <span className="text-white">{customer.email}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-muted">Phone</span>
                                <span className="text-white">{customer.phone_number || 'Not provided'}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-muted">Member Since</span>
                                <span className="text-white">{fmtDate(customer.created_at)}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="cs-detail-box">
                            <div className="cs-detail-title"><ShoppingBag size={9} /> Purchase Summary</div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs">
                                <span className="text-muted">Total Orders</span>
                                <span className="text-white font-semibold">{customer.total_orders || 0}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-muted">Total Spent</span>
                                <span className="text-white font-semibold">{fmt(customer.total_spent || 0)}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-muted">Avg. Order Value</span>
                                <span className="text-white font-semibold">
                                  {fmt((customer.total_spent || 0) / (customer.total_orders || 1))}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>
    </>
  )
}