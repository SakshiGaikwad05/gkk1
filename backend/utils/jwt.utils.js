import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';

// ─── Token generators ─────────────────────────────────────────────────────────
export const signAccessToken = (payload) =>
  jwt.sign(payload, ENV.JWT_ACCESS_SECRET, { expiresIn: ENV.JWT_ACCESS_EXPIRES });

export const signRefreshToken = (payload) =>
  jwt.sign(payload, ENV.JWT_REFRESH_SECRET, { expiresIn: ENV.JWT_REFRESH_EXPIRES });

// ─── Token verifiers ──────────────────────────────────────────────────────────
export const verifyAccessToken = (token) =>
  jwt.verify(token, ENV.JWT_ACCESS_SECRET);

export const verifyRefreshToken = (token) =>
  jwt.verify(token, ENV.JWT_REFRESH_SECRET);

// ─── Cookie helper ────────────────────────────────────────────────────────────
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export const setRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: ENV.NODE_ENV === 'production',
    sameSite: ENV.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: SEVEN_DAYS_MS,
    // scoped to /api/auth so /logout can also read & revoke it
    // (with the old /api/auth/refresh-token path, logout never saw the cookie)
    path: '/api/auth',
  });
};

export const clearRefreshCookie = (res) => {
  const opts = {
    httpOnly: true,
    secure: ENV.NODE_ENV === 'production',
    sameSite: ENV.NODE_ENV === 'production' ? 'none' : 'lax',
  };
  res.clearCookie('refreshToken', { ...opts, path: '/api/auth' });
  // also clear cookies set by older versions with the narrower path
  res.clearCookie('refreshToken', { ...opts, path: '/api/auth/refresh-token' });
};

// ─── Issue token pair ─────────────────────────────────────────────────────────
export const issueTokenPair = (user) => {
  const payload = {
    id: user._id,
    email: user.email,
    role: user.role,
  };
  console.log('[JWT] issueTokenPair payload:', JSON.stringify(payload));
  return {
    accessToken:  signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
};
