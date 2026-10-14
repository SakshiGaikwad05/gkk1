import React, { useState, useEffect, useRef } from 'react';
import { Search, Globe, Truck, Heart, ShoppingCart, Phone, Menu, X, ChevronRight, LogOut } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import LoginModal from './LoginModal';
import BrandsDropdown from './BrandsDropdown';
import CategoriesDropdown from './CategoriesDropdown';
import Navbar from './Navbar';
import CartDrawer from './CartDrawer';
import WishlistDrawer from './WishlistDrawer';

// Helper: get initials from a name
const getInitials = (name = '') => {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

// Avatar circle — shows initials, or Google photo if available
const UserAvatar = ({ user, size = 'md', fallbackUrl = null }) => {
  const initials = user?.name ? getInitials(user.name) : '?';
  const sizeClass = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';

  const avatarSrc = user?.avatar || user?.photoURL || user?.picture || fallbackUrl;

  if (avatarSrc && typeof avatarSrc === 'string') {
    return (
      <img
        src={avatarSrc}
        alt={user?.name || 'User'}
        className={`${sizeClass} rounded-full object-cover ring-2 ring-white shadow`}
        onError={(e) => {
          e.target.style.display = 'none';
          e.target.nextSibling?.style?.removeProperty('display');
        }}
      />
    );
  }

  return (
    <div className={`${sizeClass} rounded-full bg-agri-green text-white flex items-center justify-center font-bold ring-2 ring-white shadow select-none`}>
      {initials}
    </div>
  );
};

const categoryIds = {
  all: 'all',
  cropProtection: 'crop-protection',
  cropNutrition: 'crop-nutrition',
  equipments: 'equipments',
  organic: 'organic',
};

const Header = () => {
  const { language, toggleLanguage, t } = useLanguage();
  const { user, isLoading: authLoading, logout } = useAuth();
  const { cartTotal } = useCart();
  const { wishlist } = useWishlist();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [googleLoginError, setGoogleLoginError] = useState('');
  const [isBrandsDropdownOpen, setIsBrandsDropdownOpen] = useState(false);
  const [isCategoriesDropdownOpen, setIsCategoriesDropdownOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [activeBrand, setActiveBrand] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const brandsDropdownRef = useRef(null);

  // keep the box in sync with the results page (e.g. after back/forward)
  useEffect(() => {
    if (location.pathname === '/search') {
      setSearchQuery(new URLSearchParams(location.search).get('q') || '');
    }
  }, [location.pathname, location.search]);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setIsMobileSearchOpen(false);
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/^\/brand\/(.+)$/);
    if (match) {
      setActiveBrand(match[1]);
      setIsBrandsDropdownOpen(true);
      localStorage.setItem('agri_active_brand', match[1]);
    }
  }, []);

  useEffect(() => {
    const savedBrand = localStorage.getItem('agri_active_brand');
    if (savedBrand && !window.location.pathname.match(/^\/brand\//)) {
      setActiveBrand(savedBrand);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const googleError = params.get('google_error');
    if (googleError) {
      setGoogleLoginError(
        googleError === 'cancelled'
          ? 'Google sign-in was cancelled.'
          : 'Google sign-in failed. Please try again.'
      );
      setIsLoginModalOpen(true);
      window.history.replaceState({}, '', '/');
    }
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleLoginSuccess = (userData) => {
    if (userData?.role === 'admin') {
      window.location.href = '/my-orders';
    }
  };

  const handleLogout = async () => {
    await logout('/');
  };

  return (
    <header className="relative w-full bg-white shadow-sm border-b border-gray-100 flex flex-col pt-0 z-[100]">
      {/* Top Strip */}
      <div className="bg-agri-dark text-white text-[10px] sm:text-xs py-1.5 px-4 flex justify-between items-center sm:px-6 lg:px-8">
        <div className="flex space-x-3 sm:space-x-4">
          <a href="#" className="hover:text-agri-orange transition-colors">{t('top_sell')}</a>
          <a href="#" className="hover:text-agri-orange transition-colors hidden xs:inline">{t('top_bulk')}</a>
        </div>
        <div className="flex items-center space-x-2">
          <Phone size={10} className="sm:w-3 sm:h-3" />
          <span>{t('top_call')} +919021605445</span>
        </div>
      </div>

      {/* Main Header */}
      <div className="py-4 md:py-5 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex items-center justify-between gap-2 md:gap-4 min-w-0">
        {/* Mobile Menu Toggle */}
        <button
          onClick={toggleMenu}
          className="lg:hidden shrink-0 p-1.5 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          aria-label="Toggle menu"
        >
          <Menu size={24} />
        </button>

        {/* Logo — height-based sizing so vertical branding is never cropped */}
        <Link
          to="/"
          className="flex items-center gap-2 md:gap-3 min-w-0 max-w-[min(100%,calc(100vw-9.5rem))] sm:max-w-none shrink sm:shrink-0"
        >
          <img
            src="/logo.png"
            alt="Gawande Krushi Kendra"
            decoding="async"
            className="h-12 md:h-16 w-auto max-w-full min-w-0 object-contain"
          />
          <span className="text-lg md:text-2xl font-extrabold text-gray-800 tracking-tight hidden xs:block truncate">
            Gawande <span className="text-agri-green">Krushi</span>
          </span>
        </Link>

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl mx-1 md:mx-6 hidden sm:block">
          <form onSubmit={handleSearch} role="search" className="relative flex items-center w-full h-10 md:h-11 rounded-md border border-gray-300 bg-gray-50 overflow-hidden focus-within:border-agri-green focus-within:ring-1 focus-within:ring-agri-green transition-all shadow-inner">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('search_placeholder')}
              aria-label="Search products"
              className="w-full h-full px-4 outline-none bg-transparent text-sm placeholder:text-gray-400"
            />
            <button type="submit" aria-label="Search" className="h-full px-4 md:px-5 bg-agri-orange text-white hover:bg-orange-500 transition-colors flex items-center justify-center">
              <Search size={18} />
            </button>
          </form>
        </div>

        {/* Right Icons */}
        <div className="flex shrink-0 items-center space-x-2 sm:space-x-4 md:space-x-6 text-gray-600">

          {/* Language */}
          <div onClick={toggleLanguage} className="relative flex flex-col items-center cursor-pointer group hidden lg:flex">
            <div className="p-2 rounded-full group-hover:bg-agri-green/10 transition-all duration-300 group-hover:-translate-y-1">
              <Globe size={22} className="group-hover:text-agri-green transition-colors" />
            </div>
            <span className="absolute -bottom-4 text-[9px] font-bold uppercase text-agri-green opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0 whitespace-nowrap">
              {language === 'en' ? 'EN / MAR' : 'MAR / EN'}
            </span>
          </div>

          {/* Mobile Search */}
          <button type="button" aria-label="Search" onClick={() => setIsMobileSearchOpen((o) => !o)} className="sm:hidden p-2 text-gray-600 hover:text-agri-green hover:bg-agri-green/10 rounded-full transition-all duration-300 group">
            <Search size={22} className="group-hover:scale-110 transition-transform" />
          </button>

          {/* Track Order */}
          <div className="relative flex flex-col items-center cursor-pointer group hidden xl:flex">
            <div className="p-2 rounded-full group-hover:bg-agri-green/10 transition-all duration-300 group-hover:-translate-y-1">
              <Truck size={22} className="group-hover:text-agri-green transition-colors" />
            </div>
            <span className="absolute -bottom-4 text-[9px] font-bold uppercase text-agri-green opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0 whitespace-nowrap">
              {t('track_order')}
            </span>
          </div>

          {/* Wishlist */}
          <div 
            onClick={() => setIsWishlistOpen(true)}
            className="relative flex flex-col items-center cursor-pointer group hidden sm:flex"
          >
            <div className="p-2 rounded-full group-hover:bg-agri-green/10 transition-all duration-300 group-hover:-translate-y-1 relative">
              <Heart size={22} className="group-hover:text-agri-green transition-colors" />
              {wishlist.length > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-[1px] rounded-full shadow-sm ring-2 ring-white">
                  {wishlist.length}
                </span>
              )}
            </div>
            <span className="absolute -bottom-4 text-[9px] font-bold uppercase text-agri-green opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0 whitespace-nowrap">
              {t('wishlist')}
            </span>
          </div>

          {/* ── Account Button ── */}
          <div
            onClick={() => !user && setIsLoginModalOpen(true)}
            className="relative flex flex-col items-center cursor-pointer group"
          >
            <div className="flex items-center gap-2 p-1 md:p-1.5 rounded-full group-hover:bg-agri-green/10 transition-all duration-300">
              {user ? (
                <>
                  <UserAvatar user={user} size="md" />
                  <span className="text-sm font-bold text-gray-800 hidden md:block max-w-[90px] truncate leading-none">
                    {user.name.split(' ')[0]}
                  </span>
                </>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="p-2 rounded-full group-hover:bg-agri-green/10 transition-all duration-300 group-hover:-translate-y-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:text-agri-green transition-colors">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <span className="absolute -bottom-4 text-[9px] font-bold uppercase text-agri-green opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0 whitespace-nowrap">
                    {t('login')}
                  </span>
                </div>
              )}
            </div>

            {/* Dropdown — only visible when logged in */}
            {user && (
              <div className="absolute top-full right-0 mt-2 w-60 bg-white border border-gray-100 shadow-2xl rounded-2xl py-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[100] transform translate-y-2 group-hover:translate-y-0">
                <div className="px-4 py-3 border-b border-gray-50 mb-2 flex items-center gap-3">
                  <UserAvatar user={user} size="md" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase text-agri-green tracking-wider mb-0.5">Welcome back</p>
                    <p className="text-sm font-extrabold text-gray-900 truncate">{user.name}</p>
                    <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                  </div>
                </div>
                <div className="px-2">
                  <Link
                    to="/my-orders"
                    className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors font-semibold"
                  >
                    <div className="p-1.5 bg-gray-100 rounded-lg">
                      <Truck size={14} />
                    </div>
                    <span>My Orders</span>
                  </Link>
                  {user?.role === 'admin' && (
                    <>
                      <Link
                        to="/admin"
                        className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors font-semibold"
                      >
                        <div className="p-1.5 bg-gray-100 rounded-lg">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="7" height="7" />
                            <rect x="14" y="3" width="7" height="7" />
                            <rect x="3" y="14" width="7" height="7" />
                            <rect x="14" y="14" width="7" height="7" />
                          </svg>
                        </div>
                        <span>Admin Panel</span>
                      </Link>
                    </>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors font-semibold"
                  >
                    <div className="p-1.5 bg-red-100 rounded-lg">
                      <LogOut size={14} />
                    </div>
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Cart */}
          <div 
            onClick={() => setIsCartOpen(true)}
            className="relative flex flex-col items-center cursor-pointer group"
          >
            <div className="p-2 rounded-full group-hover:bg-agri-green/10 transition-all duration-300 group-hover:-translate-y-1 relative">
              <ShoppingCart size={22} className="group-hover:text-agri-green transition-colors" />
              <span className="absolute top-1 right-1 bg-agri-orange text-white text-[10px] font-bold px-1.5 py-[1px] rounded-full shadow-sm ring-2 ring-white">{cartTotal}</span>
            </div>
            <span className="absolute -bottom-4 text-[9px] font-bold uppercase text-agri-green opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0 whitespace-nowrap">
              {t('cart')}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Search (toggled by the search icon) */}
      {isMobileSearchOpen && (
        <form onSubmit={handleSearch} role="search" className="sm:hidden flex items-center gap-2 px-4 pb-3">
          <input
            type="search"
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('search_placeholder')}
            aria-label="Search products"
            className="flex-1 h-10 px-3 rounded-md border border-gray-300 bg-gray-50 text-sm outline-none focus:border-agri-green focus:ring-1 focus:ring-agri-green placeholder:text-gray-400"
          />
          <button type="submit" aria-label="Search" className="h-10 px-4 rounded-md bg-agri-orange text-white hover:bg-orange-500 transition-colors flex items-center justify-center">
            <Search size={18} />
          </button>
        </form>
      )}

      <Navbar />

      {/* Brands Mega Menu - Desktop */}
      <div className="hidden lg:block">
        <BrandsDropdown 
          isOpen={isBrandsDropdownOpen} 
          onClose={() => setIsBrandsDropdownOpen(false)}
          activeBrand={activeBrand}
          onBrandSelect={(slug) => {
            setActiveBrand(slug);
            localStorage.setItem('agri_active_brand', slug);
          }}
        />
      </div>

      {/* Categories Mega Menu - Desktop */}
      <div className="hidden lg:block">
        <CategoriesDropdown 
          isOpen={isCategoriesDropdownOpen} 
          onClose={() => { setIsCategoriesDropdownOpen(false); setSelectedCategory(null); }}
          selectedCategory={selectedCategory}
        />
      </div>

      {/* Mobile Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 lg:hidden" onClick={toggleMenu} />
      )}

      {/* Mobile Drawer */}
      <div className={`fixed top-0 left-0 bottom-0 w-[280px] bg-white z-[60] lg:hidden transform transition-transform duration-300 ease-in-out shadow-2xl flex flex-col ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-agri-green text-white gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <img
              src="/logo.png"
              alt="Gawande Krushi Kendra"
              decoding="async"
              className="h-10 w-auto max-w-[40%] shrink-0 object-contain bg-white/95 rounded-md px-1 py-0.5 sm:max-w-[7rem]"
            />
            <div className="min-w-0">
              <span className="text-sm font-semibold leading-tight block break-words max-w-[140px]">Gawande Krushi Kendra</span>
              <span className="text-xs text-gray-200">Since 2006</span>
            </div>
          </div>
          <button onClick={toggleMenu} className="p-1 hover:bg-white/10 rounded-full">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          <div onClick={toggleLanguage} className="flex items-center justify-between px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50">
            <div className="flex items-center space-x-3 text-gray-700">
              <Globe size={20} className="text-agri-green" />
              <span className="font-medium">{language === 'en' ? 'English' : 'मराठी'}</span>
            </div>
            <span className="text-[10px] font-bold text-agri-green bg-agri-green/10 px-2 py-0.5 rounded uppercase">
              {language === 'en' ? 'Switch to Marathi' : 'इंग्रजीमध्ये बदला'}
            </span>
          </div>

          <div className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">{t('nav_all')}</div>
          <ul className="text-sm font-semibold text-gray-700">
            <li 
              onClick={() => { setIsBrandsDropdownOpen(true); setIsMenuOpen(false); }}
              className="flex items-center justify-between px-4 py-3 hover:bg-agri-light hover:text-agri-green cursor-pointer transition-colors border-l-4 border-transparent hover:border-agri-green text-agri-green"
            >
              <span>{t('nav_brands')}</span>
              <ChevronRight size={16} className="text-gray-300" />
            </li>
            {[t('nav_seeds'), t('nav_crop_prot'), t('nav_crop_nutri'), t('nav_equip'), t('nav_organic')].map((label) => (
              <li key={label} className="flex items-center justify-between px-4 py-3 hover:bg-agri-light hover:text-agri-green cursor-pointer transition-colors border-l-4 border-transparent hover:border-agri-green">
                <span>{label}</span>
                <ChevronRight size={16} className="text-gray-300" />
              </li>
            ))}
          </ul>

          <div className="mt-4 px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Account & More</div>
          <ul className="text-sm font-semibold text-gray-700">
            <li className="flex items-center space-x-3 px-4 py-3 hover:bg-agri-light text-gray-600">
              <Truck size={18} /><span>{t('track_order')}</span>
            </li>
            <li 
              onClick={() => { setIsWishlistOpen(true); setIsMenuOpen(false); }}
              className="flex items-center space-x-3 px-4 py-3 hover:bg-agri-light text-gray-600 cursor-pointer"
            >
              <Heart size={18} /><span>{t('wishlist')}</span>
            </li>
            <li className="flex items-center space-x-3 px-4 py-3 hover:bg-agri-light text-gray-600">
              <Phone size={18} /><span>Contact Support</span>
            </li>
          </ul>
        </div>

        {/* Mobile drawer footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100">
          {user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 px-1">
                <UserAvatar user={user} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-800 truncate">{user.name}</p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full bg-red-500 text-white font-bold py-2.5 rounded-md shadow-md flex items-center justify-center gap-2"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => { setIsLoginModalOpen(true); setIsMenuOpen(false); }}
                className="w-full bg-agri-green text-white font-bold py-2.5 rounded-md shadow-md"
              >
                {t('login')}
              </button>
              <button
                onClick={() => { setIsLoginModalOpen(true); setIsMenuOpen(false); }}
                className="w-full bg-white border-2 border-agri-green text-agri-green font-bold py-2.5 rounded-md"
              >
                Create Account
              </button>
            </div>
          )}
        </div>
      </div>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => { setIsLoginModalOpen(false); setGoogleLoginError(''); }}
        initialError={googleLoginError}
        onLoginSuccess={handleLoginSuccess}
      />

      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />

      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
      />

      {/* Brands Mega Menu - Mobile */}
      <div className="lg:hidden">
        <BrandsDropdown 
          isOpen={isBrandsDropdownOpen} 
          onClose={() => setIsBrandsDropdownOpen(false)} 
        />
      </div>

      {/* Categories Mega Menu - Mobile */}
      <div className="lg:hidden">
        <CategoriesDropdown 
          isOpen={isCategoriesDropdownOpen} 
          onClose={() => { setIsCategoriesDropdownOpen(false); setSelectedCategory(null); }}
          selectedCategory={selectedCategory}
        />
      </div>
    </header>
  );
};

export default Header;