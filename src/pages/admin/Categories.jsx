import { useEffect, useState, useCallback } from 'react';
import adminApi from '../../utils/adminApi';
import { getCategoryImage } from '../../utils/categoryImages';

const CategoryModal = ({ category, onSave, onClose }) => {
  const [form, setForm] = useState({
    name: category?.name || '',
    description: category?.description || '',
    active: category?.active !== false,
    order: category?.order ?? 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [removeImage, setRemoveImage] = useState(false);
  const isEditing = Boolean(category?._id);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const handleImage = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Only JPG, PNG or WebP images are allowed.'); return;
    }
    if (file.size > 5 * 1024 * 1024) { setError('Image must be 5 MB or smaller.'); return; }
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
    setRemoveImage(false);
    setError('');
  };

  // what the tile will show: new upload > uploaded image > built-in picture
  const shownImage = preview
    || getCategoryImage({ ...category, name: form.name, image: removeImage ? '' : category?.image });
  const hasUploadedImage = Boolean(category?.image) && !removeImage && !preview;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required.'); return; }
    setSaving(true);
    try {
      // multipart so the image can be uploaded along with the fields
      const fd = new FormData();
      fd.append('name', form.name.trim());
      fd.append('description', form.description || '');
      fd.append('active', form.active ? 'true' : 'false');
      fd.append('order', String(Number(form.order) || 0));
      if (imageFile) fd.append('image', imageFile);
      if (removeImage) fd.append('removeImage', 'true');
      const config = { headers: { 'Content-Type': 'multipart/form-data' } };

      if (isEditing) {
        const res = await adminApi.put(`/categories/${category._id}`, fd, config);
        onSave(res.data?.data?.category);
      } else {
        const res = await adminApi.post('/categories', fd, config);
        onSave(res.data?.data?.category);
      }
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-black text-gray-900">{isEditing ? 'Edit Category' : 'Add Category'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-semibold">{error}</div>}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Name *</label>
            <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-agri-green/25 focus:border-agri-green outline-none" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Image</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-50 shrink-0 flex items-center justify-center">
                {shownImage
                  ? <img src={shownImage} alt="" className="w-full h-full object-cover" />
                  : <span className="text-[10px] text-gray-400">No image</span>}
              </div>
              <div className="flex flex-col gap-1.5 text-sm">
                <label className="cursor-pointer font-bold text-agri-green hover:underline">
                  {preview || hasUploadedImage ? 'Change image' : 'Upload image'}
                  <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleImage} className="hidden" />
                </label>
                {(preview || hasUploadedImage) && (
                  <button type="button" onClick={() => { setImageFile(null); setPreview(''); setRemoveImage(Boolean(category?.image)); }}
                    className="text-left text-xs font-bold text-red-500 hover:underline">Remove</button>
                )}
                {!preview && !hasUploadedImage && shownImage && (
                  <span className="text-xs text-gray-400">Using built-in picture</span>
                )}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
            <textarea rows="2" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-agri-green/25 focus:border-agri-green outline-none resize-none" />
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

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.get('/categories');
      setCategories(res.data?.data?.categories || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await adminApi.delete(`/categories/${id}`);
      setCategories((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      alert(err?.response?.data?.message || 'Delete failed.');
    }
  };

  return (
    <div className="p-8">
      {editing && <CategoryModal category={editing} onSave={(c) => { setCategories((prev) => prev.map((x) => x._id === c._id ? { ...x, ...c } : x)); setEditing(null); }} onClose={() => setEditing(null)} />}
      {showAdd && <CategoryModal category={null} onSave={(c) => { setCategories((prev) => [...prev, c]); }} onClose={() => setShowAdd(false)} />}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500 mt-1">Manage product categories.</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="px-4 py-2 rounded-xl font-bold text-white bg-agri-green hover:bg-green-700 text-sm">+ Add Category</button>
      </div>

      {loading && <div className="bg-white border rounded-2xl p-6 text-gray-600">Loading...</div>}
      {error && <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 font-semibold">{error}</div>}

      {!loading && !error && categories.length === 0 && (
        <div className="bg-white border rounded-2xl p-6 text-gray-600">No categories yet.</div>
      )}

      {!loading && categories.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-bold text-gray-600 text-xs uppercase">Name</th>
                <th className="text-left px-4 py-3 font-bold text-gray-600 text-xs uppercase">Description</th>
                <th className="text-center px-4 py-3 font-bold text-gray-600 text-xs uppercase">Products</th>
                <th className="text-center px-4 py-3 font-bold text-gray-600 text-xs uppercase">Order</th>
                <th className="text-center px-4 py-3 font-bold text-gray-600 text-xs uppercase">Status</th>
                <th className="text-right px-4 py-3 font-bold text-gray-600 text-xs uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.map((cat) => (
                <tr key={cat._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-bold text-gray-900">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-100 shrink-0">
                        {getCategoryImage(cat) && <img src={getCategoryImage(cat)} alt="" className="w-full h-full object-cover" />}
                      </div>
                      {cat.name}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-[200px] truncate">{cat.description || '\u2014'}</td>
                  <td className="px-4 py-3 text-center"><span className="font-bold text-gray-700">{cat.productCount ?? 0}</span></td>
                  <td className="px-4 py-3 text-center text-gray-500">{cat.order}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${cat.active !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {cat.active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setEditing(cat)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100">Edit</button>
                      <button onClick={() => handleDelete(cat._id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;
