import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

const AdminLogin = () => {
  console.log("AdminLogin rendered");
  const navigate = useNavigate();
  const { isAdminAuthenticated, adminLogin } = useAdminAuth();

  useEffect(() => {
    if (isAdminAuthenticated) {
      navigate('/admin');
    }
  }, [isAdminAuthenticated, navigate]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = (email || '').trim();
    const trimmedPassword = (password || '').trim();

    if (!trimmedEmail || !trimmedPassword) {
      setError('Email and password are required.');
      return;
    }

    setLoading(true);
    try {
      await adminLogin(trimmedEmail, trimmedPassword);
      navigate('/admin');
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        (err?.response ? 'Login failed. Check your credentials.' : 'Cannot reach the server. Is the backend running?')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-agri-green rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
            </div>
            <h1 className="text-2xl font-black text-gray-900">Admin Login</h1>
            <p className="text-sm text-gray-500 mt-1">Gawande Krushi Kendra</p>
          </div>

          <form onSubmit={(e) => { console.log("FORM SUBMIT"); handleSubmit(e); }} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-semibold">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-agri-green/25 focus:border-agri-green outline-none"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-agri-green/25 focus:border-agri-green outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                console.log("BUTTON CLICK");
                handleSubmit({ preventDefault() { console.log("preventDefault called"); } });
              }}
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white bg-agri-green hover:bg-green-700 disabled:opacity-60 transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="/" className="text-sm text-agri-green font-bold hover:underline">
              Back to Store
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
