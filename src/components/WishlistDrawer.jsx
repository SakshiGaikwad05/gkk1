import React from 'react';
import { X, Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';

const WishlistDrawer = ({ isOpen, onClose }) => {
  const { wishlist, toggleWishlist } = useWishlist();
  const { addToCart, cart } = useCart();

  const isInCart = (id) => cart.some(item => item.id === id);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] overflow-hidden">
      <div className="absolute inset-0 bg-black/50 transition-opacity" onClick={onClose} />
      
      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-md bg-white shadow-xl flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Heart size={20} className="text-red-500 fill-red-500" />
              Your Wishlist ({wishlist.length})
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {wishlist.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Heart size={64} className="mb-4 opacity-20" />
                <p className="text-lg font-medium">Your wishlist is empty</p>
                <button 
                  onClick={onClose}
                  className="mt-4 text-agri-green font-bold hover:underline"
                >
                  Explore Products
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {wishlist.map((item) => (
                  <div key={item.id} className="flex gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100 relative group">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-20 h-20 object-contain bg-white rounded-lg p-1"
                      onError={(e) => { e.target.src = 'https://placehold.co/80x80?text=No+Image'; }}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-gray-800 truncate">{item.name}</h3>
                      <p className="text-agri-green font-bold mt-1">{item.price}</p>
                      
                      <div className="flex items-center gap-2 mt-3">
                        <button 
                          onClick={() => addToCart(item)}
                          className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            isInCart(item.id)
                              ? 'bg-agri-green text-white'
                              : 'bg-white border border-agri-green text-agri-green hover:bg-agri-green hover:text-white'
                          }`}
                        >
                          <ShoppingCart size={14} />
                          {isInCart(item.id) ? 'Added' : 'Add to Cart'}
                        </button>
                        <button 
                          onClick={() => toggleWishlist(item)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove from wishlist"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t bg-gray-50">
            <button 
              onClick={onClose}
              className="w-full bg-white border-2 border-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-100 transition-all"
            >
              Continue Browsing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WishlistDrawer;