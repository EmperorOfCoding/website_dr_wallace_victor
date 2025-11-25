USE dr_wallace;

-- Limpa dados anteriores (opcional em ambiente de teste)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE doctor_patients;
TRUNCATE TABLE doctor_consultation_types;
TRUNCATE TABLE appointments;
TRUNCATE TABLE appointment_types;
TRUNCATE TABLE doctors;
TRUNCATE TABLE patients;
TRUNCATE TABLE admins;
TRUNCATE TABLE blocked_times;
TRUNCATE TABLE password_resets;
SET FOREIGN_KEY_CHECKS = 1;

-- Pacientes
INSERT INTO patients (name, email, phone, password_hash) VALUES
  ('Alice Souza', 'alice@example.com', '(11) 90000-0001', '$2a$10$7Wf1tl9ZJydZzMjhkfzkkuLGjfx8Vv4tx0eRy84rXLBnpNzarmMT6'), -- senha teste
  ('Bruno Lima', 'bruno@example.com', '(11) 90000-0002', '$2a$10$7Wf1tl9ZJydZzMjhkfzkkuLGjfx8Vv4tx0eRy84rXLBnpNzarmMT6'),
  ('Carla Dias', 'carla@example.com', '(11) 90000-0003', '$2a$10$7Wf1tl9ZJydZzMjhkfzkkuLGjfx8Vv4tx0eRy84rXLBnpNzarmMT6');

-- Tipos de consulta
INSERT INTO appointment_types (name, description, duration_minutes) VALUES
  ('Consulta inicial', 'Avaliação clínica completa', 60),
  ('Retorno', 'Revisão e seguimento', 30),
  ('Teleconsulta', 'Atendimento remoto', 20),
  ('Urgência', 'Queixas agudas não críticas', 30);

-- Médicos
INSERT INTO doctors (name, email, phone, specialty, bio) VALUES
  ('Dr. Wallace Victor', 'wallace@clinica.com', '(11) 98888-0001', 'Clínica Geral', 'Atendimento integral e humanizado.'),
  ('Dra. Marina Costa', 'marina@clinica.com', '(11) 98888-0002', 'Medicina da Família', 'Foco em atenção primária e crônicos.');

-- Vínculo tipos por médico
INSERT INTO doctor_consultation_types (doctor_id, type_id) VALUES
  (1, 1), (1, 2), (1, 4),  -- Wallace: inicial, retorno, urgência
  (2, 1), (2, 2), (2, 3);  -- Marina: inicial, retorno, teleconsulta

-- Vínculo médico-paciente (manual)
INSERT INTO doctor_patients (doctor_id, patient_id) VALUES
  (1, 1), (1, 2),
  (2, 2), (2, 3);

-- Agendamentos de exemplo (ajuste datas para o futuro)
INSERT INTO appointments (patient_id, doctor_id, type_id, date, time, status) VALUES
  (1, 1, 1, '2025-12-01', '09:00', 'scheduled'),
  (2, 1, 2, '2025-12-01', '10:00', 'scheduled'),
  (2, 2, 3, '2025-12-02', '11:00', 'scheduled'),
  (3, 2, 1, '2025-12-03', '14:00', 'scheduled');

-- Admins (senha hash igual ao dos pacientes de teste: 'teste')
INSERT INTO admins (name, email, password_hash, role, doctor_id) VALUES
  ('Dr. Wallace Victor', 'admin@wallace.com', '$2a$10$QJcoIl0W1SoMXYOS2Or9b.wIZR.QF0Uv1g9kmg1HZZhBVDZPRI1hK', 'admin', 1);

-- Bloqueios de horário (opcional)
INSERT INTO blocked_times (date, time, reason) VALUES
  ('2025-12-01', '13:00', 'Reunião interna'),
  ('2025-12-02', '15:00', 'Manutenção do sistema');
