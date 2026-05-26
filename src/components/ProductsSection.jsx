import React, { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingBag, Plus, Edit, Trash2, Search,
  Eye, Package, CheckCircle, XCircle, AlertCircle,
  Grid, List, Image, X,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import AddProduct from './AddProduct'
import axios from 'axios'
import { supabase } from '../lib/supabaseClient'

/* ── helpers ── */
const fmt   = (n) => `GHC ${Number(n).toFixed(2)}`
const ALL   = 'all'

const staggerAnim = (i) => ({
  initial:    { opacity: 0, y: 14 },
  animate:    { opacity: 1, y: 0 },
  transition: { delay: i * 0.06, duration: 0.3, ease: [0.22, 1, 0.36, 1] },
})

export default function PlainProductsSection() {

  const [products,     setProducts]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [catFilter,    setCatFilter]    = useState(ALL)
  const [stockFilter,  setStockFilter]  = useState(ALL)
  const [sort,         setSort]         = useState('name')
  const [view,         setView]         = useState('grid')
  const [selected,     setSelected]     = useState([])
  const [preview,      setPreview]      = useState(null)
  const [editing,      setEditing]      = useState(null)
  const [draft,        setDraft]        = useState({})
  const [showForm,     setShowForm]     = useState(false)
  const [editProduct,  setEditProduct]  = useState(null)

  /* ── fetch products from API ── */
  const fetchProducts = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      
      const response = await axios.get('http://172.20.10.3:5000/api/users/products', { headers })
      
      // Map the API response to match your component's expected structure
      const mappedProducts = response.data.products.map(product => ({
        id: product.id,
        name: product.product_name,
        description: product.product_description,
        brand: product.product_brand,
        price: product.product_price,
        discount: product.discount,
        discountType: product.discount_type,
        stock: product.product_stock,
        category: product.product_categories || [],
        colors: product.product_colors || [],
        images: product.product_images || [],
        status: product.status,
        sku: product.skuid,
        createdAt: product.created_at,
        updatedAt: product.updated_at
      }))
      
      setProducts(mappedProducts)
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  /* ── derived categories ── */
  const categories = useMemo(() => {
    const s = new Set()
    products.forEach(p => p.category?.forEach(c => s.add(c)))
    return [...s]
  }, [products])

  /* ── stats ── */
  const stats = useMemo(() => ({
    total:    products.length,
    inStock:  products.filter(p => p.stock > 10).length,
    lowStock: products.filter(p => p.stock > 0 && p.stock <= 10).length,
    outStock: products.filter(p => p.stock === 0).length,
  }), [products])

  /* ── filter + sort ── */
  const filtered = useMemo(() => {
    let r = [...products]
    if (search.trim()) {
      const q = search.toLowerCase()
      r = r.filter(p => p.name.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q))
    }
    if (catFilter !== ALL)      r = r.filter(p => p.category?.includes(catFilter))
    if (stockFilter === 'in')   r = r.filter(p => p.stock > 10)
    if (stockFilter === 'low')  r = r.filter(p => p.stock > 0 && p.stock <= 10)
    if (stockFilter === 'out')  r = r.filter(p => p.stock === 0)
    if (sort === 'name')        r.sort((a, b) => a.name.localeCompare(b.name))
    if (sort === 'price-hi')    r.sort((a, b) => b.price - a.price)
    if (sort === 'price-lo')    r.sort((a, b) => a.price - b.price)
    if (sort === 'stock-hi')    r.sort((a, b) => b.stock - a.stock)
    return r
  }, [products, search, catFilter, stockFilter, sort])

  /* ── selection ── */
  const toggleSel = (id) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const toggleAll = () =>
    setSelected(prev => prev.length === filtered.length ? [] : filtered.map(p => p.id))

  /* ── delete ── */
  const deleteOne = async (id) => {
    if (!window.confirm('Delete this product?')) return
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      await axios.delete(`http://172.20.10.3:5000/api/users/products/product/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      setProducts(prev => prev.filter(p => p.id !== id))
      setSelected(prev => prev.filter(x => x !== id))
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Failed to delete product')
    }
  }
  
  const deleteBulk = async () => {
    if (!selected.length) return
    if (!window.confirm(`Delete ${selected.length} product(s)?`)) return
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      
      for (const id of selected) {
        await axios.delete(`http://172.20.10.3:5000/api/users/products/product/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      }
      
      setProducts(prev => prev.filter(p => !selected.includes(p.id)))
      setSelected([])
    } catch (error) {
      console.error('Error deleting products:', error)
      alert('Failed to delete some products')
    }
  }

  /* ── inline quick-edit ── */
  const startEdit  = (p) => { setEditing(p.id); setDraft({ name: p.name, price: p.price, stock: p.stock }) }
  const saveEdit   = async (id) => {
    const updatedProduct = products.find(p => p.id === id)
    const updatedData = { ...updatedProduct, ...draft, price: Number(draft.price), stock: Number(draft.stock) }
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      
      // Prepare FormData for update
      const formData = new FormData()
      formData.append('product_name', updatedData.name)
      formData.append('product_price', updatedData.price)
      formData.append('product_stock', updatedData.stock)
      formData.append('product_description', updatedData.description || '')
      formData.append('product_categories', JSON.stringify(updatedData.category || []))
      formData.append('product_colors', JSON.stringify(updatedData.colors || []))
      formData.append('existing_images', JSON.stringify(updatedData.images || []))
      
      await axios.put(`http://172.20.10.3:5000/api/products/product/${id}`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      })
      
      setProducts(prev => prev.map(p =>
        p.id === id ? updatedData : p
      ))
      setEditing(null)
      setDraft({})
    } catch (error) {
      console.error('Error updating product:', error)
      alert('Failed to update product')
    }
  }
  const cancelEdit = () => { setEditing(null); setDraft({}) }

  /* ── open add/edit form ── */
  const openAdd  = () => { setEditProduct(null); setShowForm(true) }
  const openEdit = (p) => { setEditProduct(p); setShowForm(true) }

  /* ── form callbacks ── */
  const handleFormSuccess = () => { 
    setShowForm(false)
    setEditProduct(null)
    fetchProducts() // Refresh the list
  }
  const handleFormClose   = () => { setShowForm(false); setEditProduct(null) }

  /* ── stock helpers ── */
  const stockLabel = (s) => s === 0 ? 'Out of Stock' : s <= 10 ? 'Low Stock' : 'In Stock'
  const stockColor = (s) => s === 0 ? '#f87171' : s <= 10 ? '#f59e0b' : '#4ade80'

  const statCards = [
    { label: 'Total Products', val: stats.total,    icon: Package,      color: '#888',    bg: 'rgba(136,136,136,0.1)' },
    { label: 'In Stock',       val: stats.inStock,  icon: CheckCircle,  color: '#4ade80', bg: 'rgba(74,222,128,0.1)'  },
    { label: 'Low Stock',      val: stats.lowStock, icon: AlertCircle,  color: '#f59e0b', bg: 'rgba(245,158,11,0.1)'  },
    { label: 'Out of Stock',   val: stats.outStock, icon: XCircle,      color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
  ]

  /* ── show the AddProduct form ── */
  if (showForm) {
    return (
      <AddProduct
        selectedProduct={editProduct}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
      />
    )
  }

  if (loading) {
    return (
      <div className="pp" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="ap-spin" style={{ width: 40, height: 40, margin: '0 auto 20px' }}></div>
          <p style={{ color: 'var(--muted)' }}>Loading products...</p>
        </div>
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

        .pp { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; min-height: 100vh; padding: 32px 36px 80px; }
        @media(max-width:640px){ .pp { padding: 20px 16px 60px; } }

        .pp-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 28px; flex-wrap: wrap; }
        .pp-title { font-family: 'Playfair Display', serif; font-size: clamp(22px, 3vw, 30px); font-weight: 900; letter-spacing: -0.03em; color: var(--white); line-height: 1; margin-bottom: 5px; }
        .pp-subtitle { font-family: 'DM Mono', monospace; font-size: 10.5px; color: var(--faint); letter-spacing: 0.1em; text-transform: uppercase; }
        .pp-header-btns { display: flex; gap: 8px; flex-wrap: wrap; }

        .pp-btn { display: flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 11.5px; font-weight: 600; cursor: pointer; transition: all .18s; border: 1px solid transparent; white-space: nowrap; }
        .pp-btn-primary { background: var(--white); color: var(--bg); border-color: var(--white); }
        .pp-btn-primary:hover { background: #ddd; }
        .pp-btn-ghost { background: transparent; border-color: var(--line2); color: var(--muted); }
        .pp-btn-ghost:hover { border-color: var(--faint); color: var(--text); background: var(--raised); }
        .pp-btn-danger { background: rgba(248,113,113,0.1); border-color: rgba(248,113,113,0.25); color: #f87171; }
        .pp-btn-danger:hover { background: rgba(248,113,113,0.18); }

        .pp-label { font-family: 'DM Mono', monospace; font-size: 9.5px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--faint); margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
        .pp-label::after { content: ''; flex: 1; height: 1px; background: var(--line); }

        .pp-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 24px; }
        @media(max-width:900px){ .pp-stats { grid-template-columns: repeat(2, 1fr); } }

        .pp-stat { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 16px 18px; transition: border-color .2s, transform .2s; }
        .pp-stat:hover { border-color: var(--line2); transform: translateY(-2px); }
        .pp-stat-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        .pp-stat-icon { width: 30px; height: 30px; border-radius: 7px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .pp-stat-num { font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 700; color: var(--white); line-height: 1; margin-bottom: 3px; }
        .pp-stat-lbl { font-size: 11.5px; font-weight: 500; color: var(--muted); }

        .pp-bulk { background: rgba(255,255,255,0.04); border: 1px solid var(--line2); border-radius: 10px; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
        .pp-bulk-txt { font-size: 12.5px; font-weight: 600; color: var(--text); }
        .pp-bulk-sub { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--muted); margin-top: 1px; }

        .pp-panel { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }

        .pp-toolbar { padding: 14px 18px; border-bottom: 1px solid var(--line); display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .pp-panel-title { font-family: 'Playfair Display', serif; font-size: 15px; font-weight: 700; color: var(--white); display: flex; align-items: center; gap: 7px; }
        .pp-panel-title svg { color: var(--muted); }
        .pp-panel-count { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--faint); }

        .pp-search-wrap { position: relative; }
        .pp-search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--faint); pointer-events: none; }
        .pp-search { padding: 8px 10px 8px 32px; background: var(--raised); border: 1px solid var(--line); border-radius: 8px; font-size: 12px; font-family: 'DM Sans', sans-serif; color: var(--text); outline: none; width: 200px; transition: border-color .16s; }
        .pp-search::placeholder { color: var(--faint); }
        .pp-search:focus { border-color: var(--line2); }

        .pp-sel { padding: 7px 10px; background: var(--raised); border: 1px solid var(--line); border-radius: 8px; font-size: 11px; font-family: 'DM Mono', monospace; color: var(--muted); outline: none; cursor: pointer; transition: border-color .16s; }
        .pp-sel:focus { border-color: var(--line2); }

        .pp-view-toggle { display: flex; border: 1px solid var(--line); border-radius: 7px; overflow: hidden; }
        .pp-view-btn { width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; background: transparent; border: none; color: var(--faint); cursor: pointer; transition: all .16s; }
        .pp-view-btn.on { background: var(--raised); color: var(--text); }

        .pp-filter-row { padding: 10px 18px; border-bottom: 1px solid var(--line); display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

        .pp-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; padding: 16px; }
        @media(max-width:1100px){ .pp-grid { grid-template-columns: repeat(3, 1fr); } }
        @media(max-width:768px) { .pp-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; } }
        @media(max-width:400px) { .pp-grid { grid-template-columns: 1fr; } }

        .pp-card { background: var(--raised); border: 1px solid var(--line); border-radius: 10px; overflow: hidden; transition: border-color .2s, transform .2s; position: relative; }
        .pp-card:hover { border-color: var(--line2); transform: translateY(-2px); }
        .pp-card-check { position: absolute; top: 9px; left: 9px; z-index: 10; width: 14px; height: 14px; cursor: pointer; accent-color: var(--white); }
        .pp-card-img { height: 148px; background: #1a1a1a; overflow: hidden; position: relative; display: flex; align-items: center; justify-content: center; }
        .pp-card-img img { width: 100%; height: 100%; object-fit: contain; padding: 10px; transition: transform .5s; }
        .pp-card:hover .pp-card-img img { transform: scale(1.05); }
        .pp-card-img .pp-no-img { color: var(--faint); }

        .pp-card-stock-badge { position: absolute; top: 8px; right: 8px; padding: 2px 9px; border-radius: 100px; font-family: 'DM Mono', monospace; font-size: 9px; font-weight: 600; border: 1px solid; white-space: nowrap; }
        .pp-card-body { padding: 10px 12px 12px; }
        .pp-card-brand { font-size: 9px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--faint); margin-bottom: 4px; }
        .pp-card-name { font-family: 'Playfair Display', serif; font-size: 13px; font-weight: 700; color: var(--white); line-height: 1.3; margin-bottom: 6px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .pp-card-cats { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 8px; }
        .pp-cat-tag { padding: 2px 8px; border-radius: 4px; background: rgba(255,255,255,0.05); border: 1px solid var(--line2); font-family: 'DM Mono', monospace; font-size: 9px; color: var(--muted); }
        .pp-card-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 8px; border-top: 1px solid var(--line); }
        .pp-card-price { font-family: 'Playfair Display', serif; font-size: 14px; font-weight: 700; color: var(--white); }
        .pp-card-stock-txt { font-family: 'DM Mono', monospace; font-size: 9.5px; margin-top: 2px; }
        .pp-card-acts { display: flex; gap: 4px; }
        .pp-act-btn { width: 26px; height: 26px; border-radius: 6px; border: 1px solid var(--line); background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--muted); transition: all .15s; }
        .pp-act-btn:hover { border-color: var(--line2); background: var(--hover); color: var(--text); }
        .pp-act-btn.del:hover { border-color: rgba(248,113,113,0.4); background: rgba(248,113,113,0.08); color: #f87171; }

        .pp-edit-overlay { position: absolute; inset: 0; background: rgba(14,14,14,0.92); backdrop-filter: blur(4px); z-index: 20; display: flex; flex-direction: column; padding: 12px; gap: 8px; border-radius: 10px; }
        .pp-edit-lbl { font-family: 'DM Mono', monospace; font-size: 9px; color: var(--faint); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 2px; }
        .pp-edit-input { width: 100%; background: var(--raised); border: 1px solid var(--line2); border-radius: 6px; padding: 7px 10px; font-size: 12px; font-family: 'DM Sans', sans-serif; color: var(--text); outline: none; }
        .pp-edit-input:focus { border-color: var(--white); }
        .pp-edit-btns { display: flex; gap: 6px; margin-top: 2px; }
        .pp-edit-save { flex: 1; background: var(--white); color: var(--bg); border: none; border-radius: 6px; padding: 7px; font-size: 11px; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; }
        .pp-edit-save:hover { opacity: .85; }
        .pp-edit-cancel { width: 36px; background: transparent; border: 1px solid var(--line2); border-radius: 6px; color: var(--muted); cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .pp-edit-cancel:hover { border-color: #f87171; color: #f87171; }

        .pp-table-wrap { overflow-x: auto; }
        .pp-table { width: 100%; border-collapse: collapse; }
        .pp-table th { padding: 10px 14px; text-align: left; font-family: 'DM Mono', monospace; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--faint); border-bottom: 1px solid var(--line); font-weight: 500; }
        .pp-table td { padding: 11px 14px; border-bottom: 1px solid var(--line); font-size: 12.5px; color: var(--muted); }
        .pp-table tr:last-child td { border-bottom: none; }
        .pp-table tbody tr { transition: background .13s; }
        .pp-table tbody tr:hover { background: var(--raised); }
        .pp-table-thumb { width: 40px; height: 40px; border-radius: 7px; overflow: hidden; background: var(--hover); border: 1px solid var(--line); display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: var(--faint); }
        .pp-table-thumb img { width: 100%; height: 100%; object-fit: contain; padding: 4px; }
        .pp-table-name { font-weight: 600; color: var(--white); font-size: 12.5px; }
        .pp-table-brand { font-size: 9.5px; color: var(--faint); font-family: 'DM Mono', monospace; margin-top: 1px; }
        .pp-table-price { font-family: 'Playfair Display', serif; font-size: 13px; font-weight: 700; color: var(--white); }

        .pp-modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(8px); z-index: 500; display: flex; align-items: center; justify-content: center; padding: 24px; }
        .pp-modal { background: var(--surface); border: 1px solid var(--line2); border-radius: 16px; width: 100%; max-width: 560px; overflow: hidden; position: relative; max-height: 90vh; overflow-y: auto; }
        .pp-modal-close { position: absolute; top: 12px; right: 12px; z-index: 10; width: 32px; height: 32px; border-radius: 8px; background: var(--raised); border: 1px solid var(--line2); color: var(--muted); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all .15s; }
        .pp-modal-close:hover { border-color: var(--faint); color: var(--text); }
        .pp-modal-img { height: 240px; background: #1a1a1a; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .pp-modal-img img { width: 100%; height: 100%; object-fit: contain; padding: 20px; }
        .pp-modal-body { padding: 20px 24px 24px; }
        .pp-modal-cats { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 10px; }
        .pp-modal-name { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 900; color: var(--white); letter-spacing: -0.02em; margin-bottom: 6px; }
        .pp-modal-desc { font-size: 12.5px; color: var(--muted); line-height: 1.65; margin-bottom: 14px; }
        .pp-modal-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-top: 1px solid var(--line); }
        .pp-modal-row-lbl { font-family: 'DM Mono', monospace; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--faint); }
        .pp-modal-row-val { font-size: 13px; font-weight: 600; color: var(--text); }
        .pp-modal-price { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 700; color: var(--white); }
        .pp-modal-thumbs { display: flex; gap: 6px; padding: 10px 24px 0; overflow-x: auto; scrollbar-width: none; }
        .pp-modal-thumbs::-webkit-scrollbar { display: none; }
        .pp-modal-thumb { width: 48px; height: 48px; border-radius: 6px; overflow: hidden; flex-shrink: 0; border: 1.5px solid var(--line); cursor: pointer; transition: border-color .15s; background: #1a1a1a; }
        .pp-modal-thumb.on { border-color: var(--white); }
        .pp-modal-thumb img { width: 100%; height: 100%; object-fit: contain; padding: 4px; }

        .pp-empty { text-align: center; padding: 60px 20px; }
        .pp-empty-icon { width: 48px; height: 48px; border-radius: 12px; background: var(--raised); border: 1px solid var(--line); display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; color: var(--faint); }
        .pp-empty-title { font-family: 'Playfair Display', serif; font-size: 17px; font-weight: 700; color: var(--white); margin-bottom: 6px; }
        .pp-empty-sub { font-size: 12.5px; color: var(--muted); }

        .pp-colors { display: flex; gap: 4px; }
        .pp-color-dot { width: 10px; height: 10px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.15); }
        
        .ap-spin {
          width: 14px; height: 14px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.2); border-top-color: var(--white);
          animation: ap-spin .6s linear infinite;
        }
        @keyframes ap-spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="pp">

        {/* HEADER */}
        <div className="pp-header">
          <div>
            <h1 className="pp-title">Products</h1>
            <p className="pp-subtitle">Raijam Admin · {products.length} items in catalogue</p>
          </div>
          <div className="pp-header-btns">
            {selected.length > 0 && (
              <button className="pp-btn pp-btn-danger" onClick={deleteBulk}>
                <Trash2 size={13} /> Delete ({selected.length})
              </button>
            )}
            <button className="pp-btn pp-btn-primary" onClick={openAdd}>
              <Plus size={13} /> Add Product
            </button>
          </div>
        </div>

        {/* STAT CARDS */}
        <p className="pp-label">Catalogue Stats</p>
        <div className="pp-stats">
          {statCards.map(({ label, val, icon: Icon, color, bg }, i) => (
            <motion.div key={label} {...staggerAnim(i)} className="pp-stat">
              <div className="pp-stat-top">
                <div className="pp-stat-icon" style={{ background: bg, color }}>
                  <Icon size={14} />
                </div>
              </div>
              <div className="pp-stat-num">{val}</div>
              <div className="pp-stat-lbl">{label}</div>
            </motion.div>
          ))}
        </div>

        {/* BULK BAR */}
        <AnimatePresence>
          {selected.length > 0 && (
            <motion.div
              className="pp-bulk"
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              style={{ overflow: 'hidden' }}
            >
              <div>
                <div className="pp-bulk-txt">{selected.length} product{selected.length > 1 ? 's' : ''} selected</div>
                <div className="pp-bulk-sub">bulk actions</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="pp-btn pp-btn-danger" onClick={deleteBulk}><Trash2 size={12} /> Delete</button>
                <button className="pp-btn pp-btn-ghost" onClick={() => setSelected([])}>Clear</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PRODUCT PANEL */}
        <div className="pp-panel">

          {/* toolbar */}
          <div className="pp-toolbar">
            <div className="pp-panel-title">
              <ShoppingBag size={15} />
              All Products
              <span className="pp-panel-count">({filtered.length})</span>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div className="pp-view-toggle">
                <button className={`pp-view-btn${view === 'grid' ? ' on' : ''}`} onClick={() => setView('grid')}><Grid size={13} /></button>
                <button className={`pp-view-btn${view === 'list' ? ' on' : ''}`} onClick={() => setView('list')}><List size={13} /></button>
              </div>
              <div className="pp-search-wrap">
                <Search size={12} className="pp-search-icon" />
                <input className="pp-search" placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <select className="pp-sel" value={sort} onChange={e => setSort(e.target.value)}>
                <option value="name">Name A–Z</option>
                <option value="price-hi">Price ↓</option>
                <option value="price-lo">Price ↑</option>
                <option value="stock-hi">Stock ↓</option>
              </select>
            </div>
          </div>

          {/* filter row */}
          <div className="pp-filter-row">
            <select className="pp-sel" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
              <option value={ALL}>All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>)}
            </select>
            <select className="pp-sel" value={stockFilter} onChange={e => setStockFilter(e.target.value)}>
              <option value={ALL}>All Stock</option>
              <option value="in">In Stock</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>
            {filtered.length > 0 && (
              <button className="pp-btn pp-btn-ghost" style={{ padding: '5px 10px', fontSize: 11 }} onClick={toggleAll}>
                {selected.length === filtered.length ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>

          {/* GRID VIEW */}
          {filtered.length === 0 ? (
            <div className="pp-empty">
              <div className="pp-empty-icon"><ShoppingBag size={20} /></div>
              <p className="pp-empty-title">No products found</p>
              <p className="pp-empty-sub">Try adjusting your filters or <button onClick={openAdd} style={{ background: 'none', border: 'none', color: 'var(--white)', cursor: 'pointer', textDecoration: 'underline', font: 'inherit' }}>add a product</button>.</p>
            </div>
          ) : view === 'grid' ? (
            <div className="pp-grid">
              {filtered.map((p, idx) => {
                const isEditing = editing === p.id
                const sc = stockColor(p.stock)
                const sl = stockLabel(p.stock)
                return (
                  <motion.div key={p.id} {...staggerAnim(idx % 8)} className="pp-card">
                    <input type="checkbox" className="pp-card-check" checked={selected.includes(p.id)} onChange={() => toggleSel(p.id)} />
                    <div className="pp-card-img">
                      {p.images?.[0] ? <img src={p.images[0]} alt={p.name} /> : <Image size={26} className="pp-no-img" />}
                      <span className="pp-card-stock-badge" style={{ color: sc, borderColor: `${sc}44`, background: `${sc}12` }}>{sl}</span>
                    </div>
                    <div className="pp-card-body">
                      {p.brand?.trim() && <div className="pp-card-brand">{p.brand.trim()}</div>}
                      <div className="pp-card-name">{p.name}</div>
                      {p.category?.length > 0 && (
                        <div className="pp-card-cats">
                          {p.category.slice(0, 2).map((c, i) => <span key={i} className="pp-cat-tag">{c}</span>)}
                          {p.category.length > 2 && <span className="pp-cat-tag">+{p.category.length - 2}</span>}
                        </div>
                      )}
                      {p.colors?.length > 0 && (
                        <div className="pp-colors" style={{ marginBottom: 8 }}>
                          {p.colors.slice(0, 5).map((c, i) => <span key={i} className="pp-color-dot" style={{ background: c }} title={c} />)}
                        </div>
                      )}
                      <div className="pp-card-footer">
                        <div>
                          <div className="pp-card-price">{fmt(p.price)}</div>
                          <div className="pp-card-stock-txt" style={{ color: sc }}>{p.stock} in stock</div>
                        </div>
                        <div className="pp-card-acts">
                          <button className="pp-act-btn" title="Preview" onClick={() => setPreview(p)}><Eye size={12} /></button>
                          <button className="pp-act-btn" title="Edit" onClick={() => openEdit(p)}><Edit size={12} /></button>
                          <button className="pp-act-btn del" title="Delete" onClick={() => deleteOne(p.id)}><Trash2 size={12} /></button>
                        </div>
                      </div>
                    </div>
                    <AnimatePresence>
                      {isEditing && (
                        <motion.div className="pp-edit-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                          <div>
                            <div className="pp-edit-lbl">Name</div>
                            <input className="pp-edit-input" value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} />
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                            <div>
                              <div className="pp-edit-lbl">Price</div>
                              <input className="pp-edit-input" type="number" value={draft.price} onChange={e => setDraft(d => ({ ...d, price: e.target.value }))} />
                            </div>
                            <div>
                              <div className="pp-edit-lbl">Stock</div>
                              <input className="pp-edit-input" type="number" value={draft.stock} onChange={e => setDraft(d => ({ ...d, stock: e.target.value }))} />
                            </div>
                          </div>
                          <div className="pp-edit-btns">
                            <button className="pp-edit-save" onClick={() => saveEdit(p.id)}>Save</button>
                            <button className="pp-edit-cancel" onClick={cancelEdit}><X size={13} /></button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            /* LIST VIEW */
            <div className="pp-table-wrap">
              <table className="pp-table">
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>
                      <input type="checkbox" style={{ accentColor: 'var(--white)', cursor: 'pointer', width: 13, height: 13 }} checked={selected.length === filtered.length && filtered.length > 0} onChange={toggleAll} />
                    </th>
                    <th>Product</th><th>Price</th><th>Stock</th><th>Status</th><th>Categories</th><th>Colors</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, idx) => {
                    const sc = stockColor(p.stock); const sl = stockLabel(p.stock)
                    return (
                      <motion.tr key={p.id} {...staggerAnim(idx % 12)}>
                        <td><input type="checkbox" style={{ accentColor: 'var(--white)', cursor: 'pointer', width: 13, height: 13 }} checked={selected.includes(p.id)} onChange={() => toggleSel(p.id)} /></td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="pp-table-thumb">{p.images?.[0] ? <img src={p.images[0]} alt={p.name} /> : <Image size={13} />}</div>
                            <div>
                              <div className="pp-table-name">{p.name}</div>
                              {p.brand && <div className="pp-table-brand">{p.brand}</div>}
                            </div>
                          </div>
                        </td>
                        <td><div className="pp-table-price">{fmt(p.price)}</div></td>
                        <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 11.5, color: sc }}>{p.stock}</td>
                        <td><span style={{ padding: '2px 10px', borderRadius: '100px', fontFamily: 'DM Mono, monospace', fontSize: 9.5, fontWeight: 600, color: sc, borderColor: `${sc}44`, background: `${sc}12`, border: '1px solid', whiteSpace: 'nowrap' }}>{sl}</span></td>
                        <td><div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>{p.category?.slice(0, 2).map((c, i) => <span key={i} className="pp-cat-tag">{c}</span>)}</div></td>
                        <td><div className="pp-colors">{p.colors?.slice(0, 4).map((c, i) => <span key={i} className="pp-color-dot" style={{ background: c }} title={c} />)}</div></td>
                        <td>
                          <div style={{ display: 'flex', gap: 5 }}>
                            <button className="pp-act-btn" onClick={() => setPreview(p)}><Eye size={11} /></button>
                            <button className="pp-act-btn" onClick={() => openEdit(p)}><Edit size={11} /></button>
                            <button className="pp-act-btn del" onClick={() => deleteOne(p.id)}><Trash2 size={11} /></button>
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* PREVIEW MODAL */}
        <AnimatePresence>
          {preview && (
            <motion.div className="pp-modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={e => { if (e.target === e.currentTarget) setPreview(null) }}>
              <motion.div className="pp-modal" initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}>
                <button className="pp-modal-close" onClick={() => setPreview(null)}><X size={15} /></button>
                <PreviewGallery product={preview} />
                <div className="pp-modal-body">
                  {preview.category?.length > 0 && <div className="pp-modal-cats">{preview.category.map((c, i) => <span key={i} className="pp-cat-tag">{c}</span>)}</div>}
                  <div className="pp-modal-name">{preview.name}</div>
                  {preview.description && <p className="pp-modal-desc">{preview.description}</p>}
                  <div className="pp-modal-row"><span className="pp-modal-row-lbl">Price</span><span className="pp-modal-price">{fmt(preview.price)}</span></div>
                  <div className="pp-modal-row"><span className="pp-modal-row-lbl">Stock</span><span className="pp-modal-row-val" style={{ color: stockColor(preview.stock) }}>{preview.stock} · {stockLabel(preview.stock)}</span></div>
                  {preview.brand && <div className="pp-modal-row"><span className="pp-modal-row-lbl">Brand</span><span className="pp-modal-row-val">{preview.brand}</span></div>}
                  {preview.colors?.length > 0 && <div className="pp-modal-row"><span className="pp-modal-row-lbl">Colors</span><div className="pp-colors">{preview.colors.map((c, i) => <span key={i} className="pp-color-dot" style={{ background: c }} title={c} />)}</div></div>}
                  <div className="pp-modal-row" style={{ justifyContent: 'flex-end', borderTop: 'none', paddingTop: 12 }}>
                    <button className="pp-btn pp-btn-primary" style={{ padding: '8px 18px', fontSize: 11 }} onClick={() => { setPreview(null); openEdit(preview) }}>
                      <Edit size={12} /> Edit Product
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}

/* ── Preview gallery ── */
function PreviewGallery({ product }) {
  const [idx, setIdx] = useState(0)
  const imgs = product.images || []
  if (!imgs.length) return <div style={{ height: 200, background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444' }}><Image size={32} /></div>
  return (
    <>
      <div className="pp-modal-img" style={{ position: 'relative' }}>
        <AnimatePresence mode="wait">
          <motion.img key={idx} src={imgs[idx]} alt={product.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 20 }} />
        </AnimatePresence>
        {imgs.length > 1 && (
          <>
            <button onClick={() => setIdx(i => (i === 0 ? imgs.length - 1 : i - 1))} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', background: 'rgba(14,14,14,0.7)', border: '1px solid #333', borderRadius: 7, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#aaa' }}><ChevronLeft size={14} /></button>
            <button onClick={() => setIdx(i => (i === imgs.length - 1 ? 0 : i + 1))} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'rgba(14,14,14,0.7)', border: '1px solid #333', borderRadius: 7, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#aaa' }}><ChevronRight size={14} /></button>
          </>
        )}
      </div>
      {imgs.length > 1 && (
        <div className="pp-modal-thumbs">
          {imgs.map((img, i) => <div key={i} className={`pp-modal-thumb${idx === i ? ' on' : ''}`} onClick={() => setIdx(i)}><img src={img} alt={`${product.name} ${i + 1}`} /></div>)}
        </div>
      )}
    </>
  )
}