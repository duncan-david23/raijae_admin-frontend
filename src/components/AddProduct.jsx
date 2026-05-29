import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Package, DollarSign, Layers, Image as ImageIcon,
  Upload, CheckCircle, ChevronLeft, Plus, Hash,
} from 'lucide-react'
import { products as existingProducts } from '../data/products'
import axios from 'axios'
import { toast } from 'react-toastify'
import { supabase } from '../lib/supabaseClient'

/* ── derive existing categories from products data ── */
const EXISTING_CATS = [...new Set(
  existingProducts.flatMap(p => p.category || []).map(c => c.toLowerCase())
)].sort()

const DISCOUNT_TYPES = [
  '', 'Black Friday', 'Xmas Slash', 'New Year Deal', 'Easter Special',
  'Flash Sale', 'Summer Sale', 'Winter Clearance', 'Cyber Monday',
  'Bundle Deal', 'Clearance', 'Limited Time', 'Student Discount',
]

export default function AddProduct({ selectedProduct, onClose, onSuccess }) {
  const [name,         setName]         = useState('')
  const [description,  setDescription]  = useState('')
  const [brand,        setBrand]        = useState('')
  const [price,        setPrice]        = useState('')
  const [discount,     setDiscount]     = useState('')
  const [discountType, setDiscountType] = useState('')
  const [stock,        setStock]        = useState('')
  const [categories,   setCategories]   = useState([])
  const [catInput,     setCatInput]     = useState('')
  const [colors,       setColors]       = useState([])
  const [colorInput,   setColorInput]   = useState('')
  const [images,       setImages]       = useState(Array(5).fill(null))  // preview URLs
  const [imageFiles,   setImageFiles]   = useState(Array(5).fill(null))  // raw files / existing URLs
  const [activeImg,    setActiveImg]    = useState(0)
  const [saving,       setSaving]       = useState(false)
  const [errors,       setErrors]       = useState({})

  /* ── pre-fill on edit ── */
  useEffect(() => {
    if (!selectedProduct) return
    setName(selectedProduct.name || '')
    setDescription(selectedProduct.description || '')
    setBrand(selectedProduct.brand || '')
    setPrice(String(selectedProduct.price || ''))
    setDiscount(String(selectedProduct.discount || ''))
    setDiscountType(selectedProduct.discountType || '')
    setStock(String(selectedProduct.stock || ''))
    setCategories(selectedProduct.category || [])
    setColors(selectedProduct.colors || [])
    if (selectedProduct.images?.length) {
      const imgs = selectedProduct.images.slice(0, 5)
      setImages([...imgs, ...Array(5 - imgs.length).fill(null)])
      setImageFiles([...imgs, ...Array(5 - imgs.length).fill(null)])
    }
  }, [selectedProduct])

  /* ── computed sales price ── */
  const salesPrice = (() => {
    const p = parseFloat(price) || 0
    const d = parseFloat(discount) || 0
    return (p - p * (d / 100)).toFixed(2)
  })()

  /* ── image upload ── */
  const handleImageFile = (e, idx) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5MB'); return }
    const reader = new FileReader()
    reader.onload = () => {
      setImages(prev => { const n = [...prev]; n[idx] = reader.result; return n })
      setImageFiles(prev => { const n = [...prev]; n[idx] = file; return n })
      setActiveImg(idx)
    }
    reader.readAsDataURL(file)
  }

  const removeImage = (idx) => {
    setImages(prev => { const n = [...prev]; n[idx] = null; return n })
    setImageFiles(prev => { const n = [...prev]; n[idx] = null; return n })
    if (activeImg === idx) setActiveImg(images.findIndex((im, i) => i !== idx && im) || 0)
  }

  /* ── categories ── */
  const addCat = (cat) => {
    const c = cat.trim().toLowerCase()
    if (c && !categories.includes(c)) setCategories(prev => [...prev, c])
    setCatInput('')
  }
  const handleCatKey = (e) => { if (e.key === 'Enter') { e.preventDefault(); addCat(catInput) } }
  const removeCat = (c) => setCategories(prev => prev.filter(x => x !== c))

  /* ── colors ── */
  const handleColorKey = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const c = colorInput.trim()
      if (c && !colors.includes(c)) setColors(prev => [...prev, c])
      setColorInput('')
    }
  }
  const removeColor = (c) => setColors(prev => prev.filter(x => x !== c))

  /* ── validate + submit ── */
  const validate = () => {
    const e = {}
    if (!name.trim())              e.name  = 'Product name is required'
    if (!price || parseFloat(price) <= 0) e.price = 'Enter a valid price'
    if (stock === '' || parseInt(stock) < 0) e.stock = 'Enter a valid stock quantity'
    setErrors(e)
    return Object.keys(e).length === 0
  }

 const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Validate required fields
  if (!validate()) return;
  
  if (!name.trim()) {
    toast.error('Product name is required');
    return;
  }
  if (!price || parseFloat(price) <= 0) {
    toast.error('Price must be greater than 0');
    return;
  }
  if (!stock || parseInt(stock) < 0) {
    toast.error('Stock must be a valid number');
    return;
  }

  setSaving(true);

  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast.error('Please log in to manage products');
      setSaving(false);
      return;
    }

    const token = session.access_token;
    const userId = session.user.id;

    // Prepare FormData
    const formData = new FormData();
    
    // Add basic fields (not arrays)
    formData.append('public_key', userId);
    formData.append('skuid', selectedProduct?.sku || `RAIJAM${Math.floor(100000 + Math.random() * 900000)}`);
    formData.append('product_name', name);
    formData.append('product_description', description);
    formData.append('product_price', parseFloat(price) || 0);
    formData.append('product_discount', parseFloat(discount) || 0);
    formData.append('product_discount_type', discountType);
    formData.append('brand', brand);
    formData.append('product_stock', parseInt(stock) || 0);
    formData.append('status', (parseInt(stock) || 0) > 0 ? 'In Stock' : 'Out of Stock');
    
    // For arrays, stringify them
    formData.append('product_categories', JSON.stringify(categories));
    formData.append('product_colors', JSON.stringify(colors));

    // Prepare image files
    const newFiles = imageFiles.filter(file => file instanceof File);
    const existingUrls = imageFiles.filter(file => typeof file === 'string');

    // Append images
    newFiles.forEach(file => {
      formData.append('product_images', file);
    });

    formData.append('existing_images', JSON.stringify(existingUrls));

    // Console log for debugging
    console.log('=== SUBMITTING PRODUCT ===');
    console.log('Categories (array):', categories);
    console.log('Colors (array):', colors);
    console.log('Categories (stringified):', JSON.stringify(categories));
    console.log('Colors (stringified):', JSON.stringify(colors));
    console.log('FormData entries:');
    for (let pair of formData.entries()) {
      console.log(pair[0], pair[1]);
    }
    console.log('==========================');

    let response;
    if (selectedProduct) {
      response = await axios.put(
        `https://raijae-backend.onrender.com/api/users/products/product/${selectedProduct.id}`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
    } else {
      response = await axios.post(
        'https://raijae-backend.onrender.com/api/users/products/add-product',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
    }

    console.log('Response:', response.data);
    toast.success(`Product ${selectedProduct ? 'updated' : 'added'} successfully!`);
    onSuccess();
    
  } catch (error) {
    console.error('Error submitting product:', error);
    console.error('Error response:', error.response?.data);
    toast.error(error.response?.data?.error || 'Failed to save product');
  } finally {
    setSaving(false);
  }
}



  /* ── filtered category suggestions ── */
  const catSuggestions = EXISTING_CATS.filter(
    c => c.includes(catInput.toLowerCase()) && !categories.includes(c) && catInput.trim()
  )

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
          --red:     #f87171;
        }

        .ap {
          background: var(--bg); color: var(--text);
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh; padding: 0;
        }

        /* ── TOPBAR ── */
        .ap-topbar {
          display: flex; align-items: center; gap: 14px;
          padding: 18px 28px; border-bottom: 1px solid var(--line);
          background: var(--surface); position: sticky; top: 0; z-index: 50;
        }
        .ap-back {
          width: 32px; height: 32px; border-radius: 8px;
          background: transparent; border: 1px solid var(--line2);
          color: var(--muted); cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all .15s;
        }
        .ap-back:hover { border-color: var(--faint); color: var(--text); }
        .ap-topbar-title {
          font-family: 'Playfair Display', serif;
          font-size: 17px; font-weight: 700; color: var(--white);
        }
        .ap-topbar-sub {
          font-family: 'DM Mono', monospace; font-size: 10px;
          color: var(--faint); letter-spacing: 0.08em; text-transform: uppercase;
          margin-left: 2px;
        }

        /* ── FORM BODY ── */
        .ap-body {
          padding: 28px 28px 80px;
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 20px;
          max-width: 1100px;
        }
        @media(max-width:900px){ .ap-body { grid-template-columns: 1fr; } }
        @media(max-width:640px){ .ap-body { padding: 20px 16px 60px; } }

        /* ── SECTION ── */
        .ap-section {
          background: var(--surface); border: 1px solid var(--line);
          border-radius: 12px; padding: 20px 22px; margin-bottom: 14px;
        }
        .ap-section-title {
          font-family: 'Playfair Display', serif;
          font-size: 14px; font-weight: 700; color: var(--white);
          display: flex; align-items: center; gap: 7px;
          margin-bottom: 18px;
        }
        .ap-section-title svg { color: var(--muted); }

        /* ── FIELD ── */
        .ap-field { margin-bottom: 16px; }
        .ap-field:last-child { margin-bottom: 0; }
        .ap-label {
          display: flex; align-items: center; gap: 6px;
          font-family: 'DM Mono', monospace; font-size: 9.5px;
          text-transform: uppercase; letter-spacing: 0.12em;
          color: var(--faint); margin-bottom: 7px;
        }
        .ap-opt {
          font-size: 8.5px; color: var(--faint);
          background: var(--raised); border: 1px solid var(--line);
          padding: 1px 6px; border-radius: 4px; letter-spacing: 0.06em;
          margin-left: auto;
        }
        .ap-input {
          width: 100%; background: var(--raised); border: 1px solid var(--line);
          border-radius: 8px; padding: 10px 13px;
          font-size: 13px; font-family: 'DM Sans', sans-serif;
          color: var(--text); outline: none; transition: border-color .16s;
        }
        .ap-input::placeholder { color: var(--faint); }
        .ap-input:focus { border-color: var(--line2); }
        .ap-input.err { border-color: var(--red); }
        .ap-textarea {
          resize: vertical; min-height: 90px; line-height: 1.6;
        }
        .ap-select { appearance: none; cursor: pointer; }
        .ap-err-msg { font-size: 10.5px; color: var(--red); margin-top: 4px; letter-spacing: 0.02em; }

        .ap-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media(max-width:500px){ .ap-grid-2 { grid-template-columns: 1fr; } }

        /* ── TAGS (categories / colors) ── */
        .ap-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
        .ap-tag {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 10px 4px 12px; border-radius: 100px;
          background: var(--raised); border: 1px solid var(--line2);
          font-size: 11px; font-weight: 500; color: var(--text);
          white-space: nowrap;
        }
        .ap-tag-x {
          background: none; border: none; cursor: pointer;
          color: var(--faint); display: flex; align-items: center;
          padding: 0; line-height: 1; transition: color .14s;
        }
        .ap-tag-x:hover { color: var(--red); }

        /* color tag */
        .ap-color-tag {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 10px 4px 8px; border-radius: 100px;
          border: 1px solid var(--line2); font-size: 11px; font-weight: 500;
          color: var(--text); white-space: nowrap; background: var(--raised);
        }
        .ap-color-swatch {
          width: 10px; height: 10px; border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.15); flex-shrink: 0;
        }

        /* ── SUGGESTIONS DROPDOWN ── */
        .ap-suggestions {
          background: var(--raised); border: 1px solid var(--line2);
          border-radius: 8px; overflow: hidden; margin-top: 4px;
        }
        .ap-sug-item {
          padding: 9px 13px; font-size: 12px; color: var(--muted);
          cursor: pointer; transition: background .12s;
          display: flex; align-items: center; gap: 8px;
        }
        .ap-sug-item:hover { background: var(--hover); color: var(--text); }

        /* ── INPUT ROW (with add button) ── */
        .ap-input-row { display: flex; gap: 6px; }
        .ap-add-inline {
          flex-shrink: 0; width: 36px; height: 36px; border-radius: 7px;
          background: var(--raised); border: 1px solid var(--line2);
          color: var(--muted); cursor: pointer; display: flex;
          align-items: center; justify-content: center; transition: all .15s;
          align-self: flex-start; margin-top: 0;
        }
        .ap-add-inline:hover { border-color: var(--white); color: var(--white); }

        /* ── SALES PRICE BOX ── */
        .ap-sales-box {
          background: var(--raised); border: 1px solid var(--line);
          border-radius: 10px; padding: 14px 16px; margin-top: 14px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .ap-sales-label { font-family: 'DM Mono', monospace; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--faint); margin-bottom: 4px; }
        .ap-sales-val { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 700; color: var(--white); }
        .ap-sales-note { font-size: 10.5px; color: var(--faint); margin-top: 2px; }

        /* ── IMAGE PANEL ── */
        .ap-img-panel {
          background: var(--surface); border: 1px solid var(--line);
          border-radius: 12px; padding: 20px 22px;
          position: sticky; top: 90px; align-self: flex-start;
        }
        @media(max-width:900px){ .ap-img-panel { position: static; } }

        .ap-img-preview {
          width: 100%; aspect-ratio: 1/1; border-radius: 10px;
          background: #1a1a1a; overflow: hidden; position: relative;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 12px; border: 1px solid var(--line);
        }
        .ap-img-preview img { width: 100%; height: 100%; object-fit: contain; padding: 16px; }
        .ap-img-no { color: var(--faint); display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .ap-img-no span { font-size: 11px; color: var(--faint); }

        .ap-thumbs { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; }
        .ap-thumb-wrap { position: relative; }
        .ap-thumb {
          aspect-ratio: 1/1; border-radius: 7px; overflow: hidden;
          border: 1.5px solid var(--line); background: #1a1a1a;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: border-color .15s; position: relative;
        }
        .ap-thumb.active { border-color: var(--white); }
        .ap-thumb:hover:not(.active) { border-color: var(--line2); }
        .ap-thumb img { width: 100%; height: 100%; object-fit: contain; padding: 4px; }
        .ap-thumb-empty { color: var(--faint); }
        .ap-thumb-file { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
        .ap-thumb-rm {
          position: absolute; top: -4px; right: -4px; z-index: 5;
          width: 16px; height: 16px; border-radius: 50%;
          background: var(--red); color: #fff; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center; font-size: 9px;
          line-height: 1;
        }

        /* ── SUBMIT ── */
        .ap-footer {
          padding: 16px 28px; border-top: 1px solid var(--line);
          background: var(--surface);
          display: flex; justify-content: flex-end; gap: 10px;
          position: sticky; bottom: 0; z-index: 50;
        }
        .ap-cancel-btn {
          padding: 10px 20px; border-radius: 8px; cursor: pointer;
          background: transparent; border: 1px solid var(--line2);
          color: var(--muted); font-family: 'DM Sans', sans-serif;
          font-size: 12px; font-weight: 600; transition: all .16s;
        }
        .ap-cancel-btn:hover { border-color: var(--faint); color: var(--text); }
        .ap-submit-btn {
          padding: 10px 24px; border-radius: 8px; cursor: pointer;
          background: var(--white); color: var(--bg); border: none;
          font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 700;
          display: flex; align-items: center; gap: 7px;
          transition: opacity .16s; letter-spacing: 0.04em;
        }
        .ap-submit-btn:hover { opacity: .85; }
        .ap-submit-btn:disabled { opacity: .4; cursor: not-allowed; }
        .ap-spin {
          width: 14px; height: 14px; border-radius: 50%;
          border: 2px solid rgba(0,0,0,0.2); border-top-color: #000;
          animation: ap-spin .6s linear infinite;
        }
        @keyframes ap-spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="ap">
        {/* ── TOPBAR ── */}
        <div className="ap-topbar">
          <button className="ap-back" onClick={onClose}><ChevronLeft size={15} /></button>
          <div>
            <div className="ap-topbar-title">{selectedProduct ? 'Edit Product' : 'Add New Product'}</div>
            <div className="ap-topbar-sub">Raijam Admin · Catalogue</div>
          </div>
        </div>

        {/* ── FORM ── */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="ap-body">

            {/* ── LEFT COLUMN ── */}
            <div>

              {/* General */}
              <div className="ap-section">
                <div className="ap-section-title"><Package size={14} /> General Information</div>

                <div className="ap-field">
                  <div className="ap-label">Product Name</div>
                  <input
                    className={`ap-input${errors.name ? ' err' : ''}`}
                    placeholder="e.g. Golden Ceramic Bowl"
                    value={name} onChange={e => setName(e.target.value)}
                  />
                  {errors.name && <p className="ap-err-msg">{errors.name}</p>}
                </div>

                <div className="ap-field">
                  <div className="ap-label">
                    Brand
                    <span className="ap-opt">optional</span>
                  </div>
                  <input
                    className="ap-input"
                    placeholder="e.g. Urban Luxe"
                    value={brand} onChange={e => setBrand(e.target.value)}
                  />
                </div>

                <div className="ap-field">
                  <div className="ap-label">
                    Description
                    <span className="ap-opt">optional</span>
                  </div>
                  <textarea
                    className="ap-input ap-textarea"
                    placeholder="Describe the product — material, use, style…"
                    value={description} onChange={e => setDescription(e.target.value)}
                  />
                </div>
              </div>

              {/* Pricing & Stock */}
              <div className="ap-section">
                <div className="ap-section-title"><DollarSign size={14} /> Pricing &amp; Stock</div>

                <div className="ap-grid-2">
                  <div className="ap-field">
                    <div className="ap-label">Price (GHC)</div>
                    <input
                      className={`ap-input${errors.price ? ' err' : ''}`}
                      type="number" min="0" step="0.01" placeholder="0.00"
                      value={price} onChange={e => setPrice(e.target.value)}
                    />
                    {errors.price && <p className="ap-err-msg">{errors.price}</p>}
                  </div>

                  <div className="ap-field">
                    <div className="ap-label">
                      Discount (%)
                      <span className="ap-opt">optional</span>
                    </div>
                    <input
                      className="ap-input"
                      type="number" min="0" max="100" placeholder="0"
                      value={discount} onChange={e => setDiscount(e.target.value)}
                    />
                  </div>

                  <div className="ap-field">
                    <div className="ap-label">Stock Quantity</div>
                    <input
                      className={`ap-input${errors.stock ? ' err' : ''}`}
                      type="number" min="0" placeholder="0"
                      value={stock} onChange={e => setStock(e.target.value)}
                    />
                    {errors.stock && <p className="ap-err-msg">{errors.stock}</p>}
                  </div>

                  <div className="ap-field">
                    <div className="ap-label">
                      Discount Type
                      <span className="ap-opt">optional</span>
                    </div>
                    <select
                      className="ap-input ap-select"
                      value={discountType} onChange={e => setDiscountType(e.target.value)}
                    >
                      <option value="">No Discount</option>
                      {DISCOUNT_TYPES.filter(Boolean).map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Sales price display */}
                {(parseFloat(discount) > 0 && parseFloat(price) > 0) && (
                  <div className="ap-sales-box">
                    <div>
                      <div className="ap-sales-label">Sales Price (after discount)</div>
                      <div className="ap-sales-val">GHC {salesPrice}</div>
                      <div className="ap-sales-note">{discount}% off GHC {parseFloat(price).toFixed(2)}</div>
                    </div>
                    <CheckCircle size={20} color="#4ade80" strokeWidth={1.5} />
                  </div>
                )}
              </div>

              {/* Categories & Colors */}
              <div className="ap-section">
                <div className="ap-section-title"><Layers size={14} /> Categories &amp; Colors</div>

                {/* Categories */}
                <div className="ap-field" style={{ marginBottom: 20 }}>
                  <div className="ap-label">Categories</div>
                  <div className="ap-input-row">
                    <div style={{ flex: 1, position: 'relative' }}>
                      <input
                        className="ap-input"
                        style={{ marginBottom: 0 }}
                        placeholder="Type to search or add a category…"
                        value={catInput}
                        onChange={e => setCatInput(e.target.value)}
                        onKeyDown={handleCatKey}
                      />
                      <AnimatePresence>
                        {catSuggestions.length > 0 && (
                          <motion.div
                            className="ap-suggestions"
                            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.14 }}
                            style={{ position: 'absolute', left: 0, right: 0, zIndex: 20, top: '100%', marginTop: 2 }}
                          >
                            {catSuggestions.map(c => (
                              <div key={c} className="ap-sug-item" onClick={() => addCat(c)}>
                                <Hash size={11} style={{ color: '#444', flexShrink: 0 }} />
                                {c}
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <button
                      type="button"
                      className="ap-add-inline"
                      onClick={() => addCat(catInput)}
                      style={{ height: 38 }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <p style={{ fontSize: 10, color: 'var(--faint)', marginTop: 5, fontFamily: 'DM Mono, monospace' }}>
                    Press Enter or click + to add · type to search existing
                  </p>

                  {/* Existing category quick-picks */}
                  {categories.length === 0 && catInput === '' && (
                    <div style={{ marginTop: 10 }}>
                      <p style={{ fontSize: 9.5, color: 'var(--faint)', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                        Existing categories
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {EXISTING_CATS.map(c => (
                          <button
                            key={c} type="button"
                            onClick={() => addCat(c)}
                            style={{
                              padding: '3px 10px', borderRadius: '100px',
                              background: 'transparent', border: '1px solid var(--line2)',
                              fontSize: 10.5, color: 'var(--muted)', cursor: 'pointer',
                              fontFamily: 'DM Sans, sans-serif', transition: 'all .14s',
                            }}
                            onMouseOver={e => { e.target.style.borderColor = 'var(--white)'; e.target.style.color = 'var(--white)' }}
                            onMouseOut={e => { e.target.style.borderColor = 'var(--line2)'; e.target.style.color = 'var(--muted)' }}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {categories.length > 0 && (
                    <div className="ap-tags">
                      {categories.map(c => (
                        <span key={c} className="ap-tag">
                          {c}
                          <button type="button" className="ap-tag-x" onClick={() => removeCat(c)}><X size={10} /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Colors */}
                <div className="ap-field">
                  <div className="ap-label">
                    Colors
                    <span className="ap-opt">optional</span>
                  </div>
                  <div className="ap-input-row">
                    <input
                      className="ap-input"
                      style={{ flex: 1 }}
                      placeholder="e.g. red, #3b82f6, sky blue — press Enter"
                      value={colorInput}
                      onChange={e => setColorInput(e.target.value)}
                      onKeyDown={handleColorKey}
                    />
                    <button
                      type="button"
                      className="ap-add-inline"
                      style={{ height: 38 }}
                      onClick={() => {
                        const c = colorInput.trim()
                        if (c && !colors.includes(c)) setColors(prev => [...prev, c])
                        setColorInput('')
                      }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <p style={{ fontSize: 10, color: 'var(--faint)', marginTop: 5, fontFamily: 'DM Mono, monospace' }}>
                    Enter any color name or hex code
                  </p>

                  {colors.length > 0 && (
                    <div className="ap-tags">
                      {colors.map((c, i) => (
                        <span key={i} className="ap-color-tag">
                          <span className="ap-color-swatch" style={{ background: c }} />
                          {c}
                          <button type="button" className="ap-tag-x" onClick={() => removeColor(c)}><X size={10} /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN — IMAGE PANEL ── */}
            <div>
              <div className="ap-img-panel">
                <div className="ap-section-title"><ImageIcon size={14} /> Product Images</div>

                {/* Main preview */}
                <div className="ap-img-preview">
                  {images[activeImg]
                    ? <img src={images[activeImg]} alt="preview" />
                    : (
                      <div className="ap-img-no">
                        <Upload size={28} />
                        <span>Upload images below</span>
                      </div>
                    )
                  }
                </div>

                {/* 5 thumbnail slots */}
                <div className="ap-thumbs">
                  {images.map((img, idx) => (
                    <div key={idx} className="ap-thumb-wrap">
                      <div
                        className={`ap-thumb${activeImg === idx && img ? ' active' : ''}`}
                        onClick={() => img && setActiveImg(idx)}
                      >
                        {img
                          ? <img src={img} alt={`img-${idx}`} />
                          : <Upload size={13} className="ap-thumb-empty" />
                        }
                        <input
                          type="file" accept="image/*"
                          className="ap-thumb-file"
                          onChange={e => handleImageFile(e, idx)}
                        />
                      </div>
                      {img && (
                        <button
                          type="button"
                          className="ap-thumb-rm"
                          onClick={() => removeImage(idx)}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <p style={{ fontSize: 9.5, color: 'var(--faint)', fontFamily: 'DM Mono, monospace', marginTop: 10, textAlign: 'center', letterSpacing: '0.06em' }}>
                  UP TO 5 IMAGES · MAX 5MB EACH
                </p>
              </div>
            </div>
          </div>

          {/* ── FOOTER ── */}
          <div className="ap-footer">
            <button type="button" className="ap-cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="ap-submit-btn" disabled={saving}>
              {saving
                ? <><div className="ap-spin" /> Saving…</>
                : <><CheckCircle size={14} /> {selectedProduct ? 'Update Product' : 'Add Product'}</>
              }
            </button>
          </div>
        </form>
      </div>
    </>
  )
}