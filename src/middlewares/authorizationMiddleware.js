/**
 * Authorization Middleware
 * Validates user permissions and resource ownership
 */

const { isAdmin, canAccess } = require('../utils/dtoUtils');

/**
 * Require that the user is an admin/doctor
 */
function requireAdmin(req, res, next) {
    if (!isAdmin(req.user)) {
        return res.status(403).json({
            status: 'error',
            message: 'Acesso negado. Apenas administradores podem acessar este recurso.'
        });
    }
    next();
}

/**
 * Require that the user is the owner of the resource OR an admin
 * Use this middleware AFTER fetching the resource
 * Expects req.resource to contain the resource with a patient_id field
 */
function requireOwnershipOrAdmin(req, res, next) {
    const resource = req.resource;

    if (!resource) {
        return res.status(404).json({
            status: 'error',
            message: 'Recurso não encontrado.'
        });
    }

    if (!canAccess(req.user, resource.patient_id)) {
        return res.status(403).json({
            status: 'error',
            message: 'Acesso negado.'
        });
    }

    next();
}

/**
 * Validate patient_id query parameter
 * Ensures patients can only request their own data
 * Admins can request any patient's data
 */
function validatePatientIdQuery(req, res, next) {
    const requestedPatientId = req.query.patient_id;

    // If no patient_id provided, use the authenticated user's patient_id
    if (!requestedPatientId) {
        if (!req.user?.patient_id) {
            return res.status(400).json({
                status: 'error',
                message: 'ID do paciente é obrigatório.'
            });
        }
        // Set it for convenience in the controller
        req.query.patient_id = req.user.patient_id;
        return next();
    }

    // If patient_id is provided, validate access
    if (!canAccess(req.user, requestedPatientId)) {
        return res.status(403).json({
            status: 'error',
            message: 'Acesso negado.'
        });
    }

    next();
}

/**
 * Validate patient_id from request body
 * Ensures patients can only submit data for themselves
 * Admins can submit for any patient
 */
function validatePatientIdBody(req, res, next) {
    const requestedPatientId = req.body.patient_id;

    // If no patient_id provided and user is a patient, use their ID
    if (!requestedPatientId) {
        if (!isAdmin(req.user)) {
            req.body.patient_id = req.user?.patient_id;
        }
        return next();
    }

    // If patient_id is provided, validate access
    if (!canAccess(req.user, requestedPatientId)) {
        return res.status(403).json({
            status: 'error',
            message: 'Acesso negado.'
        });
    }

    next();
}

/**
 * Attach isAdmin flag to request for use in controllers
 */
function attachUserContext(req, res, next) {
    req.userContext = {
        isAdmin: isAdmin(req.user),
        patientId: req.user?.patient_id,
        doctorId: req.user?.doctor_id,
    };
    next();
}

module.exports = {
    requireAdmin,
    requireOwnershipOrAdmin,
    validatePatientIdQuery,
    validatePatientIdBody,
    attachUserContext,
};
