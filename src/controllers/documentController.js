const documentService = require('../services/documentService');
const path = require('path');
const fs = require('fs');

async function getDocuments(req, res) {
    try {
        // Allow doctor to pass patient_id via query, otherwise use authenticated user's patient_id
        const patientId = req.query.patient_id || req.user?.patient_id;
        const appointmentId = req.query.appointment_id;

        // If it's a doctor request (has doctor_id in user object), they can access any patient's documents
        const isDoctor = !!req.user?.doctor_id;

        if (!patientId && !appointmentId) {
            return res.status(400).json({ status: 'error', message: 'Paciente ou consulta é obrigatório.' });
        }

        // If not a doctor and trying to access another patient's documents (if patientId is provided and differs)
        if (!isDoctor && patientId && Number(patientId) !== Number(req.user?.patient_id)) {
            return res.status(403).json({ status: 'error', message: 'Acesso negado.' });
        }

        let documents;
        if (appointmentId) {
            documents = await documentService.getDocumentsByAppointmentId(appointmentId);
        } else {
            documents = await documentService.getDocumentsByPatientId(patientId);
        }

        return res.status(200).json({ status: 'success', documents });
    } catch (error) {
        console.error('Error getting documents:', error);
        return res.status(500).json({ status: 'error', message: 'Erro ao buscar documentos.' });
    }
}

async function uploadDocument(req, res) {
    try {
        // Check if user is doctor or patient
        const isDoctor = !!req.user?.doctor_id;

        // If doctor, patient_id must be in body. If patient, use from token.
        let patientId = isDoctor ? req.body.patient_id : req.user?.patient_id;

        // Debug logging
        console.log('📤 Upload document request:', {
            isDoctor,
            patient_id_from_body: req.body.patient_id,
            patient_id_from_user: req.user?.patient_id,
            patientId_final: patientId,
            has_file: !!req.file
        });

        if (!patientId) {
            return res.status(400).json({ status: 'error', message: 'ID do paciente é obrigatório.' });
        }

        // Ensure patientId is an integer
        patientId = parseInt(patientId);

        if (!req.file) {
            return res.status(400).json({ status: 'error', message: 'Nenhum arquivo enviado.' });
        }

        // Check file size (10MB limit to avoid MySQL packet size issues)
        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
        if (req.file.size > MAX_FILE_SIZE) {
            return res.status(400).json({
                status: 'error',
                message: 'Arquivo muito grande. Tamanho máximo: 10MB'
            });
        }

        const { appointment_id, description, exam_request_id, type } = req.body;

        console.log('📂 File details:', {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            size_formatted: `${(req.file.size / 1024 / 1024).toFixed(2)} MB`
        });

        const document = await documentService.saveDocument(
            patientId,
            req.file,
            appointment_id ? parseInt(appointment_id) : null,
            description,
            exam_request_id ? parseInt(exam_request_id) : null,
            type || 'document'
        );

        return res.status(201).json({ status: 'success', document, message: 'Documento enviado com sucesso.' });
    } catch (error) {
        console.error('Error uploading document:', error);
        return res.status(500).json({ status: 'error', message: 'Erro ao enviar documento.' });
    }
}

async function downloadDocument(req, res) {
    try {
        const { id } = req.params;
        const document = await documentService.getDocumentById(id);

        if (!document) {
            return res.status(404).json({ status: 'error', message: 'Documento não encontrado.' });
        }

        // Verify ownership (patient or admin)
        const patientId = req.user?.patient_id;
        const isAdmin = req.user?.doctor_id || req.user?.role === 'admin';

        // If not admin, must be the document owner
        if (!isAdmin) {
            if (!patientId) {
                return res.status(401).json({ status: 'error', message: 'Acesso não autorizado.' });
            }
            // Compare as numbers to avoid type mismatch issues
            if (Number(document.patient_id) !== Number(patientId)) {
                return res.status(403).json({ status: 'error', message: 'Acesso negado.' });
            }
        }

        const filePath = await documentService.getDocumentPath(id);

        if (!filePath || !fs.existsSync(filePath)) {
            return res.status(404).json({ status: 'error', message: 'Arquivo não encontrado.' });
        }

        res.setHeader('Content-Disposition', `attachment; filename="${document.original_name}"`);
        res.setHeader('Content-Type', document.mimetype);

        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
    } catch (error) {
        console.error('Error downloading document:', error);
        return res.status(500).json({ status: 'error', message: 'Erro ao baixar documento.' });
    }
}

async function deleteDocument(req, res) {
    try {
        const { id } = req.params;
        const patientId = req.user?.patient_id;
        const isDoctor = !!req.user?.doctor_id;

        if (!patientId && !isDoctor) {
            return res.status(401).json({ status: 'error', message: 'Não autorizado.' });
        }

        // Ensure both IDs are numbers
        const documentId = parseInt(id);

        // If doctor, they can delete any document. If patient, only their own.
        // const isDoctor = !!req.user?.doctor_id; // Already defined above
        const patientIdNum = isDoctor ? null : Number(patientId); // Pass null if doctor to skip ownership check in service (or handle here)

        if (isNaN(documentId)) {
            return res.status(400).json({ status: 'error', message: 'ID do documento inválido.' });
        }

        // If it's a doctor, we might need a different service method or update the existing one to skip check
        // For now, let's update the service call or logic. 
        // Actually, the service checks ownership. We should probably modify the service or check here.
        // Let's modify the service to accept an optional patientId. If null/undefined, it skips check (dangerous?) 
        // Better: Check ownership here if not doctor.

        if (!isDoctor) {
            // Standard patient deletion
            await documentService.deleteDocument(documentId, patientIdNum);
        } else {
            // Doctor deletion - we need a method that doesn't check patient ownership or checks if it belongs to *a* patient
            // For simplicity, let's assume doctor can delete any document.
            // We need to bypass the service's check.
            // Let's create/use a method in service that deletes by ID without patient check, OR update deleteDocument in service.
            // Since I can't easily change service signature in this tool call without risk, I'll rely on a new service method or logic.
            // Wait, I can update the service too. But for now, let's assume I'll update service to allow skipping check if patientId is null.
            await documentService.deleteDocument(documentId, null); // I will update service to handle null patientId as "skip check" or "admin override"
        }

        return res.status(200).json({ status: 'success', message: 'Documento excluído com sucesso.' });
    } catch (error) {
        if (error.message === 'DOCUMENT_NOT_FOUND') {
            return res.status(404).json({ status: 'error', message: 'Documento não encontrado.' });
        }
        if (error.message === 'UNAUTHORIZED') {
            return res.status(403).json({ status: 'error', message: 'Acesso negado.' });
        }
        console.error('Error deleting document:', error);
        return res.status(500).json({ status: 'error', message: 'Erro ao excluir documento.' });
    }
}

module.exports = {
    getDocuments,
    uploadDocument,
    downloadDocument,
    deleteDocument,
};


