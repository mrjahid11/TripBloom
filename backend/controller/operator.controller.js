
import { getAssignedGroupDepartures, getOperatorProfile, updateOperatorProfile, getOperatorStats } from '../service/operator.service.js';

// GET /api/operator/:operatorId/dashboard - Get assigned group departures and profile

export async function getOperatorDashboardController(req, res) {
	try {
		const operatorId = req.params.operatorId;
		console.log('DEBUG: operatorId:', operatorId);
		const [profile, groupDepartures] = await Promise.all([
			getOperatorProfile(operatorId),
			getAssignedGroupDepartures(operatorId)
		]);
		console.log('DEBUG: profile:', profile);
		console.log('DEBUG: groupDepartures:', groupDepartures);
		res.json({ profile, groupDepartures });
	} catch (err) {
		console.error('DEBUG: error in getOperatorDashboardController:', err);
		res.status(500).json({ error: 'Failed to fetch operator dashboard', details: err.message });
	}
}

// GET /api/operator/:operatorId/profile - Get operator profile with stats
export async function getOperatorProfileController(req, res) {
	try {
		const operatorId = req.params.operatorId;
		const [profile, stats] = await Promise.all([
			getOperatorProfile(operatorId),
			getOperatorStats(operatorId)
		]);
		
		if (!profile) {
			return res.status(404).json({ error: 'Operator not found' });
		}
		
		res.json({ 
			profile,
			stats: {
				completedTours: stats.completedTours,
				totalTravelers: stats.totalTravelers,
				rating: profile.rating || 0,
				totalReviews: profile.totalReviews || 0
			}
		});
	} catch (err) {
		console.error('ERROR in getOperatorProfileController:', err);
		res.status(500).json({ error: 'Failed to fetch operator profile', details: err.message });
	}
}

// PUT /api/operator/:operatorId/profile - Update operator profile
export async function updateOperatorProfileController(req, res) {
	try {
		const operatorId = req.params.operatorId;
		const updateData = req.body;
		
		const updatedProfile = await updateOperatorProfile(operatorId, updateData);
		
		if (!updatedProfile) {
			return res.status(404).json({ error: 'Operator not found' });
		}
		
		res.json({ 
			message: 'Profile updated successfully',
			profile: updatedProfile 
		});
	} catch (err) {
		console.error('ERROR in updateOperatorProfileController:', err);
		res.status(500).json({ error: 'Failed to update operator profile', details: err.message });
	}
}
