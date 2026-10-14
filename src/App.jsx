import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import WebsiteLayout from './components/WebsiteLayout';
import HeroSection from './components/HeroSection';
import ShopByCategory from './components/ShopByCategory';
import TrustSection from './components/TrustSection';
import FeaturedProducts from './components/FeaturedProducts';
import ExpertSupport from './components/ExpertSupport';
import AboutUs from './components/AboutUs';
import ShippingPolicy from './components/ShippingPolicy';
import Gallery from './components/Gallery';
import Weather from './components/Weather';
import BlogList from './components/BlogList';
import BlogDetail from './components/BlogDetail';
import GovernmentSchemes from './components/GovernmentSchemes';
import CategoryProducts from './pages/CategoryProducts';
import Checkout from './pages/Checkout';
import LoginSuccess from './pages/LoginSuccess';
import MyOrders from './pages/MyOrders';

import { LanguageProvider } from './i18n/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';

import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminProductsPage from './pages/admin/Products';
import AdminCategories from './pages/admin/Categories';
import AdminBrands from './pages/admin/Brands';
import AdminOrdersPage from './pages/admin/Orders';
import AdminCustomers from './pages/admin/Customers';
import AdminBanners from './pages/admin/Banners';
import AdminAnalytics from './pages/admin/Analytics';
import AdminSettings from './pages/admin/Settings';

function App() {
  return (
    <AuthProvider>
      <AdminAuthProvider>
        <LanguageProvider>
          <WishlistProvider>
            <CartProvider>
              <Router>
                <div className="font-sans min-h-screen bg-white text-gray-900 selection:bg-agri-green selection:text-white">
                  <Routes>
                    {/* ─── Customer Routes (with Header/Footer/WhatsApp) ─── */}
                    <Route element={<WebsiteLayout />}>
                      <Route path="/" element={
                        <>
                          <HeroSection />
                          <ShopByCategory />
                          <TrustSection />
                          <FeaturedProducts />
                          <ExpertSupport />
                        </>
                      } />
                      <Route path="/shipping-policy" element={<ShippingPolicy />} />
                      <Route path="/about" element={<AboutUs />} />
                      <Route path="/gallery" element={<Gallery />} />
                      <Route path="/weather" element={<Weather />} />
                      <Route path="/blog" element={<BlogList />} />
                      <Route path="/blog/:id" element={<BlogDetail />} />
                      <Route path="/schemes" element={<GovernmentSchemes />} />
                      <Route path="/category/:category" element={<CategoryProducts />} />
                      <Route path="/search" element={<CategoryProducts />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/login-success" element={<LoginSuccess />} />
                      <Route path="/my-orders" element={<MyOrders />} />
                      <Route path="/tips" element={<BlogList />} />
                    </Route>

                    {/* ─── Admin Auth ─── */}
                    <Route path="/admin/login" element={<AdminLogin />} />

                    {/* ─── Admin Routes (with AdminLayout) ─── */}
                    <Route path="/admin" element={<AdminLayout />}>
                      <Route index element={<AdminDashboard />} />
                      <Route path="products" element={<AdminProductsPage />} />
                      <Route path="categories" element={<AdminCategories />} />
                      <Route path="brands" element={<AdminBrands />} />
                      <Route path="orders" element={<AdminOrdersPage />} />
                      <Route path="customers" element={<AdminCustomers />} />
                      <Route path="banners" element={<AdminBanners />} />
                      <Route path="analytics" element={<AdminAnalytics />} />
                      <Route path="settings" element={<AdminSettings />} />
                    </Route>
                  </Routes>
                </div>
              </Router>
            </CartProvider>
          </WishlistProvider>
        </LanguageProvider>
      </AdminAuthProvider>
    </AuthProvider>
  );
}

export default App;
