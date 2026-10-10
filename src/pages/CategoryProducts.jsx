import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ShoppingCart, Heart, ImageOff } from 'lucide-react';
import api from '../utils/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

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
      className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
      onError={() => setFailed(true)}
    />
  );
};

const formatTitle = (slug) =>
  String(slug || '')
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const CategoryProducts = () => {
  const { category } = useParams();
  const { addToCart, cart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/products', { params: { category } });
        // no hard-coded fallback: those demo items don't exist in the database,
        // so they could be added to the cart but never ordered
        setProducts(res.data?.data?.products || []);
      } catch (err) {
        console.error('Error fetching products:', err);
        setProducts([]);
        setError(err?.response?.data?.message || 'Unable to load products.');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [category]);

  const isInCart = (id) => cart.some((item) => String(item.id) === String(id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-gray-50 min-h-screen">
      <Link
        to="/"
        className="inline-flex items-center gap-2 mb-6 text-agri-green font-bold hover:text-green-700 transition-colors group"
      >
        <span className="group-hover:-translate-x-1 transition-transform">←</span>
        Back to Home
      </Link>

      <div className="mb-10">
        <h1 className="text-4xl font-extrabold text-gray-900 capitalize tracking-tight flex items-center gap-3">
          <span className="w-2 h-10 bg-agri-green rounded-full" />
          {formatTitle(category)}
        </h1>
        <p className="text-gray-500 mt-2 font-medium">
          Browse our premium range of {formatTitle(category)}
        </p>
      </div>

      {loading && <p className="text-gray-500 font-medium">Loading products...</p>}
      {error && <p className="text-red-600 font-semibold">{error}</p>}

      {!loading && !error && (
        <div className="grid gap-8" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {products.map((product) => (
            <div key={product._id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all group flex flex-col">
              <div className="relative w-full aspect-[4/3] bg-gray-50 overflow-hidden">
                <ProductImage product={product} />
                <button
                  onClick={() => toggleWishlist({
                    id: product._id,
                    name: product.name,
                    price: `₹ ${Number(product.price || 0).toLocaleString()}`,
                    image: product.images?.[0] || product.image,
                  })}
                  className="absolute top-4 right-4 z-10 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-all group/wishlist"
                >
                  <Heart
                    size={20}
                    className={`transition-colors ${isInWishlist(product._id) ? 'fill-red-500 text-red-500' : 'text-gray-400 group-hover/wishlist:text-red-500'}`}
                  />
                </button>
              </div>
              <div className="p-5 flex flex-col flex-1 border-t border-gray-50">
                <h3 className="font-bold text-gray-800 text-lg mb-2 line-clamp-2 leading-tight group-hover:text-agri-green transition-colors">
                  {product.name}
                </h3>
                <div className="mt-auto pt-4 flex items-center justify-between">
                  <span className="text-2xl font-black text-gray-900">
                    ₹ {Number(product.price || 0).toLocaleString()}
                  </span>
                  <button
                    onClick={() => addToCart({
                      id: product._id,
                      name: product.name,
                      price: `₹ ${Number(product.price || 0).toLocaleString()}`,
                      image: product.images?.[0] || product.image || '',
                      category: product.category,
                    })}
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all ${
                      isInCart(product._id)
                        ? 'bg-agri-green text-white shadow-md'
                        : 'border-2 border-agri-green text-agri-green hover:bg-agri-green hover:text-white'
                    }`}
                  >
                    <ShoppingCart size={18} />
                    {isInCart(product._id) ? 'Added' : 'Add'}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {products.length === 0 && (
            <div className="col-span-full text-center py-24 bg-white rounded-3xl border-2 border-dashed border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 mb-2">No products found</h3>
              <p className="text-gray-500">No products are available in this category yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CategoryProducts;
