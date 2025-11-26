const examService = require('../services/examService');

async function createRequest(req, res) {
    try {
        const { patient_id, appointment_id, exam_name } = req.body;
        const doctor_id = req.user.doctor_id; // Assumes doctor is logged in

        if (!doctor_id) {
            return res.status(403).json({ status: 'error', message: 'Apenas médicos podem solicitar exames.' });
        }

        if (!patient_id || !exam_name) {
            return res.status(400).json({ status: 'error', message: 'Dados incompletos.' });
        }

        const id = await examService.createExamRequest({
            patient_id,
            doctor_id,
            appointment_id,
            exam_name
        });

        res.status(201).json({ status: 'success', id, message: 'Exame solicitado com sucesso.' });
    } catch (error) {
        console.error('Error creating exam request:', error);
        res.status(500).json({ status: 'error', message: 'Erro ao solicitar exame.' });
    }
}

async function listRequests(req, res) {
    try {
        const { patient_id } = req.query;
        const user = req.user;

        // If patient, can only see own exams
        if (!user.doctor_id && user.patient_id && Number(patient_id) !== Number(user.patient_id)) {
            return res.status(403).json({ status: 'error', message: 'Acesso negado.' });
        }

        // If doctor, can see any patient's exams (or we could restrict to their patients)
        // For now, allow doctor to see exams for the patient they are viewing

        if (!patient_id) {
            return res.status(400).json({ status: 'error', message: 'ID do paciente necessário.' });
        }

        const exams = await examService.getExamRequestsByPatient(patient_id);
        res.json({ status: 'success', exams });
    } catch (error) {
        console.error('Error listing exam requests:', error);
        res.status(500).json({ status: 'error', message: 'Erro ao listar exames.' });
    }
}

module.exports = {
    createRequest,
    listRequests
};
