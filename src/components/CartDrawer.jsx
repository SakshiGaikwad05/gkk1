import React, { useMemo } from 'react';
import { X, ShoppingBag, Plus, Minus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const CartDrawer = ({ isOpen, onClose }) => {
  const { cart, removeFromCart, increaseQuantity, decreaseQuantity, cartTotal } = useCart();

  const totalPrice = useMemo(() =>
    cart.reduce((sum, item) => {
      // keep decimals ("₹ 12.5" must not become 125); tolerate numeric prices too
      const price = Number(String(item.price ?? '').replace(/[^\d.]/g, '')) || 0;
      return sum + price * item.quantity;
    }, 0),
  [cart]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] overflow-hidden">
      <div className="absolute inset-0 bg-black/50 transition-opacity" onClick={onClose} />
      
      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-md bg-white shadow-xl flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <ShoppingBag size={20} className="text-agri-green" />
              Your Cart ({cartTotal})
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <ShoppingBag size={64} className="mb-4 opacity-20" />
                <p className="text-lg font-medium">Your cart is empty</p>
                <button 
                  onClick={onClose}
                  className="mt-4 text-agri-green font-bold hover:underline"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-20 h-20 object-contain bg-white rounded-lg p-1"
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/80x80?text=No+Image'; }}
                      />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-gray-800 truncate">{item.name}</h3>
                      <p className="text-agri-green font-bold mt-1">{item.price}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border border-gray-200 rounded-lg bg-white">
                          <button 
                            onClick={() => decreaseQuantity(item.id)}
                            className="p-1 hover:bg-gray-50 text-gray-500"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="px-3 text-sm font-bold">{item.quantity}</span>
                          <button 
                            onClick={() => increaseQuantity(item.id)}
                            className="p-1 hover:bg-gray-50 text-gray-500"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
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

          {cart.length > 0 && (
            <div className="p-4 border-t bg-gray-50">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600 font-medium">Subtotal</span>
                <span className="text-xl font-bold text-gray-900">₹ {totalPrice.toLocaleString()}</span>
              </div>
              <Link 
                to="/checkout"
                onClick={onClose}
                className="w-full bg-agri-green text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-green-700 transition-all active:scale-[0.98] flex items-center justify-center"
              >
                Proceed to Checkout
              </Link>
              <p className="text-center text-xs text-gray-400 mt-3 italic">
                Taxes and shipping calculated at checkout
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartDrawer;