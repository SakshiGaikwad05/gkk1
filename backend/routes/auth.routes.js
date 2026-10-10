import { Router } from 'express';
import passport from 'passport';
import { rateLimit } from 'express-rate-limit';

import {
  register,
  login,
  googleAuth,
  getMe,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  resetPasswordWithOtp,
  verifyOTP,
  setPassword,
  googleOAuthCallback,
} from '../controllers/auth.controller.js';

import { protect } from '../middleware/auth.middleware.js';

import {
  registerValidator,
  loginValidator,
  forgotValidator,
  resetValidator,
  googleValidator,
  verifyOTPValidator,
  resetPasswordWithOtpValidator,
  setPasswordValidator,
} from '../validators/auth.validators.js';

import { ENV } from '../config/env.js';

const router = Router();

const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many attempts. Please try again in 15 minutes.',
  },
});

router.post('/register',      authLimit, registerValidator,   register);
router.post('/login',         authLimit, loginValidator,      login);

const getDefaultClientUrl = () => {
  return ENV.NODE_ENV === 'production' && ENV.PRODUCTION_CLIENT_URL
    ? ENV.PRODUCTION_CLIENT_URL
    : ENV.CLIENT_URL;
};

// Frontends we are willing to send a freshly issued token back to.
const allowedClientOrigins = () =>
  [ENV.CLIENT_URL, ENV.PRODUCTION_CLIENT_URL, ENV.FRONTEND_URL]
    .filter(Boolean)
    .map((u) => u.replace(/\/+$/, ''));

// The frontend passes its own origin (?redirect=...) so the user lands back on
// the exact site they started from (www vs bare domain vs localhost).
// It round-trips through Google in the OAuth `state` param.
const resolveClientUrl = (candidate) => {
  const origin = String(candidate || '').replace(/\/+$/, '');
  return allowedClientOrigins().includes(origin) ? origin : getDefaultClientUrl();
};

router.get('/google', (req, res, next) => {
  if (!ENV.GOOGLE_CLIENT_ID || !ENV.GOOGLE_CLIENT_SECRET) {
    console.log('[OAUTH] Google OAuth not configured - missing credentials');
    return res.status(503).json({ success: false, message: 'Google OAuth not configured.' });
  }
  const clientUrl = resolveClientUrl(req.query.redirect);
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    prompt: 'select_account',
    state: Buffer.from(clientUrl).toString('base64url'),
  })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  let clientUrl;
  try {
    clientUrl = resolveClientUrl(Buffer.from(String(req.query.state || ''), 'base64url').toString());
  } catch {
    clientUrl = getDefaultClientUrl();
  }
  const fail = (reason) => res.redirect(`${clientUrl}/?google_error=${encodeURIComponent(reason)}`);

  // User pressed "Cancel" on Google's consent screen
  if (req.query.error) return fail('cancelled');

  // Custom callback so every failure (reused/expired code, DB error, ...) sends the
  // user back to the shop with a message instead of a raw JSON error page.
  passport.authenticate('google', { session: false }, (err, user) => {
    if (err || !user) {
      console.error('[OAUTH] Google callback failed:', err?.message || 'no user');
      return fail('auth_failed');
    }
    req.user = user;
    googleOAuthCallback(req, res, clientUrl).catch((e) => {
      console.error('[OAUTH] Token issue failed:', e.message);
      fail('auth_failed');
    });
  })(req, res, next);
});

router.post('/refresh-token',           refreshToken);
router.post('/forgot-password', authLimit, forgotValidator,      forgotPassword);
router.post('/verify-otp',    authLimit, verifyOTPValidator,  verifyOTP);
router.post('/reset-password',          resetPasswordWithOtpValidator, resetPasswordWithOtp);
router.post('/reset-password/:token',   resetValidator,       resetPassword);

router.get ('/me',     protect, getMe);
router.post('/logout', protect, logout);
router.post('/set-password', protect, setPasswordValidator, setPassword);

console.log('[ROUTES] Registering auth routes');
console.log('[ROUTES] Google OAuth enabled:', Boolean(ENV.GOOGLE_CLIENT_ID && ENV.GOOGLE_CLIENT_SECRET));

router.get('/debug-oauth-routes', (_req, res) => {
  const googleCallbackUrl = ENV.NODE_ENV === 'production' 
    ? (ENV.GOOGLE_CALLBACK_URL_PROD || ENV.GOOGLE_CALLBACK_URL_DEV)
    : ENV.GOOGLE_CALLBACK_URL_DEV;
  
  return res.json({
    googleEnabled: Boolean(ENV.GOOGLE_CLIENT_ID && ENV.GOOGLE_CLIENT_SECRET),
    callbackUrl: googleCallbackUrl,
    clientUrl: ENV.CLIENT_URL,
    prodClientUrl: ENV.PRODUCTION_CLIENT_URL,
    routes: [
      { method: 'POST', path: '/api/auth/google' },
      { method: 'GET', path: '/api/auth/google' },
      { method: 'GET', path: '/api/auth/google/callback' }
    ]
  });
});

export default router;