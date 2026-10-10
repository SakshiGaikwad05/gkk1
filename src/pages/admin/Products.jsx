import { useEffect, useState, useCallback, useRef } from 'react';
import adminApi from '../../utils/adminApi';
import Toast from '../../components/Toast';

const API_BASE = import.meta.env.VITE_API_URL || 'https://gkk1.onrender.com';
console.log('[Products.jsx] import.meta.env.VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('[Products.jsx] API_BASE resolved:', API_BASE);

const CATEGORIES = [];
const SUBCATEGORIES = {};

const UNITS = ['piece', 'kg', 'g', 'l', 'ml', 'packet', 'bottle', 'bag', 'box', 'set'];

const EMPTY_PRODUCT = {
  name: '', category: '', subcategory: '', brand: '',
  shortDescription: '', description: '',
  mrp: '', price: '', discount: 0, gst: 0,
  stock: 0, lowStockAlert: 0, unit: 'piece', weight: '',
  suitableCrops: '', targetPests: '',
  dosage: '', composition: '', benefits: '', safetyInstructions: '',
  featured: false, bestSeller: false, newArrival: false, limitedOffer: false,
  showOnBanner: false, bannerTitle: '', bannerSubtitle: '', bannerButtonText: 'Shop Now',
  status: 'draft', expiryDate: '',
};

const SECTIONS = [
  { id: 'basic', label: 'Basic Information' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'images', label: 'Product Images' },
  { id: 'agriculture', label: 'Agriculture Details' },
  { id: 'display', label: 'Homepage Display' },
];

const ProductModal = ({ product, onSave, onClose, showToast = () => {} }) => {
  const [form, setForm] = useState({ ...EMPTY_PRODUCT, ...product });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [newFiles, setNewFiles] = useState([]);
  const [newPreviews, setNewPreviews] = useState([]);
  const [existingImages, setExistingImages] = useState(product?.images || []);
  const [dragOver, setDragOver] = useState(false);
  const [activeSection, setActiveSection] = useState('basic');
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const fileInputRef = useRef(null);
  const formRef = useRef(null);

  const isEditing = Boolean(product?._id);

  useEffect(() => {
    adminApi.get('/categories').then((r) => setCategories(r.data?.data?.categories || [])).catch(() => {});
    adminApi.get('/brands').then((r) => setBrands(r.data?.data?.brands || [])).catch(() => {});
  }, []);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    return () => { newPreviews.forEach((p) => URL.revokeObjectURL(p)); };
  }, [newPreviews]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const validate = () => {
    if (!form.name?.trim()) return 'Product name is required.';
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 0) return 'Valid selling price is required.';
    if (!form.category) return 'Category is required.';
    if (!form.expiryDate && !isEditing) return 'Expiry date is required.';
    if (form.expiryDate && new Date(form.expiryDate) < new Date(new Date().toDateString())) return 'Expiry date cannot be in the past.';
    return '';
  };

  const processFiles = (files) => {
    const valid = [];
    const previews = [];
    for (const file of files) {
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) continue;
      if (file.size > 5 * 1024 * 1024) continue;
      valid.push(file);
      previews.push(URL.createObjectURL(file));
    }
    setNewFiles((prev) => [...prev, ...valid]);
    setNewPreviews((prev) => [...prev, ...previews]);
    setError('');
  };

  const handleFileSelect = (e) => {
    if (e.target.files) processFiles(Array.from(e.target.files));
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) processFiles(Array.from(e.dataTransfer.files));
  };

  const removeNewImage = (index) => {
    URL.revokeObjectURL(newPreviews[index]);
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
    setNewPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (imgPath) => {
    setExistingImages((prev) => prev.filter((img) => img !== imgPath));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    if (!isEditing && newFiles.length === 0) {
      setError('Please upload at least one product image.');
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name.trim());
      fd.append('category', form.category);
      if (form.subcategory) fd.append('subcategory', form.subcategory);
      if (form.brand) fd.append('brand', form.brand.trim());
      if (form.expiryDate) fd.append('expiryDate', form.expiryDate);
      if (form.shortDescription) fd.append('shortDescription', form.shortDescription.trim());
      if (form.description) fd.append('description', form.description.trim());
      fd.append('mrp', Number(form.mrp) || 0);
      fd.append('price', Number(form.price));
      fd.append('discount', Number(form.discount) || 0);
      fd.append('gst', Number(form.gst) || 0);
      fd.append('stock', Number(form.stock) || 0);
      fd.append('lowStockAlert', Number(form.lowStockAlert) || 0);
      fd.append('unit', form.unit || 'piece');
      if (form.weight) fd.append('weight', form.weight);
      if (form.suitableCrops) fd.append('suitableCrops', JSON.stringify(form.suitableCrops.split(',').map(s => s.trim()).filter(Boolean)));
      if (form.targetPests) fd.append('targetPests', JSON.stringify(form.targetPests.split(',').map(s => s.trim()).filter(Boolean)));
      if (form.dosage) fd.append('dosage', form.dosage.trim());
      if (form.composition) fd.append('composition', form.composition.trim());
      if (form.benefits) fd.append('benefits', form.benefits.trim());
      if (form.safetyInstructions) fd.append('safetyInstructions', form.safetyInstructions.trim());
      fd.append('featured', form.featured ? 'true' : 'false');
      fd.append('bestSeller', form.bestSeller ? 'true' : 'false');
      fd.append('newArrival', form.newArrival ? 'true' : 'false');
      fd.append('limitedOffer', form.limitedOffer ? 'true' : 'false');
      fd.append('showOnBanner', form.showOnBanner ? 'true' : 'false');
      if (form.bannerTitle) fd.append('bannerTitle', form.bannerTitle.trim());
      if (form.bannerSubtitle) fd.append('bannerSubtitle', form.bannerSubtitle.trim());
      if (form.bannerButtonText) fd.append('bannerButtonText', form.bannerButtonText.trim());
      fd.append('status', form.status || 'draft');

      if (isEditing) {
        const removed = (product?.images || []).filter((img) => !existingImages.includes(img));
        removed.forEach((img) => fd.append('removedImages', img));
      }

      newFiles.forEach((file) => fd.append('images', file));

      const config = { headers: { 'Content-Type': 'multipart/form-data' } };

      if (isEditing) {
        console.log('[Products.jsx] Sending PUT to:', adminApi.defaults.baseURL + `/products/${product._id}`);
        const res = await adminApi.put(`/products/${product._id}`, fd, config);
        onSave(res.data?.data?.product);
      } else {
        console.log('[Products.jsx] Sending POST to:', adminApi.defaults.baseURL + '/products');
        const res = await adminApi.post('/products', fd, config);
        onSave(res.data?.data?.product);
      }
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to save product.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const scrollToSection = (id) => {
    setActiveSection(id);
    const el = document.getElementById(`section-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const inp = (field, opts = {}) => {
    const { label, type = 'text', placeholder, min, max, step, rows, required } = opts;
    const val = form[field] ?? '';
    return (
      <div className={opts.className || ''}>
        {label && <label className="block text-sm font-bold text-gray-700 mb-1">{label}{required && ' *'}</label>}
        {rows ? (
          <textarea rows={rows} value={val} onChange={(e) => handleChange(field, e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-agri-green/25 focus:border-agri-green outline-none resize-none" />
        ) : (
          <input type={type} value={val} onChange={(e) => handleChange(field, e.target.value)}
            min={min} max={max} step={step} placeholder={placeholder}
            className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-agri-green/25 focus:border-agri-green outline-none" />
        )}
      </div>
    );
  };

  const sel = (field, options, opts = {}) => {
    const val = form[field] ?? '';
    return (
      <div className={opts.className || ''}>
        {opts.label && <label className="block text-sm font-bold text-gray-700 mb-1">{opts.label}{opts.required && ' *'}</label>}
        <select value={val} onChange={(e) => handleChange(field, e.target.value)}
          className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-agri-green/25 focus:border-agri-green outline-none">
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    );
  };

  const toggle = (field, label) => (
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" checked={!!form[field]} onChange={(e) => handleChange(field, e.target.checked)}
        className="w-4 h-4 rounded border-gray-300 text-agri-green focus:ring-agri-green" />
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </label>
  );

  const catNames = categories.filter((c) => c.active !== false).map((c) => c.name);
  const brandNames = brands.filter((b) => b.active !== false).map((b) => b.name);

  return (
    <div className="fixed inset-0 z-50 flex bg-black/50" onClick={onClose}>
      <div className="flex w-full" onClick={(e) => e.stopPropagation()}>
        <div className="w-56 bg-white border-r border-gray-200 p-4 shrink-0 hidden lg:block overflow-y-auto">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Sections</h3>
          <nav className="space-y-1">
            {SECTIONS.map((s) => (
              <button key={s.id} type="button" onClick={() => scrollToSection(s.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
                  activeSection === s.id ? 'bg-agri-green text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}>{s.label}</button>
            ))}
          </nav>
        </div>

        <div ref={formRef} className="flex-1 bg-white overflow-y-auto max-h-screen">
          <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg font-black text-gray-900">
              {isEditing ? 'Edit Product' : 'Add New Product'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-semibold">{error}</div>
            )}

            {/* ─────── Section 1: Basic Information ─────── */}
            <section id="section-basic" className="scroll-mt-16">
              <h3 className="text-base font-black text-gray-900 mb-4 pb-2 border-b border-gray-100">Basic Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {inp('name', { label: 'Product Name', required: true, className: 'sm:col-span-2' })}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Category *</label>
                  {catNames.length > 0 ? (
                    <select value={form.category} onChange={(e) => handleChange('category', e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-agri-green/25 focus:border-agri-green outline-none">
                      <option value="">Select category</option>
                      {catNames.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  ) : (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                      <p className="font-semibold mb-1">No categories found. Create one first.</p>
                      <a href="/admin/categories" className="text-agri-green font-bold underline">Go to Categories</a>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Brand</label>
                  {brandNames.length > 0 ? (
                    <select value={form.brand} onChange={(e) => handleChange('brand', e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-agri-green/25 focus:border-agri-green outline-none">
                      <option value="">Select brand</option>
                      {brandNames.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                  ) : (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                      <p className="font-semibold mb-1">No brands found. Create one first.</p>
                      <a href="/admin/brands" className="text-agri-green font-bold underline">Go to Brands</a>
                    </div>
                  )}
                </div>
                {inp('subcategory', { label: 'Subcategory' })}
                {inp('expiryDate', { label: 'Expiry Date', type: 'date', required: true })}
                {inp('shortDescription', { label: 'Short Description', rows: 2, className: 'sm:col-span-2' })}
                {inp('description', { label: 'Full Description', rows: 4, className: 'sm:col-span-2' })}
              </div>
            </section>

            {/* ─────── Section 2: Pricing ─────── */}
            <section id="section-pricing" className="scroll-mt-16">
              <h3 className="text-base font-black text-gray-900 mb-4 pb-2 border-b border-gray-100">Pricing</h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {inp('mrp', { label: 'MRP (₹)', type: 'number', min: 0, step: '0.01' })}
                {inp('price', { label: 'Selling Price (₹) *', type: 'number', min: 0, step: '0.01', required: true })}
                {inp('discount', { label: 'Discount (%)', type: 'number', min: 0, max: 100 })}
                {inp('gst', { label: 'GST (%)', type: 'number', min: 0, max: 100 })}
              </div>
            </section>

            {/* ─────── Section 3: Inventory ─────── */}
            <section id="section-inventory" className="scroll-mt-16">
              <h3 className="text-base font-black text-gray-900 mb-4 pb-2 border-b border-gray-100">Inventory</h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {inp('stock', { label: 'Stock Quantity', type: 'number', min: 0 })}
                {inp('lowStockAlert', { label: 'Low Stock Alert', type: 'number', min: 0 })}
                {sel('unit', UNITS.map(u => ({ value: u, label: u })), { label: 'Unit' })}
                {inp('weight', { label: 'Weight (e.g., 500g, 1kg, 5l)' })}
              </div>
            </section>

            {/* ─────── Section 4: Product Images ─────── */}
            <section id="section-images" className="scroll-mt-16">
              <h3 className="text-base font-black text-gray-900 mb-4 pb-2 border-b border-gray-100">Product Images</h3>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  dragOver ? 'border-agri-green bg-green-50' : 'border-gray-300 hover:border-agri-green hover:bg-gray-50'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-gray-400 mb-2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <p className="text-sm text-gray-500 font-medium">Click to upload or drag &amp; drop</p>
                <p className="text-xs text-gray-400 mt-1">JPG, JPEG, PNG, WebP &#183; Max 5 MB each</p>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" multiple onChange={handleFileSelect} className="hidden" />
              </div>

              {(existingImages.length > 0 || newPreviews.length > 0) && (
                <div className="mt-4">
                  <p className="text-sm font-bold text-gray-700 mb-2">Images ({existingImages.length + newPreviews.length})</p>
                  <div className="flex flex-wrap gap-3">
                    {existingImages.map((imgPath, i) => (
                      <div key={`e-${i}`} className="relative group w-24 h-24 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                        <img src={/^https?:\/\//.test(imgPath) ? imgPath : `${API_BASE}${imgPath}`} alt="" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removeExistingImage(imgPath)}
                          className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100">&times;</button>
                      </div>
                    ))}
                    {newPreviews.map((preview, i) => (
                      <div key={`n-${i}`} className="relative group w-24 h-24 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                        <img src={preview} alt="" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removeNewImage(i)}
                          className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100">&times;</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* ─────── Section 5: Agriculture Details ─────── */}
            <section id="section-agriculture" className="scroll-mt-16">
              <h3 className="text-base font-black text-gray-900 mb-4 pb-2 border-b border-gray-100">Agriculture Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {inp('suitableCrops', { label: 'Suitable Crops (comma separated)', placeholder: 'e.g., Rice, Wheat, Cotton' })}
                {inp('targetPests', { label: 'Target Pests (comma separated)', placeholder: 'e.g., Aphids, Whiteflies, Caterpillars' })}
                {inp('dosage', { label: 'Dosage', placeholder: 'e.g., 2ml per litre of water', className: 'sm:col-span-2' })}
                {inp('composition', { label: 'Composition', rows: 2, className: 'sm:col-span-2' })}
                {inp('benefits', { label: 'Benefits', rows: 2, className: 'sm:col-span-2' })}
                {inp('safetyInstructions', { label: 'Safety Instructions', rows: 2, className: 'sm:col-span-2' })}
              </div>
            </section>

            {/* ─────── Section 6: Homepage Display ─────── */}
            <section id="section-display" className="scroll-mt-16">
              <h3 className="text-base font-black text-gray-900 mb-4 pb-2 border-b border-gray-100">Homepage Display</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                {toggle('featured', 'Featured')}
                {toggle('bestSeller', 'Best Seller')}
                {toggle('newArrival', 'New Arrival')}
                {toggle('limitedOffer', 'Limited Offer')}
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={!!form.showOnBanner} onChange={(e) => handleChange('showOnBanner', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-agri-green focus:ring-agri-green" />
                  <span className="text-sm font-bold text-gray-700">Show on Homepage Banner</span>
                </label>
                {form.showOnBanner && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pl-6 border-l-2 border-agri-green/30">
                    {inp('bannerTitle', { label: 'Banner Title' })}
                    {inp('bannerSubtitle', { label: 'Banner Subtitle' })}
                    {inp('bannerButtonText', { label: 'Banner Button Text' })}
                  </div>
                )}
              </div>

              <div className="mt-4">
                {sel('status', [
                  { value: 'draft', label: 'Draft' },
                  { value: 'published', label: 'Published' },
                  { value: 'hidden', label: 'Hidden' },
                ], { label: 'Status' })}
              </div>
            </section>

            {/* ─────── Submit ─────── */}
            <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
              <button type="button" onClick={onClose}
                className="px-5 py-2.5 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">Cancel</button>
              <button type="submit" disabled={saving}
                className="px-6 py-2.5 rounded-xl font-bold text-white bg-agri-green hover:bg-green-700 disabled:opacity-60 transition-colors">
                {saving ? 'Saving...' : isEditing ? 'Update Product' : 'Create Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const DeleteModal = ({ product, onConfirm, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
      <h3 className="text-lg font-black text-gray-900">Delete Product</h3>
      <p className="text-sm text-gray-600">
        Are you sure you want to delete <strong>{product.name}</strong>? This action cannot be undone.
      </p>
      <div className="flex gap-3 justify-end">
        <button onClick={onClose}
          className="px-5 py-2.5 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">Cancel</button>
        <button onClick={onConfirm}
          className="px-5 py-2.5 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors">Delete</button>
      </div>
    </div>
  </div>
);

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expiryFilter, setExpiryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [categories, setCategories] = useState([]);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 10 };
      if (search.trim()) params.search = search.trim();
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter) params.status = statusFilter;
      if (expiryFilter) params.expiryFilter = expiryFilter;
      const res = await adminApi.get('/products', { params });
      setProducts(res.data?.data?.products || []);
      setPagination(res.data?.data?.pagination || null);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load products.');
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryFilter, statusFilter, expiryFilter]);

  useEffect(() => { loadProducts(); }, [loadProducts]);
  useEffect(() => {
    adminApi.get('/categories').then((r) => setCategories(r.data?.data?.categories || [])).catch(() => {});
  }, []);

  const handleSave = (savedProduct) => {
    if (editingProduct) {
      setProducts((prev) => prev.map((p) => (p._id === savedProduct._id ? savedProduct : p)));
      showToast('Product updated successfully');
    } else {
      setProducts((prev) => [savedProduct, ...prev]);
      showToast('Product added successfully');
    }
    setEditingProduct(null);
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;
    try {
      await adminApi.delete(`/products/${deletingProduct._id}`);
      setProducts((prev) => prev.filter((p) => p._id !== deletingProduct._id));
      showToast('Product deleted');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to delete product.', 'error');
    } finally {
      setDeletingProduct(null);
    }
  };

  const openEdit = (product) => setEditingProduct(product);

  const badge = (text, color) => (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${color}`}>{text}</span>
  );

  return (
    <div className="p-8">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
      {editingProduct && (
        <ProductModal product={editingProduct} onSave={handleSave} onClose={() => setEditingProduct(null)} showToast={showToast} />
      )}
      {deletingProduct && (
        <DeleteModal product={deletingProduct} onConfirm={handleDelete} onClose={() => setDeletingProduct(null)} />
      )}
      {showAddModal && (
        <ProductModal product={null} onSave={(p) => { setProducts((prev) => [p, ...prev]); showToast('Product added successfully'); }} onClose={() => setShowAddModal(false)} showToast={showToast} />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your product catalog.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadProducts} className="text-sm font-bold text-agri-green hover:underline">Refresh</button>
          <button onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl font-bold text-white bg-agri-green hover:bg-green-700 transition-colors text-sm">
            + Add Product
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name, brand..."
          className="flex-1 px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm outline-none focus:border-agri-green placeholder:text-gray-400" />
        <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm outline-none focus:border-agri-green">
          <option value="">All Categories</option>
          {categories.map((cat) => (<option key={cat._id} value={cat.name}>{cat.name}</option>))}
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm outline-none focus:border-agri-green">
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="hidden">Hidden</option>
        </select>
      </div>

      <div className="flex gap-2 mb-6">
        {['', 'expiring', 'expired', 'valid'].map((ef) => (
          <button key={ef} onClick={() => { setExpiryFilter(ef); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              expiryFilter === ef
                ? 'bg-agri-green text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {ef === '' ? 'All' : ef === 'expiring' ? 'Expiring Soon' : ef === 'expired' ? 'Expired' : 'Valid Products'}
          </button>
        ))}
      </div>

      {loading && <div className="bg-white border border-gray-100 rounded-2xl p-6 text-gray-600">Loading products...</div>}
      {error && <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 font-semibold">{error}</div>}

      {!loading && !error && products.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 text-gray-600">
          {search || categoryFilter || statusFilter || expiryFilter
            ? 'No products match the current filters.'
            : 'No products found. Add your first product!'}
        </div>
      )}

      {!loading && !error && products.length > 0 && (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 font-bold text-gray-600 text-xs uppercase">Product</th>
                    <th className="text-left px-4 py-3 font-bold text-gray-600 text-xs uppercase">Category</th>
                    <th className="text-right px-4 py-3 font-bold text-gray-600 text-xs uppercase">Price</th>
                    <th className="text-center px-4 py-3 font-bold text-gray-600 text-xs uppercase">Stock</th>
                    <th className="text-center px-4 py-3 font-bold text-gray-600 text-xs uppercase">Expiry</th>
                    <th className="text-center px-4 py-3 font-bold text-gray-600 text-xs uppercase">Badges</th>
                    <th className="text-center px-4 py-3 font-bold text-gray-600 text-xs uppercase">Status</th>
                    <th className="text-right px-4 py-3 font-bold text-gray-600 text-xs uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((product) => {
                    const stock = Number(product.stock || 0);
                    const lowStock = product.lowStockAlert > 0 && stock > 0 && stock <= product.lowStockAlert;
                    return (
                      <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                              {product.images?.[0] || product.image ? (
                                <img src={product.images?.[0] || product.image} alt={product.name}
                                  className="w-full h-full object-contain rounded-lg"
                                  onError={(e) => { e.target.style.display = 'none'; }} />
                              ) : (
                                <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                                </svg>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-gray-900 truncate max-w-[200px]">{product.name}</p>
                              {product.shortDescription && (
                                <p className="text-xs text-gray-400 truncate max-w-[200px]">{product.shortDescription}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-gray-600">{product.category}</span>
                          {product.subcategory && <span className="text-gray-400 text-xs block">{product.subcategory}</span>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-bold text-gray-900">₹{Number(product.price || 0).toLocaleString()}</span>
                          {product.mrp > product.price && (
                            <span className="text-xs text-gray-400 line-through block">₹{Number(product.mrp).toLocaleString()}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {stock === 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">Out</span>
                          ) : lowStock ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">{stock}</span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">{stock}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {(() => {
                            if (!product.expiryDate) return <span className="text-[10px] text-gray-400">--</span>;
                            const now = new Date();
                            const exp = new Date(product.expiryDate);
                            const remaining = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
                            if (remaining < 0) return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">Expired</span>;
                            if (remaining <= 90) return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700">{remaining}d</span>;
                            return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">{remaining}d</span>;
                          })()}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex flex-wrap gap-1 justify-center">
                            {product.featured && badge('Featured', 'bg-purple-100 text-purple-700')}
                            {product.bestSeller && badge('Best Seller', 'bg-orange-100 text-orange-700')}
                            {product.newArrival && badge('New', 'bg-blue-100 text-blue-700')}
                            {product.limitedOffer && badge('Offer', 'bg-red-100 text-red-700')}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                            product.status === 'published' ? 'bg-green-100 text-green-700' :
                            product.status === 'hidden' ? 'bg-gray-100 text-gray-600' :
                            'bg-amber-100 text-amber-700'
                          }`}>{product.status || 'draft'}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => openEdit(product)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors">Edit</button>
                            <button onClick={() => setDeletingProduct(product)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors">Delete</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                className="px-4 py-2 rounded-lg text-sm font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-40 transition-colors">Previous</button>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-lg text-sm font-bold transition-colors ${
                    p === page ? 'bg-agri-green text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}>{p}</button>
              ))}
              <button onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={page >= pagination.pages}
                className="px-4 py-2 rounded-lg text-sm font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-40 transition-colors">Next</button>
            </div>
          )}

          {pagination && (
            <p className="text-center text-xs text-gray-400 mt-3">
              Page {pagination.page} of {pagination.pages} ({pagination.total} products)
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default AdminProducts;
