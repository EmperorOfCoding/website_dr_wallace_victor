const documentService = require('../services/documentService');
const path = require('path');
const fs = require('fs');

async function getDocuments(req, res) {
    try {
        const patientId = req.query.patient_id || req.user?.patient_id;
        const appointmentId = req.query.appointment_id;

        if (!patientId && !appointmentId) {
            return res.status(400).json({ status: 'error', message: 'Paciente ou consulta é obrigatório.' });
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
        const patientId = req.user?.patient_id;
        if (!patientId) {
            return res.status(401).json({ status: 'error', message: 'Não autorizado.' });
        }

        if (!req.file) {
            return res.status(400).json({ status: 'error', message: 'Nenhum arquivo enviado.' });
        }

        const { appointment_id, description } = req.body;

        const document = await documentService.saveDocument(
            patientId,
            req.file,
            appointment_id ? parseInt(appointment_id) : null,
            description
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

        if (!patientId) {
            return res.status(401).json({ status: 'error', message: 'Não autorizado.' });
        }

        // Ensure both IDs are numbers
        const documentId = parseInt(id);
        const patientIdNum = Number(patientId);

        if (isNaN(documentId)) {
            return res.status(400).json({ status: 'error', message: 'ID do documento inválido.' });
        }

        await documentService.deleteDocument(documentId, patientIdNum);
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


