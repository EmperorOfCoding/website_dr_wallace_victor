/**
 * DTO Utility Functions
 * Helper functions for transforming data collections using DTOs
 */

/**
 * Transform an array of entities using a DTO method
 * @param {Array} items - Array of entities to transform
 * @param {Function} dtoMethod - DTO method to apply to each item
 * @returns {Array} Transformed array
 */
function transformArray(items, dtoMethod) {
    if (!Array.isArray(items)) {
        return [];
    }

    return items.map(item => dtoMethod(item)).filter(item => item !== null);
}

/**
 * Transform an object's nested properties using DTOs
 * @param {Object} obj - Object to transform
 * @param {Object} transformMap - Map of property names to DTO methods
 * @returns {Object} Transformed object
 */
function transformNested(obj, transformMap) {
    if (!obj) return null;

    const result = { ...obj };

    Object.keys(transformMap).forEach(key => {
        if (result[key]) {
            const dtoMethod = transformMap[key];
            if (Array.isArray(result[key])) {
                result[key] = transformArray(result[key], dtoMethod);
            } else {
                result[key] = dtoMethod(result[key]);
            }
        }
    });

    return result;
}

/**
 * Check if user is admin or doctor
 * @param {Object} user - User object from req.user
 * @returns {Boolean}
 */
function isAdmin(user) {
    return !!(user?.doctor_id || user?.role === 'admin');
}

/**
 * Check if user owns the resource
 * @param {Object} user - User object from req.user
 * @param {Number} resourcePatientId - Patient ID of the resource
 * @returns {Boolean}
 */
function isOwner(user, resourcePatientId) {
    return user?.patient_id && Number(user.patient_id) === Number(resourcePatientId);
}

/**
 * Check if user can access the resource (owner or admin)
 * @param {Object} user - User object from req.user
 * @param {Number} resourcePatientId - Patient ID of the resource
 * @returns {Boolean}
 */
function canAccess(user, resourcePatientId) {
    return isAdmin(user) || isOwner(user, resourcePatientId);
}

module.exports = {
    transformArray,
    transformNested,
    isAdmin,
    isOwner,
    canAccess,
};
