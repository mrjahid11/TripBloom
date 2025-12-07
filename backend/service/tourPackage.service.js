// tourPackage.service.js
import { TourPackage, TOUR_PACKAGE_TYPES_ENUM, PERSONAL_CATEGORIES_ENUM } from '../model/tourPackage.model.js';

// Create new package
export async function createTourPackage({ title, description, type, category, basePrice, defaultDays, defaultNights, inclusions, destinations, extras }) {
  if (!title || !type || !basePrice) {
    return { error: 'title, type, and basePrice are required.' };
  }
  if (!TOUR_PACKAGE_TYPES_ENUM.includes(type)) {
    return { error: 'Invalid type.' };
  }
  if (type === 'PERSONAL' && !PERSONAL_CATEGORIES_ENUM.includes(category)) {
    return { error: 'Invalid category for PERSONAL type.' };
  }
  if (type === 'GROUP' && category) {
    return { error: 'Category must be null for GROUP type.' };
  }
  // Validate defaultDays and defaultNights
  if (typeof defaultDays !== 'number' || typeof defaultNights !== 'number') {
    return { error: 'defaultDays and defaultNights are required and must be numbers.' };
  }
  const pkg = new TourPackage({
    title,
    description,
    type,
    category,
    basePrice,
    defaultDays,
    defaultNights,
    inclusions,
    destinations,
    extras
  });
  await pkg.save();
  return { package: pkg };
}

// Update package details
export async function updateTourPackage({ packageId, ...updates }) {
  if (updates.type) {
    if (!TOUR_PACKAGE_TYPES_ENUM.includes(updates.type)) {
      return { error: 'Invalid type.' };
    }
    if (updates.type === 'PERSONAL' && !PERSONAL_CATEGORIES_ENUM.includes(updates.category)) {
      return { error: 'Invalid category for PERSONAL type.' };
    }
    if (updates.type === 'GROUP' && updates.category) {
      return { error: 'Category must be null for GROUP type.' };
    }
  }
  const pkg = await TourPackage.findByIdAndUpdate(packageId, updates, { new: true });
  if (!pkg) return { error: 'Package not found.' };
  return { package: pkg };
}

// Activate/deactivate package
export async function setTourPackageActive({ packageId, isActive, force = false }) {
  // TODO: Check for future group departures if deactivating
  // If found and !force, return warning
  // If force, proceed
  const pkg = await TourPackage.findById(packageId);
  if (!pkg) return { error: 'Package not found.' };
  if (!isActive) {
    // TODO: Check for future group departures
    // if (hasFutureDepartures && !force) return { warning: 'Package has future group departures.' };
  }
  pkg.isActive = isActive;
  await pkg.save();
  return { package: pkg };
}

// Get package by ID
export async function getTourPackage(packageId) {
  return await TourPackage.findById(packageId);
}

// List all packages
export async function listTourPackages(filter = {}) {
  return await TourPackage.find(filter);
}

// Delete package
export async function deleteTourPackage(packageId) {
  return await TourPackage.findByIdAndDelete(packageId);
}

// Assign operators to a tour package
export async function assignOperatorsToPackage({ packageId, operatorIds }) {
  const pkg = await TourPackage.findById(packageId);
  if (!pkg) return { error: 'Package not found.' };
  if (!Array.isArray(operatorIds) || operatorIds.length === 0) {
    return { error: 'operatorIds must be a non-empty array.' };
  }
  // Prevent duplicate assignments
  const currentOps = pkg.assignedOperators.map(id => id.toString());
  const newOps = operatorIds.filter(id => !currentOps.includes(id));
  if (newOps.length === 0) {
    return { error: 'All operators are already assigned.' };
  }
  pkg.assignedOperators = [...pkg.assignedOperators, ...newOps];
  await pkg.save();
  return { package: pkg };
}

// List operators assigned to a tour package
export async function listOperatorsForPackage({ packageId }) {
  const pkg = await TourPackage.findById(packageId).populate('assignedOperators');
  if (!pkg) return { error: 'Package not found.' };
  return { operators: pkg.assignedOperators };
}

// Reassign operator for a tour package
export async function reassignOperatorForPackage({ packageId, oldOperatorId, newOperatorId }) {
  const pkg = await TourPackage.findById(packageId);
  if (!pkg) return { error: 'Package not found.' };
  const idx = pkg.assignedOperators.findIndex(id => id.toString() === oldOperatorId);
  if (idx === -1) return { error: 'Old operator not assigned to this package.' };
  // Prevent duplicate assignment
  if (pkg.assignedOperators.some(id => id.toString() === newOperatorId)) {
    return { error: 'New operator already assigned.' };
  }
  pkg.assignedOperators[idx] = newOperatorId;
  await pkg.save();
  return { package: pkg };
}

// Find future packages for operator (for deactivation/reassignment)
export async function findPackagesForOperator({ operatorId }) {
  return await TourPackage.find({
    assignedOperators: operatorId,
    isActive: true
  });
}

// Remove (deactivate) operator from packages
export async function removeOperatorFromPackages({ operatorId }) {
  const packages = await TourPackage.find({
    assignedOperators: operatorId,
    isActive: true
  });
  for (const pkg of packages) {
    pkg.assignedOperators = pkg.assignedOperators.filter(id => id.toString() !== operatorId);
    await pkg.save();
  }
  return { updatedCount: packages.length };
}
