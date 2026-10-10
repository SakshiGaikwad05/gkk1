import User from '../models/user.model.js';
import { AppError, asyncHandler } from '../utils/asyncHandler.js';
import {
  issueTokenPair,
  verifyRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
} from '../utils/jwt.utils.js';
import { hashToken, generateOTP } from '../utils/crypto.utils.js';
import {
  sendPasswordResetOTPEmail,
  sendWelcomeEmail,
} from '../services/email.service.js';
import { verifyGoogleToken } from '../services/google.service.js';
import { ENV } from '../config/env.js';
import { isAdminEmail, ensureAdminRole, resolveRoleForEmail } from '../utils/admin.utils.js';

const sendTokenResponse = async (res, user, statusCode = 200) => {
  const { accessToken, refreshToken } = issueTokenPair(user);

  try {
    await User.findByIdAndUpdate(
      user._id,
      // keep only the 10 most recent sessions so the array can't grow forever
      { $push: { refreshTokens: { $each: [refreshToken], $slice: -10 } } },
      { new: true }
    );
  } catch (err) {
    console.error('[AUTH] Failed to store refresh token:', err.message);
  }

  setRefreshCookie(res, refreshToken);

  const responseBody = {
    success: true,
    message: statusCode === 201 ? 'Account created successfully.' : 'Logged in successfully.',
    token: accessToken,
    data: {
      token: accessToken,
      accessToken,
      user: user.toPublic(),
    },
  };

  console.log('[AUTH] *** sendTokenResponse: user.role =', user.role);
  console.log('[AUTH] *** sendTokenResponse: toPublic().role =', responseBody.data.user.role);
  console.log('[AUTH] *** sendTokenResponse: full JSON body =', JSON.stringify(responseBody, (key, val) => key === 'token' || key === 'accessToken' ? '[REDACTED]' : val, 2));

  res.status(statusCode).json(responseBody);
};

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!email || !password || !name) {
    throw new AppError('Name, email and password are required.', 400);
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new AppError('An account with this email already exists.', 409);

  const user = await User.create({
    name: name.trim(),
    email,
    password,
    role: resolveRoleForEmail(email),
  });

  sendWelcomeEmail({ to: user.email, name: user.name }).catch(() => {});

  await sendTokenResponse(res, user, 201);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Email and password are required.', 400);
  }

  console.log('[AUTH] Login attempt for:', email);

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user) {
    console.log('[AUTH] Login failed: user not found for email:', email);
    throw new AppError('Invalid email or password.', 401);
  }

  if (!user.password) {
    console.log('[AUTH] Login failed: no password for user:', user.email);
    throw new AppError('This account uses Google login. Please continue with Google or set a password first.', 401);
  }

  let isValidPassword = false;
  try {
    isValidPassword = await user.comparePassword(password);
  } catch (err) {
    console.error('[AUTH] Password comparison error:', err.message);
    throw new AppError('Invalid email or password.', 401);
  }

  if (!isValidPassword) {
    console.log('[AUTH] Login failed: invalid password for user:', user.email);
    throw new AppError('Invalid email or password.', 401);
  }

  await ensureAdminRole(user);

  console.log('===========================================================');
  console.log('[AUTH] === LOGIN FLOW TRACE ===');
  console.log('[AUTH] 1. Login email received from request:', email);
  console.log('[AUTH] 2. process.env.ADMIN_EMAILS:', JSON.stringify(process.env.ADMIN_EMAILS));
  console.log('[AUTH] ENV.ADMIN_EMAILS:', ENV.ADMIN_EMAILS);
  console.log('[AUTH] 3. User.role after ensureAdminRole:', user.role);
  console.log('[AUTH] 4. Result of isAdminEmail:', isAdminEmail(email));
  console.log('[AUTH] === END LOGIN FLOW TRACE ===');
  console.log('===========================================================');
  await sendTokenResponse(res, user);
});

export const googleAuth = asyncHandler(async (req, res) => {
  const { idToken } = req.body;
  const payload = await verifyGoogleToken(idToken);

  const { sub: googleId, email, name, picture } = payload;

  const userRole = resolveRoleForEmail(email);

  console.log('[AUTH] Google OAuth callback for:', email);

  // Find user by googleId OR by email (handles existing email-signup users)
  let user = await User.findOne({ $or: [{ googleId }, { email: email.toLowerCase() }] });

  if (user) {
    // Existing user - link Google account if not already linked
    const wasLinked = !user.googleId;
    if (!user.googleId) {
      user.googleId = googleId;
      user.isVerified = true;
      if (picture && !user.avatar) user.avatar = picture;
      console.log('[AUTH] Linked Google account to existing user:', email);
    }
    await user.save();
    await ensureAdminRole(user);
  } else {
    // New Google user - create account without password
    user = await User.create({
      name,
      email: email.toLowerCase(),
      googleId,
      avatar: picture || null,
      isVerified: true,
      role: userRole,
    });
    console.log('[AUTH] Created new Google user:', email);
  }

  console.log('[AUTH] Google login success:', user.email);
  await sendTokenResponse(res, user);
});

export const getMe = asyncHandler(async (req, res) => {
  const publicUser = req.user.toPublic();
  console.log('[AUTH] *** getMe: returning user with role:', publicUser.role, '| email:', publicUser.email, '| id:', publicUser.id);
  console.log('[AUTH] *** getMe: full body:', JSON.stringify(publicUser));
  res.json({
    success: true,
    message: 'User retrieved successfully.',
    data: { user: publicUser },
  });
});

export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (token) {
    await User.findByIdAndUpdate(req.user._id, { $pull: { refreshTokens: token } });
  }

  clearRefreshCookie(res);

  res.json({ success: true, message: 'Logged out successfully.', data: null });
});

export const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw new AppError('No refresh token provided.', 401);

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw new AppError('Invalid or expired refresh token. Please log in again.', 401);
  }

  const user = await User.findById(decoded.id);
  if (!user) throw new AppError('User no longer exists.', 401);

  console.log('[AUTH] *** refreshToken: role before ensureAdminRole:', user.role);
  await ensureAdminRole(user);
  console.log('[AUTH] *** refreshToken: role after ensureAdminRole:', user.role);

  const { accessToken, refreshToken: newRefreshToken } = issueTokenPair(user);

  // MongoDB rejects $pull + $push on the same field in one update ("would create a
  // conflict"), so swap the token with a pipeline $set. Matching on the old token
  // keeps it single-use: a replayed/rotated token finds nothing.
  const updatedUser = await User.findOneAndUpdate(
    { _id: user._id, refreshTokens: token },
    [{
      $set: {
        refreshTokens: {
          $slice: [
            {
              $concatArrays: [
                { $filter: { input: '$refreshTokens', cond: { $ne: ['$$this', token] } } },
                [newRefreshToken],
              ],
            },
            -10,
          ],
        },
      },
    }],
    { new: true }
  );

  if (!updatedUser) {
    clearRefreshCookie(res);
    throw new AppError('Session expired. Please log in again.', 401);
  }

  setRefreshCookie(res, newRefreshToken);

  res.json({
    success: true,
    message: 'Token refreshed successfully.',
    data: { accessToken, user: updatedUser.toPublic() },
  });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new AppError('Email is required.', 400);
  }

  console.log('[AUTH] Forgot password request for:', email);

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  const genericResponse = () =>
    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
      data: null,
    });

  if (!user) {
    console.log('[AUTH] Forgot password: user not found');
    return genericResponse();
  }

  // Allow both regular users and Google users to reset password
  // Google users can now set a password through this flow
  const otp = generateOTP();
  const otpHash = hashToken(otp);

  user.passwordResetOtp = {
    code: otpHash,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    verified: false,
  };
  await user.save({ validateBeforeSave: false });

  if (ENV.NODE_ENV !== 'production') {
    console.log('[AUTH DEBUG] Forgot password OTP for', user.email, ':', otp);
  }

  try {
    await sendPasswordResetOTPEmail({ to: user.email, name: user.name, otp });
    console.log('[AUTH] Password reset OTP email sent to:', user.email);
  } catch (emailErr) {
    console.warn('[AUTH] Password reset email failed for', user.email, '-', emailErr.message);
  }

  genericResponse();
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!token || !password) {
    throw new AppError('Token and new password are required.', 400);
  }

  const hashedToken = hashToken(token);

  const user = await User.findOne({
    resetPasswordToken:  hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  }).select('+resetPasswordToken +resetPasswordExpire');

  if (!user) throw new AppError('Reset token is invalid or has expired.', 400);

  user.password            = password;
  user.resetPasswordToken  = undefined;
  user.resetPasswordExpire = undefined;
  user.refreshTokens       = [];
  await user.save();

  clearRefreshCookie(res);

  console.log('[AUTH] Password reset success for:', user.email);

  res.json({
    success: true,
    message: 'Password reset successful. Please log in with your new password.',
    data: null,
  });
});

export const resetPasswordWithOtp = asyncHandler(async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    throw new AppError('Email and new password are required.', 400);
  }

  console.log('[AUTH] Reset password with OTP for:', email);

  const user = await User.findOne({ email: email.toLowerCase() })
    .select('+passwordResetOtp.code +passwordResetOtp.expiresAt +passwordResetOtp.verified +refreshTokens');

  if (!user) throw new AppError('No account found with that email address.', 404);
  if (!user.passwordResetOtp?.verified) {
    throw new AppError('OTP verification is required before resetting password.', 400);
  }
  if (!user.passwordResetOtp?.expiresAt || new Date() > user.passwordResetOtp.expiresAt) {
    throw new AppError('OTP has expired. Please request a new one.', 400);
  }

  user.password = newPassword;
  user.passwordResetOtp = {
    code: undefined,
    expiresAt: undefined,
    verified: false,
  };
  user.refreshTokens = [];
  await user.save();

  clearRefreshCookie(res);

  console.log('[AUTH] Password reset success for:', user.email);

  res.json({
    success: true,
    message: 'Password set successfully. You can now login.',
    data: null,
  });
});

export const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new AppError('Email and OTP are required.', 400);
  }

  console.log('[AUTH] Verify OTP for:', email);

  const user = await User.findOne({ email: email.toLowerCase() })
    .select('+passwordResetOtp.code +passwordResetOtp.expiresAt +passwordResetOtp.verified');

  if (!user) throw new AppError('No account found with that email address.', 404);

  if (!user.passwordResetOtp?.code || !user.passwordResetOtp?.expiresAt) {
    throw new AppError('No OTP was requested for this email.', 400);
  }

  if (new Date() > user.passwordResetOtp.expiresAt) {
    throw new AppError('OTP has expired. Please request a new one.', 400);
  }

  const hashedInput = hashToken(otp);
  if (hashedInput !== user.passwordResetOtp.code) {
    console.log('[AUTH] Verify OTP failed: invalid OTP for:', email);
    throw new AppError('Invalid OTP. Please try again.', 400);
  }

  user.passwordResetOtp.verified = true;
  await user.save({ validateBeforeSave: false });

  console.log('[AUTH] OTP verified for:', email);

  res.json({
    success: true,
    message: 'OTP verified successfully. You can now set your password.',
    data: null,
  });
});

export const setPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;

  if (!password) {
    throw new AppError('New password is required.', 400);
  }

  req.user.password = password;
  await req.user.save();

  console.log('[AUTH] Password set for:', req.user.email);

  res.json({
    success: true,
    message: 'Password set successfully.',
    data: { user: req.user.toPublic() },
  });
});

// Called from the custom passport callback in auth.routes.js (not as Express
// middleware), so it returns a promise and the caller handles failures.
export const googleOAuthCallback = async (req, res, clientUrl) => {
  const user = req.user;
  if (!user) {
    console.error('[OAUTH] Callback error: user not found in session');
    throw new AppError('Google authentication failed.', 401);
  }

  await ensureAdminRole(user);

  const { accessToken, refreshToken } = issueTokenPair(user);

  await User.findByIdAndUpdate(
    user._id,
    { $push: { refreshTokens: { $each: [refreshToken], $slice: -10 } } },
    { new: true }
  );

  setRefreshCookie(res, refreshToken);

  console.log('[OAUTH] Google login success for', user.email, '-> redirecting to', clientUrl);
  return res.redirect(`${clientUrl}/login-success?token=${encodeURIComponent(accessToken)}`);
};