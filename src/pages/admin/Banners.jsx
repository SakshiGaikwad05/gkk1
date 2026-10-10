import { useEffect, useState, useCallback, useRef } from 'react';
import adminApi from '../../utils/adminApi';

const API_BASE = import.meta.env.VITE_API_URL || 'https://gkk1.onrender.com';

// Cloudinary images are already absolute URLs; only legacy /uploads paths need the API host
const imageUrl = (src) => (!src ? '' : /^https?:\/\//.test(src) ? src : `${API_BASE}${src}`);

const BannerModal = ({ banner, onSave, onClose }) => {
  const [form, setForm] = useState({
    title: banner?.title || '',
    subtitle: banner?.subtitle || '',
    link: banner?.link || '',
    buttonText: banner?.buttonText || 'Shop Now',
    active: banner?.active !== false,
    order: banner?.order ?? 0,
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [existingImage, setExistingImage] = useState(banner?.image || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);
  const isEditing = Boolean(banner?._id);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview); };
  }, [preview]);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(f.type)) {
      setError('Only JPG, PNG, WebP allowed.');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError('Max 5 MB.');
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    if (existingImage) setExistingImage('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required.'); return; }
    if (!isEditing && !file && !existingImage) { setError('Please upload an image.'); return; }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title.trim());
      fd.append('subtitle', form.subtitle.trim());
      fd.append('link', form.link.trim());
      fd.append('buttonText', form.buttonText.trim() || 'Shop Now');
      fd.append('active', form.active ? 'true' : 'false');
      fd.append('order', Number(form.order) || 0);
      if (file) fd.append('image', file);

      if (isEditing && !file && !existingImage) {
        fd.append('removeImage', 'true');
      }

      const config = { headers: { 'Content-Type': 'multipart/form-data' } };

      if (isEditing) {
        const res = await adminApi.put(`/banners/admin/${banner._id}`, fd, config);
        onSave(res.data?.data?.banner);
      } else {
        const res = await adminApi.post('/banners/admin', fd, config);
        onSave(res.data?.data?.banner);
      }
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save banner.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-black text-gray-900">{isEditing ? 'Edit Banner' : 'Add Banner'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-semibold">{error}</div>}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Banner Image *</label>
            {(existingImage || preview) ? (
              <div className="relative w-full h-48 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 mb-2">
                <img src={preview || imageUrl(existingImage)} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => { setFile(null); if (preview) URL.revokeObjectURL(preview); setPreview(null); setExistingImage(''); }}
                  className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full text-sm flex items-center justify-center hover:bg-red-600">X</button>
              </div>
            ) : (
              <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-agri-green hover:bg-gray-50 transition-colors">
                <p className="text-sm text-gray-500 font-medium">Click to upload image</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP &#183; Max 5 MB</p>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleFile} className="hidden" />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Title *</label>
            <input type="text" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-agri-green/25 focus:border-agri-green outline-none" />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Subtitle</label>
            <input type="text" value={form.subtitle} onChange={(e) => setForm((p) => ({ ...p, subtitle: e.target.value }))}
              className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-agri-green/25 focus:border-agri-green outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Button Text</label>
              <input type="text" value={form.buttonText} onChange={(e) => setForm((p) => ({ ...p, buttonText: e.target.value }))}
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-agri-green/25 focus:border-agri-green outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Link</label>
              <input type="text" value={form.link} onChange={(e) => setForm((p) => ({ ...p, link: e.target.value }))}
                placeholder="/category/seeds"
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-agri-green/25 focus:border-agri-green outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Order</label>
              <input type="number" min="0" value={form.order} onChange={(e) => setForm((p) => ({ ...p, order: e.target.value }))}
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-agri-green/25 focus:border-agri-green outline-none" />
            </div>
            <div className="flex items-end pb-2.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-agri-green focus:ring-agri-green" />
                <span className="text-sm font-bold text-gray-700">Active</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200">Cancel</button>
            <button type="submit" disabled={saving}
              className="px-5 py-2.5 rounded-xl font-bold text-white bg-agri-green hover:bg-green-700 disabled:opacity-60">
              {saving ? 'Saving...' : isEditing ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminBanners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.get('/banners/admin');
      setBanners(res.data?.data?.banners || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load banners.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this banner?')) return;
    try {
      await adminApi.delete(`/banners/admin/${id}`);
      setBanners((prev) => prev.filter((b) => b._id !== id));
    } catch (err) {
      alert(err?.response?.data?.message || 'Delete failed.');
    }
  };

  return (
    <div className="p-8">
      {editing && <BannerModal banner={editing} onSave={(b) => { setBanners((prev) => prev.map((x) => x._id === b._id ? b : x)); setEditing(null); }} onClose={() => setEditing(null)} />}
      {showAdd && <BannerModal banner={null} onSave={(b) => { setBanners((prev) => [...prev, b]); }} onClose={() => setShowAdd(false)} />}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Banners</h1>
          <p className="text-sm text-gray-500 mt-1">Manage homepage banners.</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="px-4 py-2 rounded-xl font-bold text-white bg-agri-green hover:bg-green-700 transition-colors text-sm">+ Add Banner</button>
      </div>

      {loading && <div className="bg-white border rounded-2xl p-6 text-gray-600">Loading...</div>}
      {error && <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 font-semibold">{error}</div>}

      {!loading && !error && banners.length === 0 && (
        <div className="bg-white border rounded-2xl p-6 text-gray-600">No banners found.</div>
      )}

      {!loading && banners.length > 0 && (
        <div className="grid gap-4">
          {banners.map((banner) => (
            <div key={banner._id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm flex flex-col sm:flex-row">
              <div className="w-full sm:w-48 h-32 bg-gray-50 shrink-0">
                {banner.image ? (
                  <img src={imageUrl(banner.image)} alt={banner.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">No image</div>
                )}
              </div>
              <div className="flex-1 p-4 flex flex-col justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900">{banner.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${banner.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {banner.active ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-xs text-gray-400">Order: {banner.order}</span>
                  </div>
                  {banner.subtitle && <p className="text-sm text-gray-500 mt-0.5">{banner.subtitle}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditing(banner)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100">Edit</button>
                  <button onClick={() => handleDelete(banner._id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminBanners;
