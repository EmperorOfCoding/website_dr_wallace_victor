const examService = require('../services/examService');
const ExamDTO = require('../dto/examDTO');
const { isAdmin, canAccess } = require('../utils/dtoUtils');

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
        const { patient_id: requestedPatientId } = req.query;
        const user = req.user;
        const userIsAdmin = isAdmin(user);

        // Determine which patient_id to use
        let patientId;
        if (requestedPatientId) {
            // Validate access to this patient's data
            if (!canAccess(user, requestedPatientId)) {
                return res.status(403).json({ status: 'error', message: 'Acesso negado.' });
            }
            patientId = requestedPatientId;
        } else {
            // Use authenticated user's patient_id
            patientId = user?.patient_id;
        }

        if (!patientId) {
            return res.status(400).json({ status: 'error', message: 'ID do paciente necessário.' });
        }

        const exams = await examService.getExamRequestsByPatient(patientId);

        // Apply DTOs based on user role
        const examsDTO = exams.map(exam => ExamDTO.toListDTO(exam, userIsAdmin));

        res.json({ status: 'success', exams: examsDTO });
    } catch (error) {
        console.error('Error listing exam requests:', error);
        res.status(500).json({ status: 'error', message: 'Erro ao listar exames.' });
    }
}

module.exports = {
    createRequest,
    listRequests
};
