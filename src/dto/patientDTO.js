/**
 * Patient Data Transfer Objects
 * Protects sensitive patient data by exposing only necessary fields
 */

class PatientDTO {
    /**
     * Public DTO - Only basic identifying information
     * Used when patient data is referenced in other entities
     */
    static toPublicDTO(patient) {
        if (!patient) return null;

        return {
            id: patient.id,
            name: patient.name,
        };
    }

    /**
     * Owner DTO - Full data for the patient themselves
     * Includes all personal information except sensitive medical notes
     */
    static toOwnerDTO(patient) {
        if (!patient) return null;

        return {
            id: patient.id,
            name: patient.name,
            email: patient.email,
            phone: patient.phone,
            cpf: patient.cpf,
            date_of_birth: patient.date_of_birth,
            address: patient.address,
            city: patient.city,
            state: patient.state,
            zip_code: patient.zip_code,
            created_at: patient.created_at,
        };
    }

    /**
     * Admin DTO - Complete data for medical professionals
     * Includes all fields including medical history and internal notes
     */
    static toAdminDTO(patient) {
        if (!patient) return null;

        return {
            id: patient.id,
            name: patient.name,
            email: patient.email,
            phone: patient.phone,
            cpf: patient.cpf,
            date_of_birth: patient.date_of_birth,
            address: patient.address,
            city: patient.city,
            state: patient.state,
            zip_code: patient.zip_code,
            medical_history: patient.medical_history,
            allergies: patient.allergies,
            medications: patient.medications,
            emergency_contact: patient.emergency_contact,
            emergency_phone: patient.emergency_phone,
            insurance_provider: patient.insurance_provider,
            insurance_number: patient.insurance_number,
            notes: patient.notes,
            created_at: patient.created_at,
            updated_at: patient.updated_at,
        };
    }

    /**
     * List DTO - Summary for patient lists (admin view)
     * Includes key information for quick scanning
     */
    static toListDTO(patient) {
        if (!patient) return null;

        return {
            id: patient.id,
            name: patient.name,
            email: patient.email,
            phone: patient.phone,
            cpf: patient.cpf,
            date_of_birth: patient.date_of_birth,
            created_at: patient.created_at,
        };
    }
}

module.exports = PatientDTO;
