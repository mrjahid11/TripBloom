// groupDeparture.controller.js
import {
  createGroupDeparture,
  updateGroupDeparture,
  listGroupDepartures,
  setGroupDepartureStatus
} from '../service/groupDeparture.service.js';
import {
  assignOperatorsToDeparture,
  listOperatorsForDeparture,
  reassignOperatorForDeparture,
  findFutureDeparturesForOperator,
  removeOperatorFromFutureDepartures
} from '../service/groupDeparture.service.js';

export async function createGroupDepartureController(req, res) {
  const result = await createGroupDeparture(req.body);
  if (result.error) return res.status(400).json({ success: false, message: result.error });
  res.json({ success: true, message: 'Group departure created successfully.', departure: result.departure });
}

export async function updateGroupDepartureController(req, res) {
  const { departureId } = req.params;
  const result = await updateGroupDeparture({ departureId, ...req.body });
  if (result.error) return res.status(400).json({ success: false, message: result.error });
  res.json({ success: true, message: 'Group departure updated successfully.', departure: result.departure });
}

export async function listGroupDeparturesController(req, res) {
  const result = await listGroupDepartures(req.query);
  res.json({ success: true, message: 'Group departures listed successfully.', departures: result });
}

export async function setGroupDepartureStatusController(req, res) {
  const { departureId } = req.params;
  const { status } = req.body;
  const result = await setGroupDepartureStatus({ departureId, status });
  if (result.error) return res.status(400).json({ success: false, message: result.error });
  res.json({ success: true, message: `Departure status set to ${status}.`, departure: result.departure });
}

// Assign operators to a group departure
export async function assignOperatorsToDepartureController(req, res) {
  const { departureId } = req.params;
  const { operatorIds } = req.body;
  const result = await assignOperatorsToDeparture({ departureId, operatorIds });
  if (result.error) return res.status(400).json({ success: false, message: result.error });
  const message = result.departure && result.departure.assignedOperators.length > 0
    ? 'Operators assigned successfully.'
    : 'No operators were assigned.';
  res.json({ success: true, message, departure: result.departure });
}

// List operators assigned to a group departure
export async function listOperatorsForDepartureController(req, res) {
  const { departureId } = req.params;
  const result = await listOperatorsForDeparture({ departureId });
  if (result.error) return res.status(404).json({ success: false, message: result.error });
  const message = result.operators.length === 0
    ? 'No operators assigned to this departure.'
    : 'Operators listed successfully.';
  res.json({ success: true, message, operators: result.operators });
}

// Reassign operator for a group departure
export async function reassignOperatorForDepartureController(req, res) {
  const { departureId } = req.params;
  const { oldOperatorId, newOperatorId } = req.body;
  const result = await reassignOperatorForDeparture({ departureId, oldOperatorId, newOperatorId });
  if (result.error) return res.status(400).json({ success: false, message: result.error });
  const message = 'Operator reassigned successfully.';
  res.json({ success: true, message, departure: result.departure });
}

// Find future departures for operator (for deactivation/reassignment)
export async function findFutureDeparturesForOperatorController(req, res) {
  const { operatorId } = req.params;
  const result = await findFutureDeparturesForOperator({ operatorId });
  const message = result.length === 0
    ? 'No future departures found for this operator.'
    : 'Future departures found for this operator.';
  res.json({ success: true, message, departures: result });
}

// Remove operator from future departures (deactivation)
export async function removeOperatorFromFutureDeparturesController(req, res) {
  const { operatorId } = req.params;
  const result = await removeOperatorFromFutureDepartures({ operatorId });
  const message = result.updatedCount === 0
    ? 'No future departures were updated.'
    : `${result.updatedCount} future departures updated to remove operator.`;
  res.json({ success: true, message, updatedCount: result.updatedCount });
}
