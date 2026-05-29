import React, { useMemo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ShoppingCart, Package, Calendar, ArrowUp,
  Clock, Truck, CheckCircle, XCircle,
  PieChart, BarChart3, TrendingUp, ChevronRight,
  DollarSign, CreditCard, AlertCircle,
} from 'lucide-react'
import axios from 'axios'
import { supabase } from '../lib/supabaseClient'

const API_BASE_URL = 'http://172.20.10.3:5000/api/users'

/* ── helpers ── */
const fmt = (n) => `GHC ${Number(n).toFixed(2)}`
const fmtAbbr = (n) => {
  if (n >= 1_000_000) return `GHC ${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `GHC ${(n / 1_000).toFixed(2)}K`
  return `GHC ${Number(n).toFixed(2)}`
}
const fmtNum = (n) => {
  if (n >= 1_000) return (n / 1_000).toFixed(2) + 'K'
  return String(n)
}
const fmtDate = (d) => {
  try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }
  catch { return d }
}

const STATUS_CFG = {
  pending:    { color: '#f59e0b', icon: Clock, label: 'Pending' },
  processing: { color: '#60a5fa', icon: Package, label: 'Processing' },
  shipped:    { color: '#c084fc', icon: Truck, label: 'Shipped' },
  delivered:  { color: '#4ade80', icon: CheckCircle, label: 'Delivered' },
  cancelled:  { color: '#f87171', icon: XCircle, label: 'Cancelled' },
}

const staggerAnim = (i) => ({
  initial:    { opacity: 0, y: 16 },
  animate:    { opacity: 1, y: 0 },
  transition: { delay: i * 0.07, duration: 0.32, ease: [0.22, 1, 0.36, 1] },
})

export default function DashboardSection() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch all orders for admin
  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Please log in to view dashboard')
        setLoading(false)
        return
      }

      // Use admin endpoint to get ALL orders
      const response = await axios.get(
        `${API_BASE_URL}/admin/orders`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          }
        }
      )
      


      if (response.data.orders && Array.isArray(response.data.orders)) {
        // Transform API data to match component structure
        const transformedOrders = response.data.orders.map(order => ({
          id: order.id,
          orderNumber: order.order_id,
          orderDate: order.created_at,
          customerName: order.customer_name,
          customerPhone: order.customer_phone,
          customerEmail: order.customer_email,
          customerAddress: order.customer_address,
          totalAmount: order.order_total,
          status: order.status?.toLowerCase() || 'pending',
          paymentMethod: order.payment_method,
          orderDetails: order.items?.map(item => ({
            id: item.product_id,
            item: item.product_name,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.subtotal,
            color: item.color,
            image: item.image
          })) || []
        }))
        setOrders(transformedOrders)
      }
    } catch (err) {
      console.error("Error fetching orders:", err)
      setError(err.response?.data?.error || "Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  /* ── compute stats from orders (excluding cancelled from revenue) ── */
  const stats = useMemo(() => {
    // Filter out cancelled orders for revenue calculation
    const activeOrders = orders.filter(o => o.status !== 'cancelled')
    const allOrders = orders
    
    const total        = allOrders.length
    // ✅ Revenue excludes cancelled orders
    const totalRevenue = activeOrders.reduce((s, o) => s + o.totalAmount, 0)
    const totalItems   = allOrders.reduce((s, o) => s + o.orderDetails.reduce((a, d) => a + d.quantity, 0), 0)
    const avgOrder     = total > 0 ? totalRevenue / total : 0

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().slice(0, 10)
    const todayOrders = allOrders.filter(o => {
      const orderDate = new Date(o.orderDate).toISOString().slice(0, 10)
      return orderDate === today
    }).length

    const statusCounts = allOrders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1
      return acc
    }, {})

    const recentOrders = [...allOrders]
      .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
      .slice(0, 5)

    return {
      total, totalRevenue, totalItems, avgOrder,
      todayOrders, statusCounts, recentOrders,
    }
  }, [orders])

  const statCards = [
    {
      title: 'Total Revenue',
      value: fmtAbbr(stats.totalRevenue),
      icon: DollarSign,
      change: `${stats.total} orders`,
      trend: 'up',
      desc: 'Gross sales (excl. cancelled)',
    },
    {
      title: 'Total Orders',
      value: fmtNum(stats.total),
      icon: ShoppingCart,
      change: stats.todayOrders > 0 ? `+${stats.todayOrders} today` : 'No new today',
      trend: stats.todayOrders > 0 ? 'up' : 'none',
      desc: 'All orders',
    },
    {
      title: "Today's Orders",
      value: fmtNum(stats.todayOrders),
      icon: Calendar,
      change: stats.todayOrders > 0 ? `+${stats.todayOrders}` : '0',
      trend: stats.todayOrders > 0 ? 'up' : 'none',
      desc: 'Placed today',
    },
    {
      title: 'Items Sold',
      value: fmtNum(stats.totalItems),
      icon: Package,
      change: `Avg ${stats.avgOrder > 0 ? fmtAbbr(stats.avgOrder) : 'GHC 0'}/order`,
      trend: 'up',
      desc: 'Total units',
    },
  ]

  const statusRows = Object.entries(STATUS_CFG).map(([key, cfg]) => ({
    label: cfg.label,
    key: key,
    val:  stats.statusCounts[key] || 0,
    pct:  stats.total > 0 ? ((stats.statusCounts[key] || 0) / stats.total) * 100 : 0,
    color: cfg.color,
    Icon:  cfg.icon,
  }))

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-sm">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="ds-empty">
        <div className="ds-empty-icon"><AlertCircle size={20} /></div>
        <p className="ds-empty-title">Error loading dashboard</p>
        <p className="ds-empty-sub">{error}</p>
        <button 
          onClick={fetchOrders}
          className="mt-4 px-4 py-2 bg-gray-800 text-white rounded-lg text-sm"
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

        .ds {
          background: var(--bg);
          color: var(--text);
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          padding: 32px 36px 80px;
        }
        @media(max-width:640px){ .ds { padding: 20px 16px 60px; } }

        .ds-header {
          display: flex; align-items: flex-start;
          justify-content: space-between; gap: 16px;
          margin-bottom: 28px; flex-wrap: wrap;
        }
        .ds-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(22px, 3vw, 30px);
          font-weight: 900; letter-spacing: -0.03em;
          color: var(--white); line-height: 1; margin-bottom: 5px;
        }
        .ds-subtitle {
          font-family: 'DM Mono', monospace;
          font-size: 10.5px; color: var(--faint);
          letter-spacing: 0.1em; text-transform: uppercase;
        }
        .ds-ts {
          font-family: 'DM Mono', monospace;
          font-size: 10.5px; color: var(--faint);
          align-self: flex-end;
        }

        .ds-label {
          font-family: 'DM Mono', monospace;
          font-size: 9.5px; letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--faint); margin-bottom: 12px;
          display: flex; align-items: center; gap: 8px;
        }
        .ds-label::after { content: ''; flex: 1; height: 1px; background: var(--line); }

        .ds-stats {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 12px; margin-bottom: 28px;
        }
        @media(max-width:900px){ .ds-stats { grid-template-columns: repeat(2, 1fr); } }
        @media(max-width:480px){ .ds-stats { grid-template-columns: 1fr 1fr; } }

        .ds-stat {
          background: var(--surface); border: 1px solid var(--line);
          border-radius: 12px; padding: 18px 20px;
          transition: border-color .2s, transform .2s; position: relative; overflow: hidden;
        }
        .ds-stat:hover { border-color: var(--line2); transform: translateY(-2px); }
        .ds-stat-top {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 12px;
        }
        .ds-stat-icon {
          width: 32px; height: 32px; border-radius: 8px;
          background: rgba(255,255,255,0.05); border: 1px solid var(--line2);
          display: flex; align-items: center; justify-content: center;
          color: var(--muted);
        }
        .ds-stat-change {
          display: flex; align-items: center; gap: 3px;
          font-family: 'DM Mono', monospace; font-size: 9.5px;
          color: var(--faint);
        }
        .ds-stat-change.up { color: #4ade80; }
        .ds-stat-val {
          font-family: 'Playfair Display', serif;
          font-size: 26px; font-weight: 700; letter-spacing: -0.02em;
          color: var(--white); line-height: 1; margin-bottom: 4px;
        }
        .ds-stat-name { font-size: 12px; font-weight: 500; color: var(--muted); margin-bottom: 2px; }
        .ds-stat-desc { font-family: 'DM Mono', monospace; font-size: 9.5px; color: var(--faint); }

        .ds-mid {
          display: grid; grid-template-columns: 1fr 300px;
          gap: 12px; margin-bottom: 28px;
        }
        @media(max-width:900px){ .ds-mid { grid-template-columns: 1fr; } }

        .ds-card {
          background: var(--surface); border: 1px solid var(--line);
          border-radius: 12px; padding: 20px 22px;
        }
        .ds-card-title {
          font-family: 'Playfair Display', serif;
          font-size: 15px; font-weight: 700; color: var(--white);
          display: flex; align-items: center; gap: 8px;
          margin-bottom: 16px;
        }
        .ds-card-title svg { color: var(--muted); }
        .ds-card-sub { margin-left: auto; font-family: 'DM Mono', monospace; font-size: 9.5px; color: var(--faint); }

        .ds-status-grid {
          display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px;
        }
        @media(max-width:640px){ .ds-status-grid { grid-template-columns: repeat(3, 1fr); } }

        .ds-status-cell {
          background: var(--raised); border: 1px solid var(--line);
          border-radius: 10px; padding: 14px 8px;
          text-align: center; transition: border-color .2s;
        }
        .ds-status-cell:hover { border-color: var(--line2); }
        .ds-status-icon-wrap {
          width: 28px; height: 28px; border-radius: 7px;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 7px;
        }
        .ds-status-num {
          font-family: 'Playfair Display', serif;
          font-size: 20px; font-weight: 700; color: var(--white);
          line-height: 1; margin-bottom: 3px;
        }
        .ds-status-name { font-size: 10px; color: var(--muted); margin-bottom: 3px; }
        .ds-status-pct { font-family: 'DM Mono', monospace; font-size: 9px; color: var(--faint); }
        .ds-progress { height: 3px; background: var(--line); border-radius: 3px; margin-top: 7px; overflow: hidden; }
        .ds-progress-fill { height: 100%; border-radius: 3px; }

        .ds-rev-item {
          background: var(--raised); border: 1px solid var(--line);
          border-radius: 10px; padding: 12px 14px;
          margin-bottom: 8px; display: flex; align-items: center;
          transition: border-color .2s;
        }
        .ds-rev-item:last-child { margin-bottom: 0; }
        .ds-rev-item:hover { border-color: var(--line2); }
        .ds-rev-icon {
          width: 32px; height: 32px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          margin-right: 11px; flex-shrink: 0;
        }
        .ds-rev-lbl { font-size: 11px; font-weight: 500; color: var(--muted); margin-bottom: 2px; }
        .ds-rev-val {
          font-family: 'Playfair Display', serif;
          font-size: 15px; font-weight: 700; color: var(--white);
        }

        .ds-orders-card { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 20px 22px; }

        .ds-view-all {
          margin-left: auto; background: none; border: none;
          font-family: 'DM Sans', sans-serif; font-size: 11px;
          font-weight: 500; color: var(--muted); cursor: pointer;
          display: flex; align-items: center; gap: 3px; transition: color .16s;
        }
        .ds-view-all:hover { color: var(--text); }

        .ds-order-row {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 10px; border-radius: 8px; transition: background .14s;
          margin-bottom: 2px;
        }
        .ds-order-row:hover { background: var(--raised); }
        .ds-order-row:last-child { margin-bottom: 0; }
        .ds-order-icon-wrap {
          width: 32px; height: 32px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .ds-order-num {
          font-family: 'DM Mono', monospace; font-size: 11.5px;
          color: var(--white); font-weight: 500;
        }
        .ds-order-cust { font-size: 11px; color: var(--muted); margin-top: 2px; }
        .ds-order-date { font-family: 'DM Mono', monospace; font-size: 9.5px; color: var(--faint); margin-top: 1px; }
        .ds-order-right { margin-left: auto; text-align: right; flex-shrink: 0; }
        .ds-order-amt {
          font-family: 'Playfair Display', serif;
          font-size: 13px; font-weight: 700; color: var(--white); margin-bottom: 3px;
        }
        .ds-chip {
          display: inline-flex; align-items: center; gap: 3px;
          padding: 2px 8px; border-radius: 100px;
          font-family: 'DM Mono', monospace; font-size: 9px; font-weight: 500;
          border: 1px solid;
        }

        .ds-empty {
          text-align: center; padding: 72px 20px;
          background: var(--surface); border: 1px solid var(--line);
          border-radius: 12px;
        }
        .ds-empty-icon {
          width: 48px; height: 48px; border-radius: 12px;
          background: var(--raised); border: 1px solid var(--line);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 12px; color: var(--faint);
        }
        .ds-empty-title {
          font-family: 'Playfair Display', serif;
          font-size: 16px; font-weight: 700; color: var(--white); margin-bottom: 6px;
        }
        .ds-empty-sub { font-size: 12.5px; color: var(--muted); }
      `}</style>

      <div className="ds">

        {/* ══ HEADER ══ */}
        <div className="ds-header">
          <div>
            <h1 className="ds-title">Dashboard</h1>
            <p className="ds-subtitle">Raijam Admin · Overview</p>
          </div>
          <span className="ds-ts">
            {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>

        {/* ══ STAT CARDS ══ */}
        <p className="ds-label">Key Metrics</p>
        <div className="ds-stats">
          {statCards.map(({ title, value, icon: Icon, change, trend, desc }, i) => (
            <motion.div key={title} {...staggerAnim(i)} className="ds-stat">
              <div className="ds-stat-top">
                <div className="ds-stat-icon"><Icon size={15} /></div>
                <span className={`ds-stat-change${trend === 'up' ? ' up' : ''}`}>
                  {trend === 'up' && <ArrowUp size={9} />}
                  {change}
                </span>
              </div>
              <div className="ds-stat-val">{value}</div>
              <div className="ds-stat-name">{title}</div>
              <div className="ds-stat-desc">{desc}</div>
            </motion.div>
          ))}
        </div>

        {/* ══ STATUS + REVENUE ══ */}
        <p className="ds-label">Order Status &amp; Revenue</p>
        <div className="ds-mid">

          {/* Status distribution */}
          <motion.div {...staggerAnim(0)} className="ds-card">
            <div className="ds-card-title">
              <PieChart size={15} />
              Order Status Distribution
              <span className="ds-card-sub">{stats.total} total</span>
            </div>
            <div className="ds-status-grid">
              {statusRows.map(({ label, val, pct, color, Icon }) => (
                <div key={label} className="ds-status-cell">
                  <div className="ds-status-icon-wrap" style={{ background: `${color}18`, color }}>
                    <Icon size={13} />
                  </div>
                  <div className="ds-status-num">{val}</div>
                  <div className="ds-status-name">{label}</div>
                  <div className="ds-status-pct">{pct.toFixed(0)}%</div>
                  <div className="ds-progress">
                    <div className="ds-progress-fill" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Revenue summary */}
          <motion.div {...staggerAnim(1)} className="ds-card">
            <div className="ds-card-title">
              <BarChart3 size={15} /> Revenue
            </div>

            {[
              {
                label: 'Total Revenue',
                val: fmtAbbr(stats.totalRevenue),
                icon: TrendingUp,
                bg: 'rgba(74,222,128,0.1)',
                color: '#4ade80',
              },
              {
                label: 'Avg. Order Value',
                val: fmtAbbr(stats.avgOrder),
                icon: CreditCard,
                bg: 'rgba(96,165,250,0.1)',
                color: '#60a5fa',
              },
              {
                label: 'Total Items Sold',
                val: fmtNum(stats.totalItems),
                icon: Package,
                bg: 'rgba(245,158,11,0.1)',
                color: '#f59e0b',
              },
            ].map(({ label, val, icon: Icon, bg, color }) => (
              <div key={label} className="ds-rev-item">
                <div className="ds-rev-icon" style={{ background: bg, color }}>
                  <Icon size={14} />
                </div>
                <div>
                  <div className="ds-rev-lbl">{label}</div>
                  <div className="ds-rev-val">{val}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* ══ RECENT ORDERS ══ */}
        <p className="ds-label">Recent Orders</p>
        <motion.div {...staggerAnim(0)} className="ds-orders-card">
          <div className="ds-card-title">
            <ShoppingCart size={15} />
            Recent Orders
          </div>

          {stats.recentOrders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm">No orders found</p>
            </div>
          ) : (
            stats.recentOrders.map((order) => {
              const statusKey = order.status?.toLowerCase() || 'pending'
              const c = STATUS_CFG[statusKey] || STATUS_CFG.pending
              const Icon = c.icon
              return (
                <div key={order.id} className="ds-order-row">
                  <div
                    className="ds-order-icon-wrap"
                    style={{ background: `${c.color}18`, color: c.color }}
                  >
                    <Icon size={14} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="ds-order-num">{order.orderNumber}</div>
                    <div className="ds-order-cust">{order.customerName}</div>
                    <div className="ds-order-date">{fmtDate(order.orderDate)}</div>
                  </div>
                  <div className="ds-order-right">
                    <div className="ds-order-amt">{fmt(order.totalAmount)}</div>
                    <span
                      className="ds-chip"
                      style={{
                        color: c.color,
                        borderColor: `${c.color}44`,
                        background: `${c.color}12`,
                      }}
                    >
                      <Icon size={8} /> {c.label}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </motion.div>

      </div>
    </>
  )
}