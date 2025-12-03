/**
 * Document Data Transfer Objects
 * Protects document metadata and access information
 */

class DocumentDTO {
    /**
     * Owner DTO - Document metadata for the owner (patient)
     * Includes all necessary information to access and manage documents
     */
    static toOwnerDTO(document) {
        if (!document) return null;

        return {
            id: document.id,
            patient_id: document.patient_id,
            appointment_id: document.appointment_id,
            exam_request_id: document.exam_request_id,
            original_name: document.original_name,
            mimetype: document.mimetype,
            size: document.size,
            type: document.type,
            description: document.description,
            uploaded_at: document.uploaded_at,
            uploaded_by: document.uploaded_by,
        };
    }

    /**
     * Admin DTO - Complete document metadata for medical professionals
     * Includes all fields including internal file paths
     */
    static toAdminDTO(document) {
        if (!document) return null;

        return {
            id: document.id,
            patient_id: document.patient_id,
            appointment_id: document.appointment_id,
            exam_request_id: document.exam_request_id,
            original_name: document.original_name,
            stored_name: document.stored_name,
            file_path: document.file_path,
            mimetype: document.mimetype,
            size: document.size,
            type: document.type,
            description: document.description,
            uploaded_at: document.uploaded_at,
            uploaded_by: document.uploaded_by,
            // Include patient info if joined
            patientName: document.patientName,
        };
    }

    /**
     * List DTO - Adapts based on user role
     */
    static toListDTO(document, isAdmin = false) {
        if (!document) return null;

        if (isAdmin) {
            return DocumentDTO.toAdminDTO(document);
        }
        return DocumentDTO.toOwnerDTO(document);
    }
}

module.exports = DocumentDTO;
