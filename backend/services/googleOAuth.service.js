import User from '../models/user.model.js';
import { ensureAdminRole, resolveRoleForEmail } from '../utils/admin.utils.js';

// User schema requires a 2–80 char name; Google display names can be 1 char,
// empty, or very long, which would make User.create throw.
const safeName = (name, email) => {
  let n = String(name || '').trim() || String(email).split('@')[0] || 'Google User';
  if (n.length < 2) n = `${n} User`;
  return n.slice(0, 80);
};

export const findOrCreateGoogleUser = async ({ googleId, email, name, picture }) => {
  if (!email) throw new Error('Google account has no email address.');
  let user = await User.findOne({ $or: [{ googleId }, { email: email.toLowerCase() }] });

  if (user) {
    let shouldSave = false;

    if (!user.googleId) {
      user.googleId = googleId;
      shouldSave = true;
    }
    if (!user.isVerified) {
      user.isVerified = true;
      shouldSave = true;
    }
    if (picture && !user.avatar) {
      user.avatar = picture;
      shouldSave = true;
    }
    if (shouldSave) {
      await user.save();
    }

    await ensureAdminRole(user);
    return user;
  }

  const userRole = resolveRoleForEmail(email);

  return User.create({
    name: safeName(name, email),
    email: email.toLowerCase(),
    googleId,
    avatar: picture || null,
    isVerified: true,
    role: userRole,
  });
};
