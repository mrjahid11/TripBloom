import { listUsers, createUser, updateUser, deactivateUser } from '../service/user.service.js';
// List users with filters (role, active/inactive, search)
export async function listUsersController(req, res) {
  const { role, isActive, search } = req.query;
  try {
    const users = await listUsers({ role, isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined, search });
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}

// Create a new user (admin only)
export async function createUserController(req, res) {
  const { fullName, email, phone, passwordHash, roles, isActive } = req.body;
  try {
    const result = await createUser({ fullName, email, phone, passwordHash, roles, isActive });
    if (result.error) {
      return res.status(result.error === 'Email already exists.' ? 409 : 400).json({ success: false, message: result.error });
    }
    res.json({ success: true, message: 'User created successfully.', user: result.user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}

// Update user info (admin only)
export async function updateUserController(req, res) {
  const { userId } = req.params;
  const { fullName, phone, roles, isActive } = req.body;
  try {
    const result = await updateUser({ userId, fullName, phone, roles, isActive });
    if (result.error) {
      return res.status(404).json({ success: false, message: result.error });
    }
    res.json({ success: true, message: 'User updated successfully.', user: result.user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}

// Deactivate user (soft delete)
export async function deactivateUserController(req, res) {
  const { userId } = req.params;
  try {
    const result = await deactivateUser({ userId });
    if (result.error) {
      return res.status(404).json({ success: false, message: result.error });
    }
    res.json({ success: true, message: 'User deactivated successfully.', user: result.user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}
import { getSavedPackagesForUser, savePackageForUser, unsavePackageForUser } from '../service/user.service.js';

export async function getSavedPackagesController(req, res) {
  const { userId } = req.params;
  try {
    const result = await getSavedPackagesForUser({ userId });
    if (result.error) return res.status(404).json({ success: false, message: result.error });
    res.json({ success: true, packages: result.packages });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}

export async function savePackageController(req, res) {
  const { userId, packageId } = req.params;
  try {
    const result = await savePackageForUser({ userId, packageId });
    if (result.error) return res.status(404).json({ success: false, message: result.error });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}

export async function unsavePackageController(req, res) {
  const { userId, packageId } = req.params;
  try {
    const result = await unsavePackageForUser({ userId, packageId });
    if (result.error) return res.status(404).json({ success: false, message: result.error });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}
import { User } from '../model/user.model.js';
// Get all users (for testing/demo only)
export async function getAllUsersController(req, res) {
  try {
    const users = await User.find({}, '-passwordHash'); // Exclude passwordHash field
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}
// user.controller.js
import { registerUser, loginUser } from '../service/user.service.js';
import { ROLES } from '../model/user.model.js';

export async function signupController(req, res) {
  const { fullName, email, phone, passwordHash, roles } = req.body;
  try {
    const result = await registerUser({ fullName, email, phone, passwordHash, roles });
    if (result.error) {
      return res.status(result.error === 'Email already exists.' ? 409 : 400).json({ success: false, message: result.error });
    }
    res.json({ success: true, message: 'User registered successfully.', user: result.user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}

export async function loginController(req, res) {
  const { email, passwordHash } = req.body;
  try {
    const result = await loginUser({ email, passwordHash });
    if (result.error) {
      return res.status(result.error === 'Invalid email or password.' ? 401 : 400).json({ success: false, message: result.error });
    }
    res.json({ success: true, message: 'Login successful.', user: result.user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}

// Simulated role-based middleware
export function requireRole(role) {
  return (req, res, next) => {
    // Allow role to be supplied via request header (x-user-role) or body for compatibility
    const userRole = (req.headers['x-user-role'] || req.headers['user-role'] || req.body.role || '').toString();
    if (!userRole) {
      return res.status(403).json({ success: false, message: 'Forbidden: role not provided.' });
    }
    if (userRole.toLowerCase() === role.toLowerCase()) {
      return next();
    }
    return res.status(403).json({ success: false, message: 'Forbidden: insufficient role.' });
  };
}
