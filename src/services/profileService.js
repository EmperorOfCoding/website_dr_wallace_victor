const pool = require('../config/db');

async function getProfileByPatientId(patientId) {
  const [rows] = await pool.execute(
    `SELECT * FROM patient_profiles WHERE patient_id = ?`,
    [patientId]
  );
  return rows[0] || null;
}

async function createOrUpdateProfile(patientId, profileData) {
  const {
    phone,
    birthdate,
    emergency_name,
    emergency_phone,
    allergies,
    notes,
    contact_preference,
    reminders_enabled,
    dark_mode,
  } = profileData;

  // Check if profile exists
  const existing = await getProfileByPatientId(patientId);

  if (existing) {
    // Update existing profile
    await pool.execute(
      `UPDATE patient_profiles 
       SET phone = COALESCE(?, phone),
           birthdate = COALESCE(?, birthdate),
           emergency_name = COALESCE(?, emergency_name),
           emergency_phone = COALESCE(?, emergency_phone),
           allergies = COALESCE(?, allergies),
           notes = COALESCE(?, notes),
           contact_preference = COALESCE(?, contact_preference),
           reminders_enabled = COALESCE(?, reminders_enabled),
           dark_mode = COALESCE(?, dark_mode)
       WHERE patient_id = ?`,
      [
        phone === undefined ? null : phone,
        birthdate === undefined ? null : birthdate,
        emergency_name === undefined ? null : emergency_name,
        emergency_phone === undefined ? null : emergency_phone,
        allergies === undefined ? null : allergies,
        notes === undefined ? null : notes,
        contact_preference === undefined ? null : contact_preference,
        reminders_enabled === undefined ? null : reminders_enabled,
        dark_mode === undefined ? null : dark_mode,
        patientId,
      ]
    );
    return { ...existing, ...profileData };
  } else {
    // Create new profile
    const [result] = await pool.execute(
      `INSERT INTO patient_profiles 
       (patient_id, phone, birthdate, emergency_name, emergency_phone, allergies, notes, contact_preference, reminders_enabled, dark_mode)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        patientId,
        phone || null,
        birthdate || null,
        emergency_name || null,
        emergency_phone || null,
        allergies || null,
        notes || null,
        contact_preference || 'whatsapp',
        reminders_enabled !== false,
        dark_mode || false,
      ]
    );
    return { id: result.insertId, patient_id: patientId, ...profileData };
  }
}

async function updateDarkMode(patientId, darkMode) {
  const existing = await getProfileByPatientId(patientId);

  if (existing) {
    await pool.execute(
      `UPDATE patient_profiles SET dark_mode = ? WHERE patient_id = ?`,
      [darkMode, patientId]
    );
  } else {
    await pool.execute(
      `INSERT INTO patient_profiles (patient_id, dark_mode) VALUES (?, ?)`,
      [patientId, darkMode]
    );
  }
}

module.exports = {
  getProfileByPatientId,
  createOrUpdateProfile,
  updateDarkMode,
};


