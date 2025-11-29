-- ================================================
-- DDL Completo - Sistema Dr. Wallace Victor
-- Compatível com MySQL 8.0 RDS AWS
-- ================================================
-- 
-- INSTRUÇÕES DE EXECUÇÃO:
-- 1. Conecte-se ao RDS MySQL
-- 2. Execute: USE dr_wallace; (ou selecione o banco no cliente)
-- 3. Execute este arquivo completo
--
-- Se o banco não existir, crie primeiro:
-- CREATE DATABASE dr_wallace CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--

-- ===========================================
-- Tabela: patients
-- ===========================================
CREATE TABLE IF NOT EXISTS patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(50),
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- Tabela: appointment_types
-- ===========================================
CREATE TABLE IF NOT EXISTS appointment_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  duration_minutes INT NOT NULL DEFAULT 60,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- Tabela: doctors
-- ===========================================
CREATE TABLE IF NOT EXISTS doctors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  specialty VARCHAR(255),
  password_hash VARCHAR(255) NOT NULL,
  bio TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- Tabela: doctor_consultation_types (tipos por médico)
-- ===========================================
CREATE TABLE IF NOT EXISTS doctor_consultation_types (
  doctor_id INT NOT NULL,
  type_id INT NOT NULL,
  PRIMARY KEY (doctor_id, type_id),
  CONSTRAINT fk_dct_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_dct_type FOREIGN KEY (type_id) REFERENCES appointment_types(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- Tabela: doctor_patients (vínculo médico-paciente)
-- ===========================================
CREATE TABLE IF NOT EXISTS doctor_patients (
  doctor_id INT NOT NULL,
  patient_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (doctor_id, patient_id),
  CONSTRAINT fk_dp_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_dp_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- Tabela: appointments (com campos extras para cancelamento/reagendamento)
-- ===========================================
CREATE TABLE IF NOT EXISTS appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL DEFAULT 1,
  type_id INT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
  cancellation_reason TEXT,
  cancelled_at TIMESTAMP NULL DEFAULT NULL,
  rescheduled_from INT NULL,
  notes TEXT,
  modality VARCHAR(50) DEFAULT 'presencial',
  confirmation_sent TINYINT(1) DEFAULT 0,
  reminder_sent TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_appointments_date (date),
  INDEX idx_appointments_status (status),
  INDEX idx_appointments_patient_date (patient_id, date),

  CONSTRAINT fk_appointments_patient 
    FOREIGN KEY (patient_id) REFERENCES patients(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT fk_appointments_type 
    FOREIGN KEY (type_id) REFERENCES appointment_types(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_appointments_doctor
    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT uc_appointments_unique_slot 
    UNIQUE (doctor_id, date, time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- Tabela: admins
-- ===========================================
CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'admin',
  doctor_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_admins_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT uc_admin_doctor UNIQUE (doctor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- Tabela: password_resets
-- ===========================================
CREATE TABLE IF NOT EXISTS password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_password_resets_patient 
    FOREIGN KEY (patient_id) REFERENCES patients(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- Tabela: blocked_times
-- ===========================================
CREATE TABLE IF NOT EXISTS blocked_times (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  time TIME NOT NULL,
  reason VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT uc_blocked_times UNIQUE (date, time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- Tabela: patient_profiles (dados adicionais do paciente)
-- ===========================================
CREATE TABLE IF NOT EXISTS patient_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  phone VARCHAR(50),
  birthdate DATE,
  emergency_name VARCHAR(255),
  emergency_phone VARCHAR(50),
  allergies TEXT,
  notes TEXT,
  contact_preference ENUM('whatsapp', 'email') DEFAULT 'whatsapp',
  reminders_enabled TINYINT(1) DEFAULT 1,
  dark_mode TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY uk_profile_patient (patient_id),
  CONSTRAINT fk_profile_patient 
    FOREIGN KEY (patient_id) REFERENCES patients(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- Tabela: appointment_reviews (avaliações pós-consulta)
-- ===========================================
CREATE TABLE IF NOT EXISTS appointment_reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  appointment_id INT NOT NULL,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  rating TINYINT NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_reviews_doctor (doctor_id),
  UNIQUE KEY uk_review_appointment (appointment_id),
  CONSTRAINT fk_review_appointment 
    FOREIGN KEY (appointment_id) REFERENCES appointments(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_review_patient 
    FOREIGN KEY (patient_id) REFERENCES patients(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_review_doctor 
    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- Tabela: exam_requests (solicitações de exames)
-- ===========================================
CREATE TABLE IF NOT EXISTS exam_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  appointment_id INT,
  exam_name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'requested',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_exam_patient (patient_id),
  INDEX idx_exam_doctor (doctor_id),
  INDEX idx_exam_appointment (appointment_id),
  CONSTRAINT fk_exam_patient 
    FOREIGN KEY (patient_id) REFERENCES patients(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_exam_doctor 
    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_exam_appointment 
    FOREIGN KEY (appointment_id) REFERENCES appointments(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- Tabela: patient_documents (upload de documentos)
-- ===========================================
CREATE TABLE IF NOT EXISTS patient_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  appointment_id INT,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mimetype VARCHAR(100) NOT NULL,
  size_bytes INT NOT NULL,
  description TEXT,
  exam_request_id INT,
  type VARCHAR(50) DEFAULT 'document',
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_document_patient (patient_id),
  INDEX idx_document_appointment (appointment_id),
  INDEX idx_document_exam_request (exam_request_id),
  CONSTRAINT fk_document_patient 
    FOREIGN KEY (patient_id) REFERENCES patients(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_document_appointment 
    FOREIGN KEY (appointment_id) REFERENCES appointments(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_document_exam_request 
    FOREIGN KEY (exam_request_id) REFERENCES exam_requests(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- Tabela: email_logs (registro de e-mails enviados)
-- ===========================================
CREATE TABLE IF NOT EXISTS email_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recipient_email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  email_type ENUM('confirmation', 'reminder', 'cancellation', 'password_reset') NOT NULL,
  appointment_id INT,
  status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
  error_message TEXT,
  sent_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_email_status (status),
  INDEX idx_email_type (email_type),
  CONSTRAINT fk_email_appointment 
    FOREIGN KEY (appointment_id) REFERENCES appointments(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- Tabela: notification_queue (fila de lembretes)
-- ===========================================
CREATE TABLE IF NOT EXISTS notification_queue (
  id INT AUTO_INCREMENT PRIMARY KEY,
  appointment_id INT NOT NULL,
  patient_id INT NOT NULL,
  notification_type ENUM('24h_before', '1h_before', 'whatsapp', 'email') NOT NULL,
  scheduled_for DATETIME NOT NULL,
  status ENUM('pending', 'sent', 'failed', 'cancelled') DEFAULT 'pending',
  error_message TEXT,
  processed_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_notification_scheduled (scheduled_for, status),
  INDEX idx_notification_appointment (appointment_id),
  CONSTRAINT fk_notification_appointment 
    FOREIGN KEY (appointment_id) REFERENCES appointments(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_notification_patient 
    FOREIGN KEY (patient_id) REFERENCES patients(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- Triggers para validar rating (1-5)
-- ===========================================
-- Nota: No RDS, execute os triggers separadamente se DELIMITER causar problemas
DROP TRIGGER IF EXISTS trg_review_rating_check;

CREATE TRIGGER trg_review_rating_check
BEFORE INSERT ON appointment_reviews
FOR EACH ROW
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Rating deve ser entre 1 e 5';
  END IF;
END;

DROP TRIGGER IF EXISTS trg_review_rating_check_update;

CREATE TRIGGER trg_review_rating_check_update
BEFORE UPDATE ON appointment_reviews
FOR EACH ROW
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Rating deve ser entre 1 e 5';
  END IF;
END;

-- ===========================================
-- Mensagem de conclusão
-- ===========================================
SELECT 'Schema criado com sucesso!' AS status;

