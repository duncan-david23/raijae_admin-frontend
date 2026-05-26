import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Package, 
  DollarSign, 
  Tag, 
  Layers, 
  Palette,
  Upload,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

const AddProduct = ({ selectedProduct, onClose, onSuccess }) => {
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [discount, setDiscount] = useState('');
  const [stock, setStock] = useState('');
  const [discountType, setDiscountType] = useState('');
  const [gender, setGender] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [input, setInput] = useState('');
  const [colorInput, setColorInput] = useState('');
  const [images, setImages] = useState(Array(6).fill(null));
  const [previewIndex, setPreviewIndex] = useState(0);
  const [imgArr, setImgArr] = useState([]);
  const [isAdding, setIsAdding] = useState(false);

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'];
  const genders = ['Male', 'Female', 'Unisex'];
  const discountTypes = [
    { value: '', label: 'No Discount' },
    { value: 'black-friday', label: 'Black Friday' },
    { value: 'xmas-slash', label: 'Xmas Slash' },
    { value: 'new-year-deal', label: 'New Year Deal' },
    { value: 'easter-special', label: 'Easter Special' },
    { value: 'back-to-school', label: 'Back to School' },
    { value: 'summer-sale', label: 'Summer Sale' },
    { value: 'winter-clearance', label: 'Winter Clearance' },
    { value: 'cyber-monday', label: 'Cyber Monday' },
    { value: 'flash-sale', label: 'Flash Sale' },
    { value: 'loyalty-reward', label: 'Loyalty Reward' },
    { value: 'first-time-user', label: 'First-Time User' },
    { value: 'regional-holiday', label: 'Regional Holiday' },
    { value: 'limited-time', label: 'Limited Time' },
    { value: 'clearance', label: 'Clearance' },
    { value: 'bundle-deal', label: 'Bundle Deal' },
    { value: 'student-discount', label: 'Student Discount' },
    { value: 'military-discount', label: 'Military Discount' },
    { value: 'birthday-special', label: 'Birthday Special' }
  ];

  useEffect(() => {
    if (selectedProduct) {
      setProductName(selectedProduct.name || "");
      setDescription(selectedProduct.description || "");
      setPrice(selectedProduct.price || "");
      setDiscount(selectedProduct.discount || "");
      setStock(selectedProduct.stock || "");
      setDiscountType(selectedProduct.discount_type || "");
      setCategories(selectedProduct.categories || []);
      setSelectedSizes(selectedProduct.sizes || []);
      setGender(selectedProduct.gender || "");
      setSelectedColors(selectedProduct.colors || []);

      if (selectedProduct.images?.length) {
        setImages(selectedProduct.images.map((url) => url || null));
        setImgArr(selectedProduct.images);
      }
    }
  }, [selectedProduct]);

  const calculateSalesPrice = () => {
    const priceNum = parseFloat(price) || 0;
    const discountNum = parseFloat(discount) || 0;
    return (priceNum - (priceNum * (discountNum / 100))).toFixed(2);
  };

  const submitProduct = async () => {
    // Validate required fields
    if (!productName.trim()) {
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

    setIsAdding(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Please log in to manage products');
        setIsAdding(false);
        return;
      }

      const token = session.access_token;
      const userId = session.user.id;

      const productData = {
        public_key: userId,
        skuid: selectedProduct?.sku || `SKU${Math.floor(100000 + Math.random() * 900000)}`,
        product_name: productName,
        product_description: description,
        product_price: parseFloat(price) || 0,
        // sales_price: calculateSalesPrice(),
        // product_discount: parseFloat(discount) || 0,
        // product_discount_type: discountType,
        gender: gender,
        product_stock: parseInt(stock) || 0,
        status: (parseInt(stock) || 0) > 0 ? 'In Stock' : 'Out of Stock',
        product_categories: categories,
        product_sizes: selectedSizes,
        product_colors: selectedColors,
      };

      const formData = new FormData();
      
      // Append product data
      Object.keys(productData).forEach(key => {
        if (Array.isArray(productData[key])) {
          formData.append(key, JSON.stringify(productData[key]));
        } else {
          formData.append(key, productData[key]);
        }
      });

      // Handle images
      const newFiles = imgArr.filter(file => file instanceof File);
      const existingUrls = imgArr.filter(file => typeof file === 'string');

      newFiles.forEach(file => {
        formData.append('product_images', file);
      });

      formData.append('existing_images', JSON.stringify(existingUrls));

      let response;
      if (selectedProduct) {
        response = await axios.put(
          `https://plx-bckend.onrender.com/api/users/products/plain-product/${selectedProduct.id}`,
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
          'https://plx-bckend.onrender.com/api/users/products/add-plain-product',
          formData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
      }

      toast.success(`Product ${selectedProduct ? 'updated' : 'added'} successfully!`);
      onSuccess();
      
    } catch (error) {
      console.error('Error submitting product:', error);
      toast.error(error.response?.data?.error || 'Failed to save product');
    } finally {
      setIsAdding(false);
    }
  };

  const handleImageChange = (e, index) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setImgArr(prev => {
      const updated = [...prev];
      updated[index] = file;
      return updated;
    });

    const reader = new FileReader();
    reader.onload = () => {
      setImages(prev => {
        const updatedImages = [...prev];
        updatedImages[index] = reader.result;
        return updatedImages;
      });
      setPreviewIndex(index);
    };
    reader.readAsDataURL(file);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      const category = input.trim().toLowerCase();
      if (!categories.includes(category)) {
        setCategories([...categories, category]);
        setInput('');
      }
    }
  };

  const handleColorKeyDown = (e) => {
    if (e.key === 'Enter' && colorInput.trim()) {
      e.preventDefault();
      const color = colorInput.trim();
      if (!selectedColors.includes(color)) {
        setSelectedColors([...selectedColors, color]);
        setColorInput('');
      }
    }
  };

  const removeCategory = (cat) => {
    setCategories(categories.filter(c => c !== cat));
  };

  const removeColor = (color) => {
    setSelectedColors(selectedColors.filter(c => c !== color));
  };

  const toggleSize = (size) => {
    setSelectedSizes(prev =>
      prev.includes(size)
        ? prev.filter(s => s !== size)
        : [...prev, size]
    );
  };

  const removeImage = (index) => {
    setImages(prev => {
      const updated = [...prev];
      updated[index] = null;
      return updated;
    });
    
    setImgArr(prev => {
      const updated = [...prev];
      updated[index] = null;
      return updated.filter(item => item !== null);
    });
    
    if (previewIndex === index) {
      const nextIndex = images.findIndex((img, idx) => idx !== index && img !== null);
      setPreviewIndex(nextIndex !== -1 ? nextIndex : 0);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {selectedProduct ? 'Edit Product' : 'Add New Product'}
            </h2>
            <p className="text-sm text-gray-500">
              {selectedProduct ? 'Update product details' : 'Add a new product to your catalog'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* General Information */}
        <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            General Information
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter product name"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price (GHC) *
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Describe your product..."
                required
              />
            </div>

            {/* Sizes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sizes
              </label>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => toggleSize(size)}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      selectedSizes.includes(size)
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender
              </label>
              <div className="flex flex-wrap gap-3">
                {genders.map((option) => (
                  <label
                    key={option}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="gender"
                      value={option}
                      checked={gender === option}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Pricing & Stock */}
        <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Pricing & Stock
          </h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discount (%)
              </label>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
                min="0"
                max="100"
              />
            </div> */}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock Quantity *
              </label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
                min="0"
                required
              />
            </div>
{/* 
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discount Type
              </label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {discountTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div> */}

            {/* <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Sales Price</p>
              <p className="text-2xl font-bold text-gray-900">
                GHC {calculateSalesPrice()}
              </p>
              <p className="text-xs text-gray-500 mt-1">After discount</p>
            </div> */}
          </div>
        </div>

        {/* Images */}
        <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Product Images
          </h3>
          
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Preview */}
            <div className="lg:col-span-2">
              <div className="mb-4 relative">
                {images[previewIndex] ? (
                  <>
                    <img
                      src={images[previewIndex]}
                      alt="Preview"
                      className="w-full h-64 object-contain rounded-lg border border-gray-200 bg-gray-50"
                    />
                    <button
                      onClick={() => removeImage(previewIndex)}
                      className="absolute top-2 right-2 p-1 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition-colors"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <div className="w-full h-64 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                    <Upload className="w-12 h-12 text-gray-400 mb-3" />
                    <p className="text-gray-500">Main preview image</p>
                    <p className="text-sm text-gray-400 mt-1">Click on thumbnail to upload</p>
                  </div>
                )}
              </div>
            </div>

            {/* Thumbnails */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Upload Images (Max 6)</p>
              <div className="grid grid-cols-3 gap-3">
                {images.map((img, idx) => (
                  <div key={idx} className="relative">
                    <label
                      className={`block cursor-pointer h-24 rounded-lg border-2 ${
                        previewIndex === idx ? 'border-blue-500' : 'border-gray-200'
                      } bg-gray-50 flex items-center justify-center group`}
                    >
                      {img ? (
                        <img
                          src={img}
                          alt={`Thumbnail ${idx}`}
                          onClick={() => setPreviewIndex(idx)}
                          className="w-full h-full object-contain rounded"
                        />
                      ) : (
                        <div className="text-gray-400">
                          <Upload className="w-6 h-6" />
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange(e, idx)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity rounded" />
                    </label>
                    {img && (
                      <button
                        onClick={() => removeImage(idx)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs"
                        title="Remove image"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Categories & Colors */}
        <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Categories & Colors
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Categories */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categories (Press Enter to add)
              </label>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
                placeholder="e.g. t-shirt, hoodie, accessory"
              />
              <div className="flex flex-wrap gap-2">
                {categories.map((cat, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-1"
                  >
                    {cat}
                    <button
                      type="button"
                      onClick={() => removeCategory(cat)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Colors */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Colors (Press Enter to add)
              </label>
              <input
                type="text"
                value={colorInput}
                onChange={(e) => setColorInput(e.target.value)}
                onKeyDown={handleColorKeyDown}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
                placeholder="e.g. Red, Sky Blue, Dark Green"
              />
              <div className="flex flex-wrap gap-2">
                {selectedColors.map((color, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-full text-sm flex items-center gap-1 text-white"
                    style={{ backgroundColor: color }}
                  >
                    {color}
                    <button
                      type="button"
                      onClick={() => removeColor(color)}
                      className="text-white hover:text-gray-200"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={submitProduct}
            disabled={isAdding || !productName || !price || !stock}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:opacity-90 transition-opacity font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAdding ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {selectedProduct ? 'Updating...' : 'Adding...'}
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                {selectedProduct ? 'Update Product' : 'Add Product'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddProduct;