import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Package, CheckCircle, Clock, Truck,
  XCircle, ChevronDown, ChevronUp, Edit3, Save,
  X, RefreshCw, Download, Printer, User, Phone,
  MapPin, Calendar, Hash, ShoppingBag, Eye,
  TrendingUp, AlertCircle,
} from 'lucide-react'
import { sampleOrders } from '../data/orders'

/* ── status config ── */
const STATUS = {
  Pending:       { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',   border: 'rgba(245,158,11,0.25)',  icon: Clock },
  Processing:    { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',   border: 'rgba(96,165,250,0.25)',  icon: Package },
  Shipped:       { color: '#c084fc', bg: 'rgba(192,132,252,0.1)', border: 'rgba(192,132,252,0.25)', icon: Truck },
  Delivered:     { color: '#4ade80', bg: 'rgba(74,222,128,0.1)',   border: 'rgba(74,222,128,0.25)',  icon: CheckCircle },
  Cancelled:     { color: '#f87171', bg: 'rgba(248,113,113,0.1)',  border: 'rgba(248,113,113,0.25)', icon: XCircle },
}
const STATUS_KEYS = Object.keys(STATUS)

const cfg = (s) => STATUS[s] || { color: '#888', bg: 'rgba(136,136,136,0.1)', border: 'rgba(136,136,136,0.2)', icon: Clock }

const fmt = (n) => `GHC ${Number(n).toFixed(2)}`
const fmtDate = (d) => {
  try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }
  catch { return d }
}

const SORTS = [
  { v: 'newest',     l: 'Newest First' },
  { v: 'oldest',     l: 'Oldest First' },
  { v: 'total-hi',   l: 'Total ↓' },
  { v: 'total-lo',   l: 'Total ↑' },
]

export default function OrdersSection() {
  const [orders, setOrders]       = useState(sampleOrders)
  const [search,  setSearch]      = useState('')
  const [statusF, setStatusF]     = useState('All')
  const [sort,    setSort]        = useState('newest')
  const [expanded, setExpanded]   = useState(null)
  const [editing,  setEditing]    = useState(null)
  const [draft,    setDraft]      = useState('')

  /* ── stats ── */
  const stats = useMemo(() => ({
    total:     orders.length,
    pending:   orders.filter(o => o.status === 'Pending').length,
    delivered: orders.filter(o => o.status === 'Delivered').length,
    revenue:   orders.reduce((s, o) => s + o.totalAmount, 0),
  }), [orders])

  /* ── filter + sort ── */
  const filtered = useMemo(() => {
    let r = [...orders]
    if (statusF !== 'All') r = r.filter(o => o.status === statusF)
    if (search.trim()) {
      const q = search.toLowerCase()
      r = r.filter(o =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q)
      )
    }
    if (sort === 'oldest')   r.sort((a, b) => new Date(a.orderDate) - new Date(b.orderDate))
    if (sort === 'newest')   r.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
    if (sort === 'total-hi') r.sort((a, b) => b.totalAmount - a.totalAmount)
    if (sort === 'total-lo') r.sort((a, b) => a.totalAmount - b.totalAmount)
    return r
  }, [orders, statusF, search, sort])

  /* ── update status ── */
  const saveStatus = (id) => {
    if (!draft) return
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: draft } : o))
    setEditing(null); setDraft('')
  }

  /* ── export CSV ── */
  const exportCSV = () => {
    const rows = [
      ['Order #', 'Customer', 'Phone', 'Date', 'Items', 'Total', 'Status'],
      ...filtered.map(o => [
        o.orderNumber, o.customerName, o.customerPhone,
        o.orderDate, o.orderDetails.length, o.totalAmount, o.status
      ])
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const a = document.createElement('a')
    a.href = 'data:text/csv,' + encodeURIComponent(csv)
    a.download = 'raijam_orders.csv'
    a.click()
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        img { display: block; }

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

        .adm {
          background: var(--bg);
          color: var(--text);
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          padding: 32px 36px 80px;
        }
        @media(max-width:640px){ .adm { padding: 20px 16px 60px; } }

        /* ── HEADER ── */
        .adm-header {
          display: flex; align-items: flex-start;
          justify-content: space-between; gap: 16px;
          margin-bottom: 28px; flex-wrap: wrap;
        }
        .adm-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(24px, 3vw, 32px);
          font-weight: 900; letter-spacing: -0.03em;
          color: var(--white); line-height: 1;
          margin-bottom: 5px;
        }
        .adm-subtitle {
          font-family: 'DM Mono', monospace;
          font-size: 11px; color: var(--faint);
          letter-spacing: 0.1em; text-transform: uppercase;
        }
        .adm-header-btns { display: flex; gap: 8px; flex-wrap: wrap; }
        .adm-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 14px; border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 11.5px; font-weight: 600;
          cursor: pointer; transition: all .18s;
          white-space: nowrap;
        }
        .adm-btn-ghost {
          background: transparent; border: 1px solid var(--line2);
          color: var(--muted);
        }
        .adm-btn-ghost:hover { border-color: var(--faint); color: var(--text); background: var(--raised); }

        /* ── STAT CARDS ── */
        .adm-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px; margin-bottom: 24px;
        }
        @media(max-width:900px){ .adm-stats { grid-template-columns: repeat(2, 1fr); } }
        @media(max-width:480px){ .adm-stats { grid-template-columns: 1fr 1fr; } }

        .stat-card {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 12px; padding: 18px 20px;
          transition: border-color .2s;
        }
        .stat-card:hover { border-color: var(--line2); }
        .stat-label {
          font-family: 'DM Mono', monospace;
          font-size: 9.5px; font-weight: 500;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--faint); margin-bottom: 8px;
          display: flex; align-items: center; gap: 6px;
        }
        .stat-val {
          font-family: 'Playfair Display', serif;
          font-size: 26px; font-weight: 700;
          color: var(--white); letter-spacing: -0.02em; line-height: 1;
        }
        .stat-sub { font-size: 11px; color: var(--muted); margin-top: 4px; }

        /* ── TOOLBAR ── */
        .adm-toolbar {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 12px; padding: 14px 16px;
          margin-bottom: 16px;
        }
        .adm-search-wrap {
          position: relative; margin-bottom: 12px;
        }
        .adm-search-icon {
          position: absolute; left: 12px; top: 50%;
          transform: translateY(-50%); color: var(--faint);
          pointer-events: none;
        }
        .adm-search {
          width: 100%; padding: 10px 12px 10px 38px;
          background: var(--raised); border: 1px solid var(--line);
          border-radius: 8px; font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          color: var(--text); outline: none;
          transition: border-color .18s;
        }
        .adm-search::placeholder { color: var(--faint); }
        .adm-search:focus { border-color: var(--line2); }

        .adm-filter-row {
          display: flex; align-items: center;
          gap: 8px; flex-wrap: wrap;
        }
        .adm-status-pill {
          display: flex; align-items: center; gap: 5px;
          padding: 5px 13px; border-radius: 100px;
          font-size: 11px; font-weight: 600;
          cursor: pointer; border: 1px solid var(--line);
          background: transparent; color: var(--muted);
          font-family: 'DM Sans', sans-serif;
          transition: all .16s; white-space: nowrap;
        }
        .adm-status-pill:hover { color: var(--text); border-color: var(--line2); }
        .adm-status-pill.on { background: var(--raised); color: var(--white); border-color: var(--line2); }
        .adm-status-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

        .adm-sort {
          margin-left: auto; flex-shrink: 0;
          padding: 6px 12px; background: var(--raised);
          border: 1px solid var(--line); border-radius: 8px;
          font-size: 11.5px; font-family: 'DM Mono', monospace;
          color: var(--muted); outline: none; cursor: pointer;
          transition: border-color .16s;
        }
        .adm-sort:focus { border-color: var(--line2); }

        /* ── RESULTS COUNT ── */
        .adm-count {
          font-family: 'DM Mono', monospace;
          font-size: 10.5px; color: var(--faint);
          letter-spacing: 0.08em; text-transform: uppercase;
          margin-bottom: 10px; padding-left: 2px;
        }

        /* ── ORDER CARD ── */
        .ord-card {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 12px; overflow: hidden;
          margin-bottom: 10px;
          transition: border-color .2s;
        }
        .ord-card:hover { border-color: var(--line2); }

        .ord-head {
          padding: 16px 18px;
          display: flex; align-items: flex-start;
          justify-content: space-between; gap: 14px;
          cursor: pointer; user-select: none;
        }

        .ord-left { flex: 1; min-width: 0; }

        .ord-top-row {
          display: flex; align-items: center; gap: 10px;
          flex-wrap: wrap; margin-bottom: 8px;
        }
        .ord-number {
          font-family: 'DM Mono', monospace;
          font-size: 13px; font-weight: 500; color: var(--white);
        }
        .ord-chip {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 3px 10px; border-radius: 100px;
          font-family: 'DM Mono', monospace;
          font-size: 10px; font-weight: 500;
          border: 1px solid transparent;
          white-space: nowrap;
        }
        .ord-meta-row {
          display: flex; flex-wrap: wrap; gap: 16px;
          align-items: center;
        }
        .ord-meta {
          display: flex; align-items: center; gap: 5px;
          font-size: 12px; color: var(--muted);
        }
        .ord-meta svg { color: var(--faint); flex-shrink: 0; }
        .ord-amount {
          font-family: 'Playfair Display', serif;
          font-size: 16px; font-weight: 700; color: var(--white);
          margin-left: auto; flex-shrink: 0;
        }

        .ord-right {
          display: flex; align-items: center; gap: 6px; flex-shrink: 0;
        }
        .ord-icon-btn {
          width: 32px; height: 32px; border-radius: 7px;
          background: transparent; border: 1px solid var(--line);
          color: var(--muted); display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all .16s; flex-shrink: 0;
        }
        .ord-icon-btn:hover { border-color: var(--line2); color: var(--text); background: var(--raised); }

        /* status editor */
        .ord-edit-row {
          display: flex; align-items: center; gap: 6px;
          margin-top: 6px; flex-wrap: wrap;
        }
        .ord-edit-select {
          padding: 5px 10px; background: var(--raised);
          border: 1px solid var(--line2); border-radius: 7px;
          font-size: 11.5px; font-family: 'DM Mono', monospace;
          color: var(--text); outline: none; cursor: pointer;
        }
        .ord-save-btn {
          width: 28px; height: 28px; border-radius: 6px;
          background: rgba(74,222,128,0.1); border: 1px solid rgba(74,222,128,0.3);
          color: #4ade80; display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: background .16s;
        }
        .ord-save-btn:hover { background: rgba(74,222,128,0.2); }
        .ord-save-btn:disabled { opacity: .35; cursor: not-allowed; }
        .ord-cancel-btn {
          width: 28px; height: 28px; border-radius: 6px;
          background: transparent; border: 1px solid var(--line);
          color: var(--muted); display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all .16s;
        }
        .ord-cancel-btn:hover { border-color: #f87171; color: #f87171; }

        /* ── EXPANDED ── */
        .ord-expanded {
          border-top: 1px solid var(--line);
        }
        .ord-expanded-inner { padding: 20px 18px; }

        /* customer info grid */
        .ord-info-grid {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 10px; margin-bottom: 20px;
        }
        @media(max-width:600px){ .ord-info-grid { grid-template-columns: 1fr; } }
        .ord-info-box {
          background: var(--raised); border: 1px solid var(--line);
          border-radius: 10px; padding: 14px 16px;
        }
        .ord-info-title {
          font-family: 'DM Mono', monospace; font-size: 9.5px;
          text-transform: uppercase; letter-spacing: 0.12em;
          color: var(--faint); margin-bottom: 10px;
          display: flex; align-items: center; gap: 5px;
        }
        .ord-info-row {
          display: flex; align-items: flex-start; gap: 7px;
          font-size: 12.5px; color: var(--muted); margin-bottom: 6px;
        }
        .ord-info-row svg { color: var(--faint); flex-shrink: 0; margin-top: 1px; }
        .ord-info-row:last-child { margin-bottom: 0; }

        /* items section */
        .ord-items-label {
          font-family: 'DM Mono', monospace; font-size: 9.5px;
          text-transform: uppercase; letter-spacing: 0.1em;
          color: var(--faint); margin-bottom: 10px;
          display: flex; align-items: center; gap: 8px;
        }
        .ord-items-label::after { content: ''; flex: 1; height: 1px; background: var(--line); }

        .ord-item-row {
          display: flex; align-items: flex-start; gap: 12px;
          background: var(--raised); border: 1px solid var(--line);
          border-radius: 10px; padding: 12px 14px;
          margin-bottom: 8px; transition: border-color .18s;
        }
        .ord-item-row:hover { border-color: var(--line2); }
        .ord-item-row:last-child { margin-bottom: 0; }
        .ord-item-img {
          width: 52px; height: 52px; border-radius: 8px;
          overflow: hidden; flex-shrink: 0;
          background: var(--hover); border: 1px solid var(--line);
          display: flex; align-items: center; justify-content: center;
        }
        .ord-item-img img { width: 100%; height: 100%; object-fit: cover; }
        .ord-item-name { font-size: 13px; font-weight: 600; color: var(--white); margin-bottom: 4px; }
        .ord-item-meta {
          display: flex; flex-wrap: wrap; gap: 8px;
          font-family: 'DM Mono', monospace; font-size: 10.5px; color: var(--muted);
        }
        .ord-item-meta-tag {
          background: var(--hover); border: 1px solid var(--line);
          padding: 2px 8px; border-radius: 4px; display: flex; align-items: center; gap: 4px;
        }
        .ord-color-swatch {
          width: 8px; height: 8px; border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.15); flex-shrink: 0;
        }
        .ord-item-price-col {
          margin-left: auto; text-align: right; flex-shrink: 0; padding-left: 12px;
        }
        .ord-item-price {
          font-family: 'Playfair Display', serif;
          font-size: 14px; font-weight: 700; color: var(--white);
        }
        .ord-item-sub {
          font-family: 'DM Mono', monospace;
          font-size: 9.5px; color: var(--faint); margin-top: 2px;
        }

        /* order total row */
        .ord-total-row {
          display: flex; align-items: center; justify-content: flex-end;
          gap: 12px; margin-top: 14px; padding-top: 14px;
          border-top: 1px solid var(--line);
        }
        .ord-total-label {
          font-family: 'DM Mono', monospace; font-size: 10.5px;
          letter-spacing: 0.1em; text-transform: uppercase; color: var(--faint);
        }
        .ord-total-val {
          font-family: 'Playfair Display', serif;
          font-size: 20px; font-weight: 700; color: var(--white);
        }

        /* quick action buttons */
        .ord-action-row {
          display: flex; flex-wrap: wrap; gap: 8px;
          margin-top: 16px; padding-top: 14px;
          border-top: 1px solid var(--line);
          justify-content: flex-end;
        }
        .ord-action-btn {
          display: flex; align-items: center; gap: 5px;
          padding: 7px 14px; border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 11.5px; font-weight: 600;
          cursor: pointer; border: 1px solid transparent;
          transition: all .16s; white-space: nowrap;
        }
        .abtn-blue   { background: rgba(96,165,250,0.1);  color: #60a5fa; border-color: rgba(96,165,250,0.25); }
        .abtn-blue:hover   { background: rgba(96,165,250,0.18); }
        .abtn-purple { background: rgba(192,132,252,0.1); color: #c084fc; border-color: rgba(192,132,252,0.25); }
        .abtn-purple:hover { background: rgba(192,132,252,0.18); }
        .abtn-green  { background: rgba(74,222,128,0.1);  color: #4ade80; border-color: rgba(74,222,128,0.25); }
        .abtn-green:hover  { background: rgba(74,222,128,0.18); }
        .abtn-red    { background: rgba(248,113,113,0.1); color: #f87171; border-color: rgba(248,113,113,0.25); }
        .abtn-red:hover    { background: rgba(248,113,113,0.18); }

        /* ── EMPTY STATE ── */
        .adm-empty {
          text-align: center; padding: 72px 20px;
          background: var(--surface); border: 1px solid var(--line);
          border-radius: 12px;
        }
        .adm-empty-icon {
          width: 48px; height: 48px; border-radius: 12px;
          background: var(--raised); border: 1px solid var(--line);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 12px; color: var(--faint);
        }
        .adm-empty-title {
          font-family: 'Playfair Display', serif;
          font-size: 16px; font-weight: 700; color: var(--white); margin-bottom: 6px;
        }
        .adm-empty-sub { font-size: 12.5px; color: var(--muted); }

        /* scrollbar */
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--line2); border-radius: 10px; }
      `}</style>

      <div className="adm">

        {/* ══ HEADER ══ */}
        <div className="adm-header">
          <div>
            <h1 className="adm-title">Orders</h1>
            <p className="adm-subtitle">Raijam Admin · {filtered.length} order{filtered.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="adm-header-btns">
            <button className="adm-btn adm-btn-ghost" onClick={() => window.print()}>
              <Printer size={13} /> Print
            </button>
            <button className="adm-btn adm-btn-ghost" onClick={exportCSV}>
              <Download size={13} /> Export CSV
            </button>
          </div>
        </div>

        {/* ══ STAT CARDS ══ */}
        <div className="adm-stats">
          {[
            { label: 'Total Orders',   val: stats.total,     sub: 'All time',        icon: ShoppingBag, color: '#888' },
            { label: 'Pending',        val: stats.pending,   sub: 'Awaiting action', icon: Clock,       color: '#f59e0b' },
            { label: 'Delivered',      val: stats.delivered, sub: 'Completed',       icon: CheckCircle, color: '#4ade80' },
            { label: 'Total Revenue',  val: fmt(stats.revenue), sub: 'Gross sales', icon: TrendingUp,  color: '#60a5fa', mono: true },
          ].map(({ label, val, sub, icon: Icon, color, mono }) => (
            <motion.div
              key={label}
              className="stat-card"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <div className="stat-label">
                <Icon size={11} style={{ color }} /> {label}
              </div>
              <div className="stat-val" style={{ fontFamily: mono ? 'DM Mono, monospace' : undefined, fontSize: mono ? 18 : undefined }}>
                {val}
              </div>
              <div className="stat-sub">{sub}</div>
            </motion.div>
          ))}
        </div>

        {/* ══ TOOLBAR ══ */}
        <div className="adm-toolbar">
          <div className="adm-search-wrap">
            <Search size={14} className="adm-search-icon" />
            <input
              className="adm-search"
              placeholder="Search by order number, customer name or phone…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="adm-filter-row">
            {['All', ...STATUS_KEYS].map(s => {
              const c = STATUS[s]
              return (
                <button
                  key={s}
                  className={`adm-status-pill${statusF === s ? ' on' : ''}`}
                  onClick={() => setStatusF(s)}
                >
                  {c && <span className="adm-status-dot" style={{ background: c.color }} />}
                  {s}
                </button>
              )
            })}
            <select
              className="adm-sort"
              value={sort}
              onChange={e => setSort(e.target.value)}
            >
              {SORTS.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
            </select>
          </div>
        </div>

        {/* results */}
        <p className="adm-count">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>

        {/* ══ ORDER LIST ══ */}
        {filtered.length === 0 ? (
          <div className="adm-empty">
            <div className="adm-empty-icon"><Package size={20} /></div>
            <p className="adm-empty-title">No orders found</p>
            <p className="adm-empty-sub">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map((order, idx) => {
              const c = cfg(order.status)
              const Icon = c.icon
              const isExp = expanded === order.id
              const isEdit = editing === order.id

              return (
                <motion.div
                  key={order.id}
                  className="ord-card"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.04 }}
                >
                  {/* ── CARD HEADER ── */}
                  <div className="ord-head" onClick={() => setExpanded(isExp ? null : order.id)}>
                    <div className="ord-left">
                      <div className="ord-top-row">
                        <span className="ord-number">{order.orderNumber}</span>
                        <span
                          className="ord-chip"
                          style={{ background: c.bg, color: c.color, borderColor: c.border }}
                        >
                          <Icon size={9} /> {order.status}
                        </span>
                      </div>

                      <div className="ord-meta-row">
                        <span className="ord-meta"><User size={11} /> {order.customerName}</span>
                        <span className="ord-meta"><Phone size={11} /> {order.customerPhone}</span>
                        <span className="ord-meta"><Calendar size={11} /> {fmtDate(order.orderDate)}</span>
                        <span className="ord-meta"><Package size={11} /> {order.orderDetails.length} item{order.orderDetails.length !== 1 ? 's' : ''}</span>
                        <span className="ord-amount">{fmt(order.totalAmount)}</span>
                      </div>

                      {/* Status editor */}
                      {isEdit && (
                        <div className="ord-edit-row" onClick={e => e.stopPropagation()}>
                          <select
                            className="ord-edit-select"
                            value={draft}
                            onChange={e => setDraft(e.target.value)}
                          >
                            <option value="">Select status…</option>
                            {STATUS_KEYS.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <button className="ord-save-btn" disabled={!draft} onClick={() => saveStatus(order.id)}>
                            <Save size={12} />
                          </button>
                          <button className="ord-cancel-btn" onClick={() => { setEditing(null); setDraft('') }}>
                            <X size={12} />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="ord-right" onClick={e => e.stopPropagation()}>
                      <button
                        className="ord-icon-btn"
                        title="Edit status"
                        onClick={() => { setEditing(isEdit ? null : order.id); setDraft(order.status) }}
                      >
                        <Edit3 size={13} />
                      </button>
                      <button className="ord-icon-btn" onClick={() => setExpanded(isExp ? null : order.id)}>
                        {isExp ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* ── EXPANDED DETAILS ── */}
                  <AnimatePresence>
                    {isExp && (
                      <motion.div
                        key="expanded"
                        className="ord-expanded"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div className="ord-expanded-inner">

                          {/* Customer + address */}
                          <div className="ord-info-grid">
                            <div className="ord-info-box">
                              <div className="ord-info-title"><User size={10} /> Customer Details</div>
                              <div className="ord-info-row"><User size={11} /><span style={{ color: 'var(--text)' }}>{order.customerName}</span></div>
                              <div className="ord-info-row"><Phone size={11} /><span>{order.customerPhone}</span></div>
                            </div>
                            <div className="ord-info-box">
                              <div className="ord-info-title"><MapPin size={10} /> Delivery Address</div>
                              <div className="ord-info-row"><MapPin size={11} /><span>{order.customerAddress}</span></div>
                            </div>
                          </div>

                          {/* Items */}
                          <div className="ord-items-label">
                            Order Items ({order.orderDetails.length})
                          </div>

                          {order.orderDetails.map((item, i) => (
                            <div key={i} className="ord-item-row">
                              <div className="ord-item-img">
                                {item.image
                                  ? <img src={item.image} alt={item.item} />
                                  : <Package size={18} color="var(--faint)" />
                                }
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div className="ord-item-name">{item.item}</div>
                                <div className="ord-item-meta">
                                  <span className="ord-item-meta-tag">
                                    <Hash size={9} /> Qty: {item.quantity}
                                  </span>
                                  <span className="ord-item-meta-tag">
                                    {fmt(item.price)} each
                                  </span>
                                  {item.color && (
                                    <span className="ord-item-meta-tag">
                                      <span
                                        className="ord-color-swatch"
                                        style={{ background: item.color }}
                                      />
                                      {item.color}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="ord-item-price-col">
                                <div className="ord-item-price">{fmt(item.price * item.quantity)}</div>
                                <div className="ord-item-sub">{item.quantity} × {fmt(item.price)}</div>
                              </div>
                            </div>
                          ))}

                          {/* Total */}
                          <div className="ord-total-row">
                            <span className="ord-total-label">Order Total</span>
                            <span className="ord-total-val">{fmt(order.totalAmount)}</span>
                          </div>

                          {/* Quick action buttons */}
                          <div className="ord-action-row">
                            {order.status === 'Pending' && (
                              <button
                                className="ord-action-btn abtn-blue"
                                onClick={() => setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'Processing' } : o))}
                              >
                                <Package size={12} /> Mark Processing
                              </button>
                            )}
                            {(order.status === 'Pending' || order.status === 'Processing') && (
                              <button
                                className="ord-action-btn abtn-purple"
                                onClick={() => setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'Shipped' } : o))}
                              >
                                <Truck size={12} /> Mark Shipped
                              </button>
                            )}
                            {(order.status === 'Shipped' || order.status === 'Processing') && (
                              <button
                                className="ord-action-btn abtn-green"
                                onClick={() => setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'Delivered' } : o))}
                              >
                                <CheckCircle size={12} /> Mark Delivered
                              </button>
                            )}
                            {order.status !== 'Cancelled' && order.status !== 'Delivered' && (
                              <button
                                className="ord-action-btn abtn-red"
                                onClick={() => {
                                  if (window.confirm(`Cancel order ${order.orderNumber}?`)) {
                                    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'Cancelled' } : o))
                                  }
                                }}
                              >
                                <XCircle size={12} /> Cancel Order
                              </button>
                            )}
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