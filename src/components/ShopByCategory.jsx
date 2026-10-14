import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import api from '../utils/api';
import { getCategoryImage } from '../utils/categoryImages';
import './ShopByCategory.css';

const PLACEHOLDER = 'https://placehold.co/200x200?text=Category';

const ShopByCategory = () => {
  const { language } = useLanguage();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/categories')
      .then((res) => setCategories(res.data?.data?.categories || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="shop-by-category py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="category-section-title">
          <span className="title-accent"></span>
          {language === 'mar' ? 'श्रेणीनुसार खरेदी करा' : 'Shop by Category'}
        </h2>

        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="text-center py-8 text-gray-400">No categories available yet.</div>
        ) : (
          <div className="category-grid">
            {categories.map((cat) => (
              <Link
                key={cat._id || cat.slug}
                to={`/category/${cat.slug}`}
                className="category-card"
              >
                <div className="card-image-wrapper">
                  <img
                    src={getCategoryImage(cat) || PLACEHOLDER}
                    alt={cat.name}
                    loading="lazy"
                    className="card-image"
                    onError={(e) => { e.target.style.opacity = '0.3'; }}
                  />
                </div>
                <span className="card-name">{cat.name}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ShopByCategory;
