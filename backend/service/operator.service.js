
import { GroupDeparture } from '../model/groupDeparture.model.js';
import { User } from '../model/user.model.js';

// Fetch group departures assigned to a specific operator
import mongoose from 'mongoose';
export async function getAssignedGroupDepartures(operatorId) {
	// Ensure operatorId is ObjectId for query
	const opId = mongoose.Types.ObjectId.isValid(operatorId) ? new mongoose.Types.ObjectId(operatorId) : operatorId;
	const result = await GroupDeparture.find({
		'operators.operatorId': opId
	})
		.populate('packageId')
		.populate('operators.operatorId')
		.exec();
	console.log('DEBUG: getAssignedGroupDepartures for', operatorId, 'found', result.length, 'departures');
	return result;
}

// Fetch operator profile info
export async function getOperatorProfile(operatorId) {
	return User.findById(operatorId).exec();
}

// Update operator profile
export async function updateOperatorProfile(operatorId, updateData) {
	const allowedFields = ['fullName', 'email', 'phone', 'address', 'languages', 'bio', 'availability'];
	const filteredData = {};
	
	// Only update allowed fields
	allowedFields.forEach(field => {
		if (updateData[field] !== undefined) {
			filteredData[field] = updateData[field];
		}
	});
	
	return User.findByIdAndUpdate(
		operatorId,
		{ $set: filteredData },
		{ new: true, runValidators: true }
	).exec();
}

// Get operator statistics
export async function getOperatorStats(operatorId) {
	const opId = mongoose.Types.ObjectId.isValid(operatorId) ? new mongoose.Types.ObjectId(operatorId) : operatorId;
	
	// Get all departures assigned to this operator
	const allDepartures = await GroupDeparture.find({
		'operators.operatorId': opId
	}).exec();
	
	// Calculate completed tours (end date in the past)
	const completedTours = allDepartures.filter(dep => new Date(dep.endDate) < new Date()).length;
	
	// Calculate total travelers
	const totalTravelers = allDepartures.reduce((sum, dep) => sum + (dep.bookedSeats || 0), 0);
	
	return {
		completedTours,
		totalTravelers,
		totalDepartures: allDepartures.length
	};
}
