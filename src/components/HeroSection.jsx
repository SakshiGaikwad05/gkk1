import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import heroImage from '../assets/hero.webp';

const API_BASE = import.meta.env.VITE_API_URL || 'https://gkk1.onrender.com';

// Cloudinary images are already absolute URLs; only legacy /uploads paths need the API host
const imageUrl = (src) => (!src ? '' : /^https?:\/\//.test(src) ? src : `${API_BASE}${src}`);

const HeroSection = () => {
  const { t } = useLanguage();
  const [banners, setBanners] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/banners`);
        const data = await res.json();
        const activeBanners = data?.data?.banners || [];
        if (activeBanners.length > 0) {
          setBanners(activeBanners);
        }
      } catch {} finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const goTo = useCallback((i) => setCurrent(i), []);

  if (banners.length > 0 && banners[current]) {
    const b = banners[current];
    return (
      <section className="relative w-full min-h-[500px] md:min-h-[550px] overflow-hidden flex items-center">
        <div className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${imageUrl(b.image) || heroImage})` }} />
        <div className="absolute inset-0 z-10 bg-black/40" />
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
        <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-0">
          <div className="max-w-2xl text-center md:text-left mx-auto md:mx-0">
            {b.subtitle && (
              <span className="inline-block py-1 px-3 rounded-full bg-green-500/20 text-white font-semibold text-xs md:text-sm mb-4 border border-green-400/30 uppercase tracking-wider">
                {b.subtitle}
              </span>
            )}
            <h1 className="text-4xl sm:text-4xl md:text-5xl lg:text-5xl font-bold text-white leading-tight tracking-tight mb-4 md:mb-6">
              {b.title}
            </h1>
            {b.link ? (
              <a href={b.link}
                className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-all duration-300 hover:scale-105">
                {b.buttonText || 'Shop Now'}
              </a>
            ) : (
              <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-all duration-300 hover:scale-105">
                {b.buttonText || 'Shop Now'}
              </button>
            )}
          </div>
        </div>
        {banners.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {banners.map((_, i) => (
              <button key={i} onClick={() => goTo(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${i === current ? 'bg-white w-6' : 'bg-white/50'}`} />
            ))}
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="relative w-full min-h-[500px] md:min-h-[550px] bg-agri-light overflow-hidden flex items-center">
      <div className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }} />
      <div className="absolute inset-0 z-10 bg-black/30" />
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
      <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-0">
        <div className="max-w-2xl text-center md:text-left mx-auto md:mx-0">
          <span className="inline-block py-1 px-3 rounded-full bg-green-500/20 text-white font-semibold text-xs md:text-sm mb-4 border border-green-400/30 uppercase tracking-wider">
            {t('season')}
          </span>
          <h1 className="text-4xl sm:text-4xl md:text-5xl lg:text-5xl font-bold text-white leading-tight tracking-tight mb-4 md:mb-6">
            {t('hero_title1')} <br className="hidden sm:block" />
            <span className="text-green-400">{t('hero_highlight')}</span> {t('hero_title2')}
          </h1>
          <p className="text-base md:text-lg text-gray-200 mb-8 max-w-xl mx-auto md:mx-0 leading-relaxed">
            {t('hero_desc')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center md:justify-start">
            <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-all duration-300 hover:scale-105 w-full sm:w-auto">
              {t('shop_now')}
            </button>
            <button className="bg-white hover:bg-green-50 text-green-700 border border-green-600 font-bold py-3 px-6 rounded-lg transition-all duration-300 hover:scale-105 w-full sm:w-auto">
              {t('view_categories')}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
