import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Image as ImageIcon, ZoomIn, Leaf, Plus, X, Upload } from 'lucide-react';
import { useAuth } from "../contexts/AuthContext";
import galleryImg from "../assets/gallery.jpeg";

const Gallery = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Real-world shop categories
  const categories = ['All', 'Shop', 'Products', 'Equipment', 'Storage', 'Distribution'];
  const [activeCategory, setActiveCategory] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Initial gallery data
  const [galleryItems, setGalleryItems] = useState([
    { id: 1, img: galleryImg, title: 'Main Shop Entrance', category: 'Shop' },
    { id: 2, img: 'https://images.pexels.com/photos/2132250/pexels-photo-2132250.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', title: 'Product Display Aisle', category: 'Products' },
    { id: 3, img: 'https://images.pexels.com/photos/2252542/pexels-photo-2252542.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', title: 'Seed Storage Unit', category: 'Storage' },
    { id: 4, img: 'https://images.pexels.com/photos/1459339/pexels-photo-1459339.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', title: 'New Stock Arrival', category: 'Distribution' },
    { id: 5, img: 'https://images.pexels.com/photos/1124505/pexels-photo-1124505.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', title: 'Heavy Duty Sprayers', category: 'Equipment' },
  ]);

  const [newPhoto, setNewProduct] = useState({
    title: '',
    img: '',
    category: 'Shop'
  });

  const filteredItems = activeCategory === 'All' 
    ? galleryItems 
    : galleryItems.filter(item => item.category === activeCategory);

  const handleAddPhoto = (e) => {
    e.preventDefault();
    const id = Date.now();
    setGalleryItems([{ ...newPhoto, id }, ...galleryItems]);
    setIsModalOpen(false);
    setNewProduct({ title: '', img: '', category: 'Shop' });
  };

  const handleImageError = (e) => {
    e.target.src = "https://placehold.co/600x400?text=GKK+Gallery+Image";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back to Home Link */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex justify-between items-center">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-agri-green font-bold hover:text-agri-dark transition-all group"
        >
          <div className="w-8 h-8 rounded-full bg-agri-green/10 flex items-center justify-center group-hover:bg-agri-green group-hover:text-white transition-all">
            <ArrowLeft size={18} />
          </div>
          Back to Home
        </Link>

        {isAdmin && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-agri-green text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-agri-dark transition-all shadow-lg shadow-green-100"
          >
            <Plus size={20} /> Add Photo
          </button>
        )}
      </div>

      {/* Header Section */}
      <section className="relative overflow-hidden mb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative z-10 bg-white rounded-3xl p-8 md:p-16 shadow-sm border border-gray-100 overflow-hidden">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-agri-green/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-agri-orange/5 rounded-full blur-3xl"></div>

            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-agri-green/10 text-agri-green text-sm font-bold uppercase tracking-wider mb-6">
                <Leaf size={16} />
                Visual Journey
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight">
                Our <span className="text-agri-green">Gallery</span>
              </h1>
              <p className="text-lg text-gray-500 font-medium leading-relaxed">
                Step into the world of Gawande Krushi Kendra. Explore our facility, products, and dedicated team in action.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Categories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 text-center">
        <div className="flex flex-wrap items-center justify-center gap-3">
          {categories.map((cat) => (
            <button 
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                activeCategory === cat
                ? 'bg-agri-green text-white shadow-lg shadow-green-100' 
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Modern Gallery Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredItems.map((item) => (
            <div 
              key={item.id} 
              className="group relative bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-700"
            >
              <div className="relative h-80 overflow-hidden">
                <img
                  src={item.img}
                  alt={item.title}
                  onError={handleImageError}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                
                <div className="absolute inset-0 bg-agri-dark/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-agri-orange flex items-center justify-center text-white mb-4 transform translate-y-10 group-hover:translate-y-0 transition-transform duration-500 delay-100">
                    <ZoomIn size={24} />
                  </div>
                  <h3 className="text-white text-xl font-bold mb-2 transform translate-y-10 group-hover:translate-y-0 transition-transform duration-500 delay-150">
                    {item.title}
                  </h3>
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-bold transform translate-y-10 group-hover:translate-y-0 transition-transform duration-500 delay-200">
                    {item.category}
                  </span>
                </div>

                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-agri-green text-[10px] font-black uppercase tracking-widest shadow-sm group-hover:opacity-0 transition-opacity">
                  {item.category}
                </div>
              </div>

              <div className="p-6 group-hover:bg-agri-green transition-colors duration-500">
                <h3 className="font-bold text-gray-800 group-hover:text-white transition-colors truncate">
                  {item.title}
                </h3>
                <p className="text-gray-400 text-xs mt-1 group-hover:text-green-100 transition-colors">
                  Gawande Krushi Kendra Facility
                </p>
              </div>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <p className="text-gray-400 font-medium">No photos found in this category.</p>
          </div>
        )}
      </section>

      {/* Admin Add Photo Modal */}
      {isAdmin && isModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-black text-gray-900">Add Gallery Photo</h2>
                <p className="text-gray-500 text-sm font-medium uppercase tracking-wider tracking-tighter">Admin Panel</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24} className="text-gray-400" /></button>
            </div>

            <form onSubmit={handleAddPhoto} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Photo Title</label>
                <input 
                  required
                  placeholder="e.g. Front Shop View"
                  className="w-full bg-gray-50 border-2 border-transparent focus:border-agri-green focus:bg-white rounded-xl px-4 py-3 outline-none transition-all font-medium"
                  value={newPhoto.title}
                  onChange={(e) => setNewProduct({...newPhoto, title: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Image URL</label>
                <div className="relative">
                  <Upload size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    required
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-agri-green focus:bg-white rounded-xl px-11 py-3 outline-none transition-all font-medium"
                    value={newPhoto.img}
                    onChange={(e) => setNewProduct({...newPhoto, img: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Category</label>
                <select 
                  className="w-full bg-gray-50 border-2 border-transparent focus:border-agri-green focus:bg-white rounded-xl px-4 py-3 outline-none transition-all font-medium appearance-none"
                  value={newPhoto.category}
                  onChange={(e) => setNewProduct({...newPhoto, category: e.target.value})}
                >
                  {categories.filter(c => c !== 'All').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {newPhoto.img && (
                <div className="mt-2 rounded-xl border-2 border-gray-100 p-2 bg-gray-50">
                   <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 ml-1 tracking-wider">Preview</p>
                   <img 
                    src={newPhoto.img} 
                    alt="Preview" 
                    className="w-full h-32 object-cover rounded-lg bg-white"
                    onError={(e) => e.target.style.display = 'none'}
                   />
                </div>
              )}

              <button className="w-full bg-agri-green text-white font-black py-4 rounded-xl shadow-lg shadow-green-100 hover:bg-agri-dark transition-all active:scale-[0.98] mt-4">
                Post to Gallery
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;