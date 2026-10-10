import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'https://gkk1.onrender.com';

const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

const validateForm = (view, formData) => {
    const { name, email, password, newPassword, confirmPassword } = formData;
    if (view === 'register' && (!name || name.trim().length < 2)) {
        return 'Name must be at least 2 characters.';
    }
    if (view === 'forgotOtp' && !/^\d{6}$/.test(formData.otp || '')) {
        return 'Enter the 6-digit code from your email.';
    }
    if (view === 'forgotOtp' && (!newPassword || newPassword.length < 6)) {
        return 'New password must be at least 6 characters.';
    }
    if (view === 'forgotOtp' && newPassword !== confirmPassword) {
        return 'Confirm password must match.';
    }
    if (['login', 'register', 'forgot'].includes(view) && (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
        return 'Please enter a valid email address.';
    }
    if (['login', 'register'].includes(view) && (!password || password.length < 6)) {
        return 'Password must be at least 6 characters.';
    }
    return null;
};

const LoginModal = ({ isOpen, onClose, onLoginSuccess, initialError = '' }) => {
    const { login } = useAuth();
    const [view, setView] = useState('login');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [formData, setFormData] = useState({ name: '', email: '', password: '', otp: '', newPassword: '', confirmPassword: '' });

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
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

    useEffect(() => {
        if (isOpen && initialError) setError(initialError);
    }, [isOpen, initialError]);

    useEffect(() => {
        if (!isOpen) {
            setView('login');
            setError('');
            setFormData({ name: '', email: '', password: '', otp: '', newPassword: '', confirmPassword: '' });
            setSuccess(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const switchView = (next) => {
        setView(next);
        setError('');
        setFormData({ name: '', email: '', password: '', otp: '', newPassword: '', confirmPassword: '' });
    };

    const finishLogin = (user) => {
        setSuccessMsg(`Welcome${user.name ? ', ' + user.name.split(' ')[0] : ''}!`);
        setSuccess(true);
        setTimeout(() => {
            onLoginSuccess(user);
            onClose();
            setSuccess(false);
            setSuccessMsg('');
            setIsLoading(false);
            setError('');
            setView('login');
            setFormData({ name: '', email: '', password: '', otp: '', newPassword: '', confirmPassword: '' });
        }, 1400);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const validationError = validateForm(view, formData);
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsLoading(true);
        try {
            if (view === 'forgot') {
                await api.post('/auth/forgot-password', { email: formData.email });
                setSuccessMsg('If an account exists, a 6-digit code has been sent to your email.');
                setSuccess(true);
                setTimeout(() => {
                    setSuccess(false);
                    setIsLoading(false);
                    // go to the OTP + new password step (keep the email; it's needed there)
                    setView('forgotOtp');
                }, 2000);
                return;
            }

            if (view === 'forgotOtp') {
                await api.post('/auth/verify-otp', {
                    email: formData.email,
                    otp: formData.otp,
                });

                await api.post('/auth/reset-password', {
                    email: formData.email,
                    newPassword: formData.newPassword,
                });

                setSuccessMsg('Password reset successfully. Please login with your new password.');
                setSuccess(true);
                setTimeout(() => {
                    setSuccess(false);
                    setIsLoading(false);
                    setView('login');
                    setFormData({ name: '', email: '', password: '', otp: '', newPassword: '', confirmPassword: '' });
                }, 1800);
                return;
            }

            const epMap = { login: '/login', register: '/register' };
            const plMap = {
                login: { email: formData.email, password: formData.password },
                register: { name: formData.name.trim(), email: formData.email, password: formData.password },
            };

            const res = await api.post(`/auth${epMap[view]}`, plMap[view]);
            const token = res?.data?.token || res?.data?.data?.token || res?.data?.data?.accessToken;
            const user = res?.data?.data?.user;
            if (!token || !user) {
                throw new Error('Invalid login response');
            }
            localStorage.setItem('token', token);
            login(token, user);
            finishLogin(user);
        } catch (err) {
            if (err.message.includes('Network Error') || err.code === 'ECONNREFUSED') {
                setError('Server not reachable');
            } else if (err.response) {
                setError(err.response.data?.message || 'Something went wrong');
            } else {
                setError('Request failed. Please try again.');
            }
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        // tell the backend which site to come back to (www vs bare domain vs localhost)
        const googleAuthUrl = `${API_URL}/api/auth/google?redirect=${encodeURIComponent(window.location.origin)}`;
        window.location.href = googleAuthUrl;
    };

    const headerMap = {
        login: { title: 'Welcome Back!', sub: 'Sign in to Gawande Krushi' },
        register: { title: 'Create Account', sub: 'Join the Krushi community' },
        forgot: { title: 'Reset Password', sub: "Enter your email to reset password" },
        forgotOtp: { title: 'Reset Password', sub: 'Enter OTP and create new password' },
    };
    const { title, sub } = headerMap[view];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
            <div className="relative w-full max-w-[400px] bg-white rounded-2xl shadow-2xl overflow-hidden animate-scaleIn" onClick={(e) => e.stopPropagation()}>
                <div className={`relative flex flex-col items-center justify-center py-8 px-6 bg-agri-green`}>
                    {!success && (
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/leaf.png')] opacity-10 pointer-events-none" />
                    )}

                    {success && (
                        <div className="flex flex-col items-center gap-3 py-4">
                            <CheckCircle2 size={52} className="text-white animate-bounce" />
                            <p className="text-white text-xl font-bold">{successMsg}</p>
                        </div>
                    )}

                    {!success && (
                        <div className="relative z-10 flex flex-col items-center gap-2">
                            <img
                              src="/logo.png"
                              alt="Gawande Krushi Kendra"
                              decoding="async"
                              className="h-14 w-auto max-w-[min(100%,12rem)] object-contain bg-white rounded-xl px-2 py-1.5 shadow"
                            />
                            <h2 className="text-xl font-bold text-white">{title}</h2>
                            <p className="text-sm text-white/80">{sub}</p>
                        </div>
                    )}

                    {view === 'register' && !success && (
                        <button
                            onClick={() => switchView('login')}
                            className="absolute top-3 left-3 p-2 rounded-full transition-all text-white/70 hover:bg-white/15"
                            aria-label="Back to login"
                        >
                            <ArrowLeft size={18} />
                        </button>
                    )}

                    <button onClick={onClose} className="absolute top-3 right-3 p-2 rounded-full transition-all text-white/70 hover:bg-white/15" aria-label="Close">
                        <X size={18} />
                    </button>
                </div>

                {!success && (
                    <div className="px-7 py-6">
                        <div className="space-y-4">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {view === 'register' && (
                                    <div>
                                        <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Full Name</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                            <input type="text" name="name" required autoComplete="name" placeholder="Your full name" value={formData.name} onChange={(e) => { setFormData({ ...formData, name: e.target.value }); setError(''); }} className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-agri-green/25 focus:border-agri-green outline-none transition-all placeholder:text-gray-400" />
                                        </div>
                                    </div>
                                )}

                                {view !== 'forgotOtp' && (
                                    <div>
                                        <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Email address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                            <input type="email" name="email" required autoComplete="email" placeholder="Enter email" value={formData.email} onChange={(e) => { setFormData({ ...formData, email: e.target.value }); setError(''); }} className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-agri-green/25 focus:border-agri-green outline-none transition-all placeholder:text-gray-400" />
                                        </div>
                                    </div>
                                )}

                                {view === 'forgot' && (
                                    <p className="text-[12px] text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                                        We'll send a 6-digit code to your email.
                                    </p>
                                )}

                                {view === 'forgotOtp' && (
                                    <>
                                        <div>
                                            <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">OTP sent to email</label>
                                            <input type="text" name="otp" maxLength="6" required placeholder="Enter 6-digit OTP" value={formData.otp} onChange={(e) => { setFormData({ ...formData, otp: e.target.value.replace(/\D/g, '') }); setError(''); }} className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-agri-green/25 focus:border-agri-green outline-none transition-all placeholder:text-gray-400 tracking-[0.3em]" />
                                        </div>
                                        <div>
                                            <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">New password</label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                                <input type={showPassword ? 'text' : 'password'} name="newPassword" required autoComplete="new-password" placeholder="Enter new password" value={formData.newPassword} onChange={(e) => { setFormData({ ...formData, newPassword: e.target.value }); setError(''); }} className="w-full pl-9 pr-10 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-agri-green/25 focus:border-agri-green outline-none transition-all placeholder:text-gray-400" />
                                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Confirm password</label>
                                            <input type={showPassword ? 'text' : 'password'} name="confirmPassword" required autoComplete="new-password" placeholder="Confirm new password" value={formData.confirmPassword} onChange={(e) => { setFormData({ ...formData, confirmPassword: e.target.value }); setError(''); }} className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-agri-green/25 focus:border-agri-green outline-none transition-all placeholder:text-gray-400" />
                                        </div>
                                    </>
                                )}

                                {['login', 'register'].includes(view) && (
                                    <div>
                                        <div className="flex justify-between items-center mb-1.5">
                                            <label className="text-[13px] font-semibold text-gray-700">Password</label>
                                            {view === 'login' && (
                                                <button type="button" onClick={() => switchView('forgot')} className="text-[12px] font-semibold text-agri-green hover:underline">Forgot password?</button>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                            <input type={showPassword ? 'text' : 'password'} name="password" required autoComplete={view === 'login' ? 'current-password' : 'new-password'} placeholder="Enter password (min. 6 characters)" value={formData.password} onChange={(e) => { setFormData({ ...formData, password: e.target.value }); setError(''); }} className="w-full pl-9 pr-10 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-agri-green/25 focus:border-agri-green outline-none transition-all placeholder:text-gray-400" />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {error && (
                                    <p className="text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-center">{error}</p>
                                )}

                                <button type="submit" disabled={isLoading} className="w-full py-2.5 bg-agri-orange hover:bg-orange-500 active:bg-orange-600 text-white text-sm font-bold rounded-lg shadow-sm shadow-orange-300 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                                    {isLoading ? <Loader2 className="animate-spin" size={18} /> : view === 'login' ? 'Sign In' : view === 'register' ? 'Create your account' : view === 'forgot' ? 'Send Reset Link' : 'Reset Password'}
                                </button>

                                {view === 'register' && (
                                    <p className="text-[11px] text-gray-400 leading-relaxed">
                                        By creating an account, you agree to Gawande Krushi Kendra's{' '}
                                        <span className="text-agri-green underline cursor-pointer">Conditions of Use</span> and{' '}
                                        <span className="text-agri-green underline cursor-pointer">Privacy Notice</span>.
                                    </p>
                                )}
                            </form>

                            {['login', 'register'].includes(view) && (
                                <>
                                    <div className="flex items-center gap-3 py-1">
                                        <div className="flex-1 border-t border-gray-200" />
                                        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">or</span>
                                        <div className="flex-1 border-t border-gray-200" />
                                    </div>
                                    <button onClick={handleGoogleLogin} className="w-full py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2.5 shadow-sm">
                                        <GoogleIcon />
                                        Continue with Google
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {!success && (
                    <div className="px-7 pb-6 border-t border-gray-100 pt-4 text-center">
                        <p className="text-[12px] text-gray-500">
                            {view === 'login' ? (
                                <>New to Gawande Krushi? <button onClick={() => switchView('register')} className="text-agri-green font-bold hover:underline">Create an account</button></>
                            ) : view === 'register' ? (
                                <>Already have an account? <button onClick={() => switchView('login')} className="text-agri-green font-bold hover:underline">Sign in</button></>
                            ) : (
                                <>Remember your password? <button onClick={() => switchView('login')} className="text-agri-green font-bold hover:underline">Sign in</button></>
                            )}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoginModal;