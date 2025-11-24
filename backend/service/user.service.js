// List users with filters (role, active/inactive, search by name/email)
export async function listUsers({ role, isActive, search }) {
  const query = {};
  if (role) {
    query.roles = { $in: [role, role.toLowerCase()] };
  }
  if (typeof isActive === 'boolean') {
    query.isActive = isActive;
  }
  if (search) {
    query.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }
  return await User.find(query, '-passwordHash');
}

// Create a new user (admin only)
export async function createUser({ fullName, email, phone, passwordHash, roles, isActive = true }) {
  if (!fullName || !email || !passwordHash || !roles) {
    return { error: 'fullName, email, passwordHash, and roles are required.' };
  }
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return { error: 'Email already exists.' };
  }
  const user = new User({ fullName, email, phone, passwordHash, roles, isActive });
  await user.save();
  return { user: { fullName, email, phone, roles, isActive } };
}

// Update user info (admin only)
export async function updateUser({ userId, fullName, phone, roles, isActive }) {
  const update = {};
  if (fullName) update.fullName = fullName;
  if (phone) update.phone = phone;
  if (roles) update.roles = roles;
  if (typeof isActive === 'boolean') update.isActive = isActive;
  const user = await User.findByIdAndUpdate(userId, update, { new: true, fields: '-passwordHash' });
  if (!user) return { error: 'User not found.' };
  return { user };
}

// Deactivate user (soft delete)
export async function deactivateUser({ userId }) {
  const user = await User.findByIdAndUpdate(userId, { isActive: false }, { new: true, fields: '-passwordHash' });
  if (!user) return { error: 'User not found.' };
  return { user };
}


// user.service.js
import { User, ROLES } from '../model/user.model.js';


export async function registerUser({ fullName, email, phone, passwordHash, roles }) {
  if (!fullName || !email || !passwordHash || !roles) {
    return { error: 'fullName, email, passwordHash, and roles are required.' };
  }
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return { error: 'Email already exists.' };
  }
  const user = new User({ fullName, email, phone, passwordHash, roles });
  await user.save();
  return { user: { fullName, email, phone, roles } };
}



export async function loginUser({ email, passwordHash }) {
  if (!email || !passwordHash) {
    return { error: 'Email and passwordHash are required.' };
  }
  // Find user with matching email, password, and must be admin
  const user = await User.findOne({ email, passwordHash });
  if (!user) {
    return { error: 'Invalid email or password.' };
  }
  // Check if user is active
  if (!user.isActive) {
    return { error: 'Account is inactive.' };
  }
  // Check if user has ADMIN role
  const isAdmin = Array.isArray(user.roles) ? user.roles.includes('ADMIN') || user.roles.includes('admin') : false;
  if (!isAdmin) {
    return { error: 'Access denied. Not an admin.' };
  }
  // TODO: Generate JWT token here and return it
  // For now, just return user info
  return { user: { fullName: user.fullName, email: user.email, roles: user.roles } };
}
