// List users with filters (role, active/inactive, search by name/email)
export async function listUsers({ role, isActive, search }) {
  const query = {};
  if (role) {
    // Handle all case variations and operator aliases
    const roleVariations = [
      role, 
      role.toLowerCase(), 
      role.toUpperCase()
    ];
    // Add 'operator' variations if role is tour_operator
    if (role.toLowerCase() === 'tour_operator' || role.toLowerCase() === 'operator') {
      roleVariations.push('operator', 'OPERATOR', 'tour_operator', 'TOUR_OPERATOR');
    }
    query.roles = { $in: roleVariations };
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
import { TourPackage } from '../model/tourPackage.model.js';


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
  // Find user with matching email and password
  const user = await User.findOne({ email, passwordHash });
  if (!user) {
    return { error: 'Invalid email or password.' };
  }
  // Check if user is active
  if (!user.isActive) {
    return { error: 'Account is inactive.' };
  }
  // Allow login for any active user, return user info and roles
  // TODO: Generate JWT token here and return it
  return { user: { _id: user._id, fullName: user.fullName, email: user.email, roles: user.roles } };
}

// Saved packages management
export async function getSavedPackagesForUser({ userId }) {
  const user = await User.findById(userId).populate('savedPackages');
  if (!user) return { error: 'User not found.' };
  return { packages: user.savedPackages || [] };
}

export async function savePackageForUser({ userId, packageId }) {
  const user = await User.findById(userId);
  if (!user) return { error: 'User not found.' };
  const pkg = await TourPackage.findById(packageId);
  if (!pkg) return { error: 'Package not found.' };
  const exists = user.savedPackages?.some(id => id.toString() === packageId.toString());
  if (!exists) {
    user.savedPackages = [...(user.savedPackages || []), pkg._id];
    await user.save();
  }
  return { success: true };
}

export async function unsavePackageForUser({ userId, packageId }) {
  const user = await User.findById(userId);
  if (!user) return { error: 'User not found.' };
  user.savedPackages = (user.savedPackages || []).filter(id => id.toString() !== packageId.toString());
  await user.save();
  return { success: true };
}
