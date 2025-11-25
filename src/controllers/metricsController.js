const metricsService = require('../services/metricsService');

async function getMetrics(req, res) {
  try {
    // doctorId can be null for admins - they see metrics for all doctors
    const doctorId = req.user?.doctor_id || null;
    const { period } = req.query;
    
    const metrics = await metricsService.getMetrics(doctorId, period || 'month');

    return res.status(200).json({ status: 'success', metrics });
  } catch (error) {
    console.error('Error getting metrics:', error);
    return res.status(500).json({ status: 'error', message: 'Erro ao buscar métricas.' });
  }
}

module.exports = {
  getMetrics,
};


