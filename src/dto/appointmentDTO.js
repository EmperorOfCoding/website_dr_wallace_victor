/**
 * Appointment Data Transfer Objects
 * Protects appointment data and patient information
 */

const PatientDTO = require('./patientDTO');

class AppointmentDTO {
    /**
     * Public DTO - Minimal information for public contexts
     * Used for availability checking, etc.
     */
    static toPublicDTO(appointment) {
        if (!appointment) return null;

        return {
            id: appointment.id,
            date: appointment.date,
            time: appointment.time,
            status: appointment.status,
            modality: appointment.modality,
        };
    }

    /**
     * Patient DTO - Full appointment data for the patient owner
     * Includes appointment details and type information
     */
    static toPatientDTO(appointment) {
        if (!appointment) return null;

        return {
            id: appointment.id,
            patient_id: appointment.patient_id,
            doctor_id: appointment.doctor_id,
            date: appointment.date,
            time: appointment.time,
            status: appointment.status,
            type_id: appointment.type_id,
            typeName: appointment.typeName,
            durationMinutes: appointment.durationMinutes,
            doctorName: appointment.doctorName,
            modality: appointment.modality,
            notes: appointment.notes,
            meeting_link: appointment.meeting_link,
            rescheduled_from: appointment.rescheduled_from,
            cancellation_reason: appointment.cancellation_reason,
            cancelled_at: appointment.cancelled_at,
            created_at: appointment.created_at,
            hasReview: appointment.hasReview,
        };
    }

    /**
     * Admin DTO - Complete appointment data for medical professionals
     * Includes all fields including patient details and internal notes
     */
    static toAdminDTO(appointment) {
        if (!appointment) return null;

        const dto = {
            id: appointment.id,
            patient_id: appointment.patient_id,
            doctor_id: appointment.doctor_id,
            date: appointment.date,
            time: appointment.time,
            status: appointment.status,
            type_id: appointment.type_id,
            typeName: appointment.typeName,
            durationMinutes: appointment.durationMinutes,
            doctorName: appointment.doctorName,
            modality: appointment.modality,
            notes: appointment.notes,
            meeting_link: appointment.meeting_link,
            rescheduled_from: appointment.rescheduled_from,
            cancellation_reason: appointment.cancellation_reason,
            cancelled_at: appointment.cancelled_at,
            created_at: appointment.created_at,
            updated_at: appointment.updated_at,
            hasReview: appointment.hasReview,
        };

        // Include patient details if available
        if (appointment.patientName) {
            dto.patientName = appointment.patientName;
            dto.patientEmail = appointment.patientEmail;
            dto.patientPhone = appointment.patientPhone;
        }

        return dto;
    }

    /**
     * List DTO - Summary for appointment lists
     * Adapts based on user role (patient vs admin)
     */
    static toListDTO(appointment, isAdmin = false) {
        if (!appointment) return null;

        if (isAdmin) {
            return AppointmentDTO.toAdminDTO(appointment);
        }
        return AppointmentDTO.toPatientDTO(appointment);
    }
}

module.exports = AppointmentDTO;
