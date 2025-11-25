-- Criar o banco
CREATE DATABASE IF NOT EXISTS dr_wallace 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE dr_wallace;

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
) ENGINE=InnoDB;

-- ===========================================
-- Tabela: appointment_types
-- ===========================================
CREATE TABLE IF NOT EXISTS appointment_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  duration_minutes INT NOT NULL DEFAULT 60,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ===========================================
-- Tabela: appointments
-- ===========================================
CREATE TABLE IF NOT EXISTS appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL DEFAULT 1,
  type_id INT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_appointments_patient 
    FOREIGN KEY (patient_id) REFERENCES patients(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT fk_appointments_type 
    FOREIGN KEY (type_id) REFERENCES appointment_types(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT uc_appointments_unique_slot 
    UNIQUE (date, time)
) ENGINE=InnoDB;

-- ===========================================
-- Tabela: admins
-- ===========================================
CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

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
) ENGINE=InnoDB;

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
) ENGINE=InnoDB;
