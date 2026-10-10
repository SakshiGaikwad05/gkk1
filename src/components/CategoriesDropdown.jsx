import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  ChevronRight,
  CircleDot
} from 'lucide-react';
import api from '../utils/api';

const CategoriesDropdown = ({ isOpen, onClose, selectedCategory }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);

  useEffect(() => {
    api.get('/categories')
      .then((res) => setCategories(res.data?.data?.categories || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredCategories = searchQuery
    ? categories.filter((cat) =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : categories;

  const activeCategory = selectedCategory === 'all' ? null : selectedCategory;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return (
    <div className="hidden">
      <div ref={dropdownRef} />
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onClose} />

      <div
        ref={dropdownRef}
        className="fixed left-0 right-0 top-auto mt-0 bg-white z-[100] shadow-2xl border-t border-gray-100 animate-slideDown lg:fixed lg:top-auto lg:mt-0 lg:left-0 lg:right-0"
      >
        <div className="max-w-7xl mx-auto">
          {/* Search */}
          <div className="px-4 py-4 border-b border-gray-100 flex items-center gap-3 lg:px-6 lg:py-5">
            <div className="relative flex-1 max-w-xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search categories..."
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-agri-green/50 focus:border-agri-green transition-all"
                />
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight size={22} className="rotate-90" />
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-gray-400">Loading categories...</div>
          ) : filteredCategories.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-600 font-medium">No categories found</p>
            </div>
          ) : (
            <>
              {/* Mobile list */}
              <div className="lg:hidden">
                {filteredCategories.map((cat) => (
                  <Link
                    key={cat._id || cat.slug}
                    to={`/category/${cat.slug}`}
                    onClick={onClose}
                    className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <CircleDot size={12} className="text-green-500 shrink-0" />
                    <span className="text-sm text-gray-600 font-medium">{cat.name}</span>
                  </Link>
                ))}
              </div>

              {/* Desktop grid */}
              <div className="hidden lg:grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-0 p-0">
                {filteredCategories.map((cat) => (
                  <Link
                    key={cat._id || cat.slug}
                    to={`/category/${cat.slug}`}
                    onClick={onClose}
                    className={`flex items-center gap-3 p-4 border-r border-gray-100 border-b border-gray-100 hover:bg-gray-50/50 transition-colors ${
                      activeCategory === cat.slug ? 'bg-agri-green/5 border-b-2 border-b-agri-green' : ''
                    }`}
                  >
                    <CircleDot size={14} className="text-green-500 shrink-0" />
                    <span className="text-sm font-bold text-gray-700 hover:text-agri-green transition-colors">
                      {cat.name}
                    </span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.25s ease-out forwards;
        }
      `}</style>
    </>
  );
};

export default CategoriesDropdown;
