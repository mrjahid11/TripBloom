// stats.controller.js
import { getPlatformStats, getBookingStats } from '../service/stats.service.js';

// Get platform statistics
export async function getPlatformStatsController(req, res) {
  const result = await getPlatformStats();

  if (result.error) {
    return res.status(500).json({
      success: false,
      message: result.error
    });
  }

  res.json({
    success: true,
    stats: result.stats
  });
}

// Get booking statistics
export async function getBookingStatsController(req, res) {
  const result = await getBookingStats();

  if (result.error) {
    return res.status(500).json({
      success: false,
      message: result.error
    });
  }

  res.json({
    success: true,
    stats: result.stats
  });
}
