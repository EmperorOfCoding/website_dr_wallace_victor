/**
 * Exam Data Transfer Objects
 * Protects exam request and result data
 */

class ExamDTO {
    /**
     * Patient DTO - Exam data for the patient
     * Includes exam details and results
     */
    static toPatientDTO(exam) {
        if (!exam) return null;

        return {
            id: exam.id,
            patient_id: exam.patient_id,
            doctor_id: exam.doctor_id,
            appointment_id: exam.appointment_id,
            exam_name: exam.exam_name,
            status: exam.status,
            requested_at: exam.requested_at,
            completed_at: exam.completed_at,
            result_summary: exam.result_summary,
            result_file_url: exam.result_file_url,
        };
    }

    /**
     * Admin DTO - Complete exam data for medical professionals
     * Includes all fields including internal notes
     */
    static toAdminDTO(exam) {
        if (!exam) return null;

        return {
            id: exam.id,
            patient_id: exam.patient_id,
            doctor_id: exam.doctor_id,
            appointment_id: exam.appointment_id,
            exam_name: exam.exam_name,
            status: exam.status,
            requested_at: exam.requested_at,
            completed_at: exam.completed_at,
            result_summary: exam.result_summary,
            result_file_url: exam.result_file_url,
            internal_notes: exam.internal_notes,
            created_at: exam.created_at,
            updated_at: exam.updated_at,
            // Include patient info if joined
            patientName: exam.patientName,
            doctorName: exam.doctorName,
        };
    }

    /**
     * List DTO - Adapts based on user role
     */
    static toListDTO(exam, isAdmin = false) {
        if (!exam) return null;

        if (isAdmin) {
            return ExamDTO.toAdminDTO(exam);
        }
        return ExamDTO.toPatientDTO(exam);
    }
}

module.exports = ExamDTO;
