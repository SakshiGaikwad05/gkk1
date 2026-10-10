import React, { useState, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowLeft, ShoppingBag, CreditCard, MapPin, Phone, User } from 'lucide-react';
import api from '../utils/api';

const Checkout = () => {
  const { cart, clearCart, cartTotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOrdered, setIsOrdered] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [address, setAddress] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    addressLine: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
  });

  const [paymentMethod, setPaymentMethod] = useState('');
  const [addressError, setAddressError] = useState('');

  const handlePaymentMethodChange = (value) => {
    setPaymentMethod(value);
    setAddressError('');
  };

  const updateAddress = (field, value) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
    setAddressError('');
  };

  const validateForm = () => {
    if (!address.name.trim()) return 'Full name is required.';
    if (!address.phone.trim() || !/^\d{10}$/.test(address.phone.replace(/\D/g, ''))) return 'Valid 10-digit phone number is required.';
    if (!address.addressLine.trim()) return 'Address is required.';
    if (!address.city.trim()) return 'City is required.';
    if (!address.state.trim()) return 'State is required.';
    if (!address.pincode.trim() || !/^\d{6}$/.test(address.pincode.replace(/\D/g, ''))) return 'Valid 6-digit pincode is required.';
    if (!paymentMethod) return 'Please select a payment method.';
    return '';
  };

  // cart prices are display strings like "₹ 3,090" or "₹ 12.5"; keep the decimal point
  // (the old /[^\d]/ strip turned ₹12.5 into ₹125)
  const parsePrice = (p) => Number(String(p ?? '').replace(/[^\d.]/g, '')) || 0;

  const totalPrice = useMemo(() =>
    cart.reduce((sum, item) => sum + parsePrice(item.price) * item.quantity, 0),
  [cart]);

  const handlePayment = async () => {
    if (cart.length === 0 || isProcessing) return;

    const validationError = validateForm();
    if (validationError) {
      setAddressError(validationError);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token || token.startsWith('google_token_')) {
      alert('Please login first');
      navigate('/');
      return;
    }

    if (paymentMethod === 'UPI' && !window.Razorpay) {
      alert('Payment gateway failed to load. Please refresh and try again.');
      return;
    }

    setIsProcessing(true);

    try {
      // send the real product _id; the server looks up the actual price itself
      const items = cart.map((item) => ({
        productId: String(item._id || item.id),
        name: item.name,
        quantity: item.quantity,
      }));

      const shipAddress = {
        name: address.name.trim(),
        phone: address.phone.trim(),
        addressLine: address.addressLine.trim(),
        addressLine2: address.addressLine2.trim(),
        city: address.city.trim(),
        state: address.state.trim(),
        pincode: address.pincode.trim(),
        landmark: address.landmark.trim(),
      };

      const orderRes = await api.post('/orders', {
        items,
        totalAmount: totalPrice,
        address: shipAddress,
        paymentMethod,
      });

      const dbOrder = orderRes.data?.data?.order;
      const dbOrderId = dbOrder?._id;
      if (!dbOrderId) {
        throw new Error('Unable to create order.');
      }

      if (paymentMethod === 'COD') {
        clearCart();
        setIsOrdered(true);
        navigate('/checkout?success=1', { replace: true });
        return;
      }

      const razorpayRes = await api.post('/payment/create-order', { orderId: dbOrderId });

      const { razorpayOrderId, amount, keyId } = razorpayRes.data?.data || {};
      if (!razorpayOrderId || !amount || !keyId) {
        throw new Error('Unable to initialize payment.');
      }

      const options = {
        key: keyId,
        amount,
        currency: 'INR',
        order_id: razorpayOrderId,
        name: 'Gawande Krushi Kendra',
        description: `Order ${dbOrder.orderId || dbOrderId}`,
        handler: async (response) => {
          try {
            await api.post('/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: dbOrderId,
            });

            clearCart();
            setIsOrdered(true);
            navigate('/checkout?success=1', { replace: true });
          } catch {
            alert('Payment verification failed. Please contact support.');
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: user?.name || '',
          contact: user?.phone || '',
        },
        theme: { color: '#2F855A' },
        // user closed the Razorpay popup without paying: re-enable the button
        modal: { ondismiss: () => setIsProcessing(false) },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => {
        alert('Payment failed. Please try again.');
        setIsProcessing(false);
      });
      rzp.open();
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Unable to process payment. Please try again.';
      alert(errorMessage);
      setIsProcessing(false);
    }
  };

  if (isOrdered || new URLSearchParams(location.search).get('success') === '1') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="bg-white p-10 rounded-3xl shadow-xl border border-gray-100 flex flex-col items-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle size={48} className="text-agri-green" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-4">Order Placed Successfully!</h1>
          <p className="text-gray-500 mb-10 max-w-md mx-auto">
            Your order has been confirmed and is being processed. You will receive an update soon.
          </p>
          <Link 
            to="/" 
            className="bg-agri-green text-white font-black px-8 py-4 rounded-xl shadow-lg hover:bg-green-700 transition-all flex items-center gap-2"
          >
            <ShoppingBag size={20} /> Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-gray-50 min-h-screen">
      <Link 
        to="/" 
        className="inline-flex items-center gap-2 mb-8 text-agri-green font-bold hover:text-green-700 transition-colors group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        Back to Home
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Order Summary */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3">
              <ShoppingBag className="text-agri-green" />
              Order Summary ({cartTotal})
            </h2>

            {cart.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-500 mb-6">Your cart is empty.</p>
                <Link to="/" className="text-agri-green font-bold underline">Go back to shop</Link>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-16 h-16 object-contain bg-white rounded-lg"
                      onError={(e) => { e.target.src = 'https://placehold.co/64x64?text=No+Image'; }}
                    />
                    <div className="flex-1 flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-gray-800 text-sm sm:text-base">{item.name}</h3>
                        <p className="text-gray-500 text-xs sm:text-sm">Quantity: {item.quantity}</p>
                      </div>
                      <p className="font-black text-gray-900">{item.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Shipping Address */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3">
              <MapPin className="text-agri-green" />
              Shipping Address
            </h2>

            {addressError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-semibold">
                {addressError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    value={address.name}
                    onChange={(e) => updateAddress('name', e.target.value)}
                    placeholder="Recipient name"
                    className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-agri-green/25 focus:border-agri-green outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Phone *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="tel"
                    value={address.phone}
                    onChange={(e) => updateAddress('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit mobile number"
                    className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-agri-green/25 focus:border-agri-green outline-none"
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Address *</label>
                <input
                  type="text"
                  value={address.addressLine}
                  onChange={(e) => updateAddress('addressLine', e.target.value)}
                  placeholder="House number, street, area"
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-agri-green/25 focus:border-agri-green outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Address Line 2</label>
                <input
                  type="text"
                  value={address.addressLine2}
                  onChange={(e) => updateAddress('addressLine2', e.target.value)}
                  placeholder="Apartment, suite, unit (optional)"
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-agri-green/25 focus:border-agri-green outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">City *</label>
                <input
                  type="text"
                  value={address.city}
                  onChange={(e) => updateAddress('city', e.target.value)}
                  placeholder="City"
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-agri-green/25 focus:border-agri-green outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">State *</label>
                <input
                  type="text"
                  value={address.state}
                  onChange={(e) => updateAddress('state', e.target.value)}
                  placeholder="State"
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-agri-green/25 focus:border-agri-green outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Pincode *</label>
                <input
                  type="text"
                  value={address.pincode}
                  onChange={(e) => updateAddress('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6-digit pincode"
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-agri-green/25 focus:border-agri-green outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Landmark</label>
                <input
                  type="text"
                  value={address.landmark}
                  onChange={(e) => updateAddress('landmark', e.target.value)}
                  placeholder="Nearby landmark (optional)"
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-agri-green/25 focus:border-agri-green outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Payment & Action */}
        <div className="lg:col-span-1">
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 sticky top-24">
            <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
              <CreditCard className="text-agri-green" />
              Payment
            </h3>
            
            {/* Payment Method Selection */}
            <div className="mb-6">
              <p className="text-sm font-bold text-gray-700 mb-3">Payment Method *</p>
              <div className="space-y-3">
                <label
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'COD'
                      ? 'border-agri-green bg-green-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="COD"
                    checked={paymentMethod === 'COD'}
                    onChange={() => handlePaymentMethodChange('COD')}
                    className="accent-agri-green w-4 h-4"
                  />
                  <div>
                    <p className="text-sm font-bold text-gray-800">Cash on Delivery (COD)</p>
                    <p className="text-xs text-gray-500">Pay when you receive</p>
                  </div>
                </label>
                <label
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'UPI'
                      ? 'border-agri-green bg-green-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="UPI"
                    checked={paymentMethod === 'UPI'}
                    onChange={() => handlePaymentMethodChange('UPI')}
                    className="accent-agri-green w-4 h-4"
                  />
                  <div>
                    <p className="text-sm font-bold text-gray-800">UPI / Razorpay</p>
                    <p className="text-xs text-gray-500">Pay online via UPI, card, or net banking</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₹ {totalPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className="text-agri-green font-bold">FREE</span>
              </div>
              <div className="border-t pt-4 flex justify-between text-xl font-black text-gray-900">
                <span>Total</span>
                <span>₹ {totalPrice.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={handlePayment}
              disabled={cart.length === 0 || isProcessing || !paymentMethod}
              className={`w-full py-4 rounded-xl font-black shadow-lg transition-all active:scale-[0.98] ${
                cart.length === 0 || isProcessing || !paymentMethod
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
                  : 'bg-agri-green text-white hover:bg-green-700'
              }`}
            >
              {isProcessing ? 'Processing...' : 'Place Order'}
            </button>
            
            <p className="text-center text-[10px] text-gray-400 mt-6 uppercase tracking-widest font-bold">
              {paymentMethod === 'COD'
                ? 'Pay on Delivery • No online payment needed'
                : 'Secure Checkout • Razorpay Payment'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;