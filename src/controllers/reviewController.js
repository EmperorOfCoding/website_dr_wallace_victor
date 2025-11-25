const reviewService = require('../services/reviewService');
const pool = require('../config/db');

async function getReview(req, res) {
  try {
    const { appointmentId } = req.params;
    const review = await reviewService.getReviewByAppointmentId(appointmentId);
    return res.status(200).json({ status: 'success', review });
  } catch (error) {
    console.error('Error getting review:', error);
    return res.status(500).json({ status: 'error', message: 'Erro ao buscar avaliação.' });
  }
}

async function createReview(req, res) {
  try {
    const { appointmentId } = req.params;
    const patientId = req.user?.patient_id;
    const { rating, comment } = req.body;

    if (!patientId) {
      return res.status(401).json({ status: 'error', message: 'Não autorizado.' });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ status: 'error', message: 'Avaliação deve ser entre 1 e 5.' });
    }

    // Get doctor_id from appointment
    const [rows] = await pool.execute(
      'SELECT doctor_id FROM appointments WHERE id = ?',
      [appointmentId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Consulta não encontrada.' });
    }
    const doctorId = rows[0].doctor_id;

    const review = await reviewService.createReview(
      parseInt(appointmentId),
      patientId,
      doctorId,
      rating,
      comment
    );

    return res.status(201).json({ status: 'success', review, message: 'Avaliação enviada com sucesso.' });
  } catch (error) {
    if (error.message === 'REVIEW_EXISTS') {
      return res.status(409).json({ status: 'error', message: 'Você já avaliou esta consulta.' });
    }
    if (error.message === 'APPOINTMENT_NOT_FOUND') {
      return res.status(404).json({ status: 'error', message: 'Consulta não encontrada.' });
    }
    if (error.message === 'APPOINTMENT_NOT_COMPLETED') {
      return res.status(400).json({ status: 'error', message: 'Só é possível avaliar consultas já realizadas.' });
    }
    console.error('Error creating review:', error);
    return res.status(500).json({ status: 'error', message: 'Erro ao criar avaliação.' });
  }
}

async function updateReview(req, res) {
  try {
    const { appointmentId } = req.params;
    const patientId = req.user?.patient_id;
    const { rating, comment } = req.body;

    if (!patientId) {
      return res.status(401).json({ status: 'error', message: 'Não autorizado.' });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ status: 'error', message: 'Avaliação deve ser entre 1 e 5.' });
    }

    const review = await reviewService.updateReview(
      parseInt(appointmentId),
      patientId,
      rating,
      comment
    );

    return res.status(200).json({ status: 'success', review, message: 'Avaliação atualizada com sucesso.' });
  } catch (error) {
    if (error.message === 'REVIEW_NOT_FOUND') {
      return res.status(404).json({ status: 'error', message: 'Avaliação não encontrada.' });
    }
    console.error('Error updating review:', error);
    return res.status(500).json({ status: 'error', message: 'Erro ao atualizar avaliação.' });
  }
}

async function getMyReviews(req, res) {
  try {
    const patientId = req.user?.patient_id;
    if (!patientId) {
      return res.status(401).json({ status: 'error', message: 'Não autorizado.' });
    }

    const reviews = await reviewService.getReviewsByPatientId(patientId);
    return res.status(200).json({ status: 'success', reviews });
  } catch (error) {
    console.error('Error getting reviews:', error);
    return res.status(500).json({ status: 'error', message: 'Erro ao buscar avaliações.' });
  }
}

async function getDoctorReviews(req, res) {
  try {
    const doctorId = req.user?.doctor_id;
    if (!doctorId) {
      return res.status(401).json({ status: 'error', message: 'Não autorizado.' });
    }

    const reviews = await reviewService.getReviewsByDoctorId(doctorId);
    const stats = await reviewService.getAverageRatingByDoctorId(doctorId);

    return res.status(200).json({ status: 'success', reviews, stats });
  } catch (error) {
    console.error('Error getting doctor reviews:', error);
    return res.status(500).json({ status: 'error', message: 'Erro ao buscar avaliações.' });
  }
}

module.exports = {
  getReview,
  createReview,
  updateReview,
  getMyReviews,
  getDoctorReviews,
};


