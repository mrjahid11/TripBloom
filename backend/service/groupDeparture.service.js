// groupDeparture.service.js
import { GroupDeparture, DEPARTURE_STATUS_ENUM } from '../model/groupDeparture.model.js';

// Create group departure
export async function createGroupDeparture({ packageId, startDate, endDate, totalSeats }) {
  if (!packageId || !startDate || !endDate || typeof totalSeats !== 'number') {
    return { error: 'packageId, startDate, endDate, and totalSeats are required.' };
  }
  const departure = new GroupDeparture({ packageId, startDate, endDate, totalSeats });
  await departure.save();
  return { departure };
}

// Update group departure
export async function updateGroupDeparture({ departureId, startDate, endDate, totalSeats, status }) {
  const departure = await GroupDeparture.findById(departureId);
  if (!departure) return { error: 'Departure not found.' };
  if (typeof totalSeats === 'number' && totalSeats < departure.bookedSeats) {
    return { error: 'totalSeats cannot be less than bookedSeats.' };
  }
  if (startDate) departure.startDate = startDate;
  if (endDate) departure.endDate = endDate;
  if (typeof totalSeats === 'number') departure.totalSeats = totalSeats;
  if (typeof arguments[0].bookedSeats === 'number') departure.bookedSeats = arguments[0].bookedSeats;
  if (status && DEPARTURE_STATUS_ENUM.includes(status)) departure.status = status;
  await departure.save();
  return { departure };
}

// List departures by package, date range, status
export async function listGroupDepartures({ packageId, startDate, endDate, status }) {
  const query = {};
  if (packageId) query.packageId = packageId;
  if (status) query.status = status;
  if (startDate || endDate) {
    query.startDate = {};
    if (startDate) query.startDate.$gte = new Date(startDate);
    if (endDate) query.startDate.$lte = new Date(endDate);
  }
  return await GroupDeparture.find(query);
}

// Close booking / mark full / cancel departure
export async function setGroupDepartureStatus({ departureId, status }) {
  const departure = await GroupDeparture.findById(departureId);
  if (!departure) return { error: 'Departure not found.' };
  if (!DEPARTURE_STATUS_ENUM.includes(status)) return { error: 'Invalid status.' };
  departure.status = status;
  await departure.save();
  // TODO: If status is CANCELLED, update related bookings and trigger refund logic
  return { departure };
}

// Assign operators to a group departure
export async function assignOperatorsToDeparture({ departureId, operatorIds }) {
  const departure = await GroupDeparture.findById(departureId);
  if (!departure) return { error: 'Departure not found.' };
  if (!Array.isArray(operatorIds) || operatorIds.length === 0) {
    return { error: 'operatorIds must be a non-empty array.' };
  }
  // Prevent duplicate assignments
  const currentOps = departure.assignedOperators.map(id => id.toString());
  const newOps = operatorIds.filter(id => !currentOps.includes(id));
  if (newOps.length === 0) {
    return { error: 'All operators are already assigned.' };
  }
  departure.assignedOperators = [...departure.assignedOperators, ...newOps];
  await departure.save();
  return { departure };
}

// List operators assigned to a group departure
export async function listOperatorsForDeparture({ departureId }) {
  const departure = await GroupDeparture.findById(departureId).populate('assignedOperators');
  if (!departure) return { error: 'Departure not found.' };
  return { operators: departure.assignedOperators };
}

// Reassign operator for a group departure
export async function reassignOperatorForDeparture({ departureId, oldOperatorId, newOperatorId }) {
  const departure = await GroupDeparture.findById(departureId);
  if (!departure) return { error: 'Departure not found.' };
  const idx = departure.assignedOperators.findIndex(id => id.toString() === oldOperatorId);
  if (idx === -1) return { error: 'Old operator not assigned to this departure.' };
  // Prevent duplicate assignment
  if (departure.assignedOperators.some(id => id.toString() === newOperatorId)) {
    return { error: 'New operator already assigned.' };
  }
  departure.assignedOperators[idx] = newOperatorId;
  await departure.save();
  return { departure };
}

// Find future departures for operator (for deactivation/reassignment)
export async function findFutureDeparturesForOperator({ operatorId, fromDate = new Date() }) {
  return await GroupDeparture.find({
    assignedOperators: operatorId,
    startDate: { $gte: fromDate }
  });
}

// Remove (deactivate) operator from future departures
export async function removeOperatorFromFutureDepartures({ operatorId, fromDate = new Date() }) {
  const departures = await GroupDeparture.find({
    assignedOperators: operatorId,
    startDate: { $gte: fromDate }
  });
  for (const dep of departures) {
    dep.assignedOperators = dep.assignedOperators.filter(id => id.toString() !== operatorId);
    await dep.save();
  }
  return { updatedCount: departures.length };
}
