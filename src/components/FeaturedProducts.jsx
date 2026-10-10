import React, { useState, useEffect } from 'react';
import { ShoppingCart, Star, Heart, ImageOff } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

const API_BASE = import.meta.env.VITE_API_URL || 'https://gkk1.onrender.com';

const ProductImage = ({ product }) => {
  const [failed, setFailed] = useState(false);
  const src = product.images?.[0] || product.image;
  if (!src || failed) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <ImageOff size={32} className="text-gray-300" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={product.name}
      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
      onError={() => setFailed(true)}
    />
  );
};

const FeaturedProducts = () => {
  const { t } = useLanguage();
  const { addToCart, cart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/products?featured=true&status=published&page=1&limit=8`);
        const data = await res.json();
        setProducts(data?.data?.products || []);
      } catch {} finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const isInCart = (id) => cart.some(item => item.id === id || item._id === id);

  const handleAddToCart = (product) => {
    addToCart({
      id: product._id,
      _id: product._id,
      name: product.name,
      price: `₹ ${Number(product.price || 0).toLocaleString()}`,
      image: product.images?.[0] || product.image || '',
      category: product.category,
    });
  };

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-8 border-b border-gray-100 pb-4">
          <h2 className="text-2xl font-bold text-gray-800 border-l-4 border-agri-orange pl-3">{t('feat_title')}</h2>
          <a href="/category/all" className="font-semibold text-agri-green text-sm hover:underline">{t('view_all')}</a>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No featured products yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {products.map((product) => (
              <div key={product._id} className="bg-white rounded-lg border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-all group flex flex-col">
                <div className="relative w-full aspect-[4/3] bg-gray-50 overflow-hidden">
                  <ProductImage product={product} />
                  {(product.discount > 0 || product.limitedOffer) && (
                    <span className="absolute top-2 left-2 z-10 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded">
                      {t('sale')} {product.discount > 0 && `${product.discount}% OFF`}
                    </span>
                  )}
                  {product.newArrival && (
                    <span className="absolute top-2 right-12 z-10 bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded">
                      New
                    </span>
                  )}
                  <button
                    onClick={() => toggleWishlist({
                      id: product._id,
                      name: product.name,
                      price: `₹ ${Number(product.price || 0).toLocaleString()}`,
                      image: product.images?.[0] || product.image || '',
                    })}
                    className="absolute top-2 right-2 z-10 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-all group/wishlist"
                  >
                    <Heart
                      size={18}
                      className={`transition-colors ${isInWishlist(product._id) ? 'fill-red-500 text-red-500' : 'text-gray-400 group-hover/wishlist:text-red-500'}`}
                    />
                  </button>
                </div>

                <div className="p-4 flex flex-col flex-1 border-t border-gray-50">
                  <div className="flex items-center space-x-1 mb-2">
                    <Star size={14} className="fill-orange-400 text-orange-400" />
                    <span className="text-xs text-gray-500 font-medium">4.5</span>
                  </div>
                  <h3 className="font-semibold text-gray-800 text-sm mb-2 line-clamp-2 leading-snug group-hover:text-agri-green transition-colors">
                    {product.name}
                  </h3>

                  <div className="mt-auto pt-4 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-lg font-bold text-gray-900">₹{Number(product.price || 0).toLocaleString()}</span>
                      {product.mrp > product.price && (
                        <span className="text-xs text-gray-400 line-through">₹{Number(product.mrp).toLocaleString()}</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="bg-white border text-sm font-semibold border-agri-green text-agri-green hover:bg-agri-green hover:text-white rounded-md p-2 px-3 transition-colors flex items-center"
                    >
                      <ShoppingCart size={16} className="md:mr-2" />
                      <span className="hidden md:inline">
                        {isInCart(product._id) ? 'Added ✓' : (t('add') || 'ADD')}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedProducts;
