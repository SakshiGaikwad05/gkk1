import { useState, useEffect } from 'react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import adminApi from '../../utils/adminApi';

const Dashboard = () => {
  const { admin } = useAdminAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      // allSettled so one failing endpoint doesn't blank out every card
      const [prodRes, catRes, brandRes, orderRes] = await Promise.allSettled([
        // backend only returns `pagination` when BOTH page and limit are sent
        adminApi.get('/products', { params: { page: 1, limit: 1 } }),
        adminApi.get('/categories'),
        adminApi.get('/brands'),
        adminApi.get('/orders'),
      ]);
      const val = (r) => (r.status === 'fulfilled' ? r.value.data?.data : undefined);
      [prodRes, catRes, brandRes, orderRes].forEach((r) => {
        if (r.status === 'rejected') console.error('[Dashboard] stats request failed:', r.reason);
      });
      setStats({
        products: val(prodRes)?.pagination?.total ?? val(prodRes)?.products?.length ?? 0,
        categories: val(catRes)?.categories?.length ?? 0,
        brands: val(brandRes)?.brands?.length ?? 0,
        orders: val(orderRes)?.orders?.length ?? 0,
      });
    };
    fetchStats();
  }, []);

  const cards = [
    {
      label: 'Products',
      value: stats?.products,
      desc: 'Manage your product catalog',
      link: '/admin/products',
      color: 'bg-blue-500',
      icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    },
    {
      label: 'Categories',
      value: stats?.categories,
      desc: 'Organise products by category',
      link: '/admin/categories',
      color: 'bg-emerald-500',
      icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z',
    },
    {
      label: 'Brands',
      value: stats?.brands,
      desc: 'Manage product brands',
      link: '/admin/brands',
      color: 'bg-violet-500',
      icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',
    },
    {
      label: 'Orders',
      value: stats?.orders,
      desc: 'Track and update customer orders',
      link: '/admin/orders',
      color: 'bg-indigo-500',
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Welcome back, <span className="font-bold text-gray-700">{admin?.email}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {cards.map((card) => (
          <a key={card.label} href={card.link}
            className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-shadow group">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={card.icon} />
                </svg>
              </div>
              {card.value !== undefined && (
                <span className="text-3xl font-black text-gray-900">{card.value}</span>
              )}
            </div>
            <h3 className="text-lg font-black text-gray-900">{card.label}</h3>
            <p className="text-sm text-gray-500 mt-1">{card.desc}</p>
          </a>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-base font-black text-gray-900 mb-2">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <a href="/admin/products" className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-agri-green hover:bg-green-700 transition-colors">+ Add Product</a>
          <a href="/admin/categories" className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors">+ Add Category</a>
          <a href="/admin/brands" className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-violet-500 hover:bg-violet-600 transition-colors">+ Add Brand</a>
          <a href="/admin/banners" className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 transition-colors">+ Add Banner</a>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
