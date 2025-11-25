-- ================================================
-- DML Completo - Dados de Exemplo
-- Sistema Dr. Wallace Victor
-- ================================================
-- IMPORTANTE: Execute este arquivo COMPLETO após o schema.sql
-- No MySQL Workbench: Query > Execute (All or Selection) ou Ctrl+Shift+Enter

USE dr_wallace;

-- ===========================================
-- Desabilita verificações de FK para limpeza
-- ===========================================
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_SAFE_UPDATES = 0;

-- Limpa todas as tabelas
DELETE FROM notification_queue;
DELETE FROM email_logs;
DELETE FROM patient_documents;
DELETE FROM appointment_reviews;
DELETE FROM patient_profiles;
DELETE FROM doctor_patients;
DELETE FROM doctor_consultation_types;
DELETE FROM appointments;
DELETE FROM blocked_times;
DELETE FROM password_resets;
DELETE FROM admins;
DELETE FROM doctors;
DELETE FROM appointment_types;
DELETE FROM patients;

-- Reset auto_increment
ALTER TABLE notification_queue AUTO_INCREMENT = 1;
ALTER TABLE email_logs AUTO_INCREMENT = 1;
ALTER TABLE patient_documents AUTO_INCREMENT = 1;
ALTER TABLE appointment_reviews AUTO_INCREMENT = 1;
ALTER TABLE patient_profiles AUTO_INCREMENT = 1;
ALTER TABLE appointments AUTO_INCREMENT = 1;
ALTER TABLE blocked_times AUTO_INCREMENT = 1;
ALTER TABLE password_resets AUTO_INCREMENT = 1;
ALTER TABLE admins AUTO_INCREMENT = 1;
ALTER TABLE doctors AUTO_INCREMENT = 1;
ALTER TABLE appointment_types AUTO_INCREMENT = 1;
ALTER TABLE patients AUTO_INCREMENT = 1;

SET FOREIGN_KEY_CHECKS = 1;
SET SQL_SAFE_UPDATES = 1;

-- ===========================================
-- Pacientes (senha para todos: teste)
-- ===========================================
INSERT INTO patients (name, email, phone, password_hash) VALUES
  ('Alice Souza', 'alice@example.com', '(11) 90000-0001', '$2a$10$7Wf1tl9ZJydZzMjhkfzkkuLGjfx8Vv4tx0eRy84rXLBnpNzarmMT6'),
  ('Bruno Lima', 'bruno@example.com', '(11) 90000-0002', '$2a$10$7Wf1tl9ZJydZzMjhkfzkkuLGjfx8Vv4tx0eRy84rXLBnpNzarmMT6'),
  ('Carla Dias', 'carla@example.com', '(11) 90000-0003', '$2a$10$7Wf1tl9ZJydZzMjhkfzkkuLGjfx8Vv4tx0eRy84rXLBnpNzarmMT6');

-- ===========================================
-- Tipos de consulta
-- ===========================================
INSERT INTO appointment_types (name, description, duration_minutes) VALUES
  ('Consulta inicial', 'Avaliação clínica completa', 60),
  ('Retorno', 'Revisão e seguimento', 30),
  ('Teleconsulta', 'Atendimento remoto', 20),
  ('Urgência', 'Queixas agudas não críticas', 30);

-- ===========================================
-- Médicos (senha para ambos: 112818WallaceVictor)
-- ===========================================
INSERT INTO doctors (name, email, phone, specialty, password_hash, bio) VALUES
  ('Dr. Wallace Victor', 'wallace@clinica.com', '(11) 98888-0001', 'Clínica Geral', '$2a$10$QJcoIl0W1SoMXYOS2Or9b.wIZR.QF0Uv1g9kmg1HZZhBVDZPRI1hK', 'Atendimento integral e humanizado.'),
  ('Dra. Marina Costa', 'marina@clinica.com', '(11) 98888-0002', 'Medicina da Família', '$2a$10$QJcoIl0W1SoMXYOS2Or9b.wIZR.QF0Uv1g9kmg1HZZhBVDZPRI1hK', 'Foco em atenção primária e crônicos.');

-- ===========================================
-- Vínculo tipos por médico
-- ===========================================
INSERT INTO doctor_consultation_types (doctor_id, type_id) VALUES
  (1, 1), (1, 2), (1, 4),  -- Wallace: inicial, retorno, urgência
  (2, 1), (2, 2), (2, 3);  -- Marina: inicial, retorno, teleconsulta

-- ===========================================
-- Vínculo médico-paciente
-- ===========================================
INSERT INTO doctor_patients (doctor_id, patient_id) VALUES
  (1, 1), (1, 2),
  (2, 2), (2, 3);

-- ===========================================
-- Perfis dos pacientes
-- ===========================================
INSERT INTO patient_profiles (patient_id, phone, birthdate, emergency_name, emergency_phone, allergies, notes, contact_preference, reminders_enabled, dark_mode) VALUES
  (1, '(11) 90000-0001', '1990-05-15', 'Roberto Souza', '(11) 91111-1111', 
   'Penicilina, Dipirona', 
   'Preferência por consultas matutinas. Trabalha de home office.',
   'whatsapp', TRUE, FALSE),
   
  (2, '(11) 90000-0002', '1985-08-22', 'Maria Lima', '(11) 92222-2222', 
   'Nenhuma conhecida', 
   'Diabético tipo 2, faz uso de Metformina 850mg 2x/dia.',
   'email', TRUE, TRUE),
   
  (3, '(11) 90000-0003', '1978-12-03', 'Paulo Dias', '(11) 93333-3333', 
   'AAS, Ibuprofeno (causa urticária)', 
   'Hipertensa controlada. Usa Losartana 50mg 1x/dia. Preferência por Dra. Marina.',
   'whatsapp', TRUE, FALSE);

-- ===========================================
-- Agendamentos futuros
-- ===========================================
INSERT INTO appointments (patient_id, doctor_id, type_id, date, time, status, confirmation_sent, reminder_sent) VALUES
  (1, 1, 1, '2025-12-01', '09:00', 'scheduled', 1, 0),
  (2, 1, 2, '2025-12-01', '10:00', 'scheduled', 1, 0),
  (2, 2, 3, '2025-12-02', '11:00', 'scheduled', 1, 0),
  (3, 2, 1, '2025-12-03', '14:00', 'scheduled', 1, 0);

-- ===========================================
-- Agendamentos históricos (passados)
-- ===========================================
INSERT INTO appointments (patient_id, doctor_id, type_id, date, time, status, confirmation_sent, reminder_sent) VALUES
  -- Consultas de Alice com Dr. Wallace (passadas e concluídas)
  (1, 1, 1, '2025-10-15', '09:00', 'completed', 1, 1),
  (1, 1, 2, '2025-11-01', '10:00', 'completed', 1, 1),
  (1, 1, 2, '2025-11-15', '14:00', 'completed', 1, 1),
  
  -- Consultas de Bruno com Dr. Wallace e Dra. Marina (passadas)
  (2, 1, 1, '2025-09-20', '11:00', 'completed', 1, 1),
  (2, 1, 2, '2025-10-20', '09:00', 'completed', 1, 1),
  (2, 2, 3, '2025-11-10', '15:00', 'completed', 1, 1),
  
  -- Consultas de Carla com Dra. Marina (passadas)
  (3, 2, 1, '2025-10-05', '10:00', 'completed', 1, 1),
  (3, 2, 2, '2025-11-05', '11:00', 'completed', 1, 1),
  
  -- Consulta cancelada de exemplo
  (1, 1, 4, '2025-11-20', '16:00', 'cancelled', 1, 0),
  
  -- Consulta não compareceu
  (3, 2, 2, '2025-11-22', '09:00', 'no_show', 1, 1);

-- Atualizar consulta cancelada com motivo
UPDATE appointments 
SET cancellation_reason = 'Compromisso de trabalho inadiável', 
    cancelled_at = '2025-11-19 10:30:00'
WHERE patient_id = 1 AND date = '2025-11-20' AND status = 'cancelled';

-- ===========================================
-- Avaliações de consultas (IDs 5-12 são as consultas históricas)
-- ===========================================
INSERT INTO appointment_reviews (appointment_id, patient_id, doctor_id, rating, comment) VALUES
  -- Avaliações de Alice
  (5, 1, 1, 5, 'Excelente atendimento! Dr. Wallace foi muito atencioso e explicou tudo com clareza. Recomendo!'),
  (6, 1, 1, 5, 'Ótimo retorno, muito satisfeita com o acompanhamento.'),
  (7, 1, 1, 4, 'Bom atendimento, apenas a espera foi um pouco longa.'),
  
  -- Avaliações de Bruno
  (8, 2, 1, 5, 'Primeira consulta muito completa. Me senti muito bem acolhido.'),
  (9, 2, 1, 4, 'Consulta objetiva e eficiente.'),
  (10, 2, 2, 5, 'Teleconsulta funcionou perfeitamente! Dra. Marina é muito profissional.'),
  
  -- Avaliações de Carla
  (11, 3, 2, 5, 'Dra. Marina é maravilhosa! Muito cuidadosa e paciente.'),
  (12, 3, 2, 5, 'Atendimento impecável como sempre. Muito grata!');

-- ===========================================
-- Documentos de exemplo (registros apenas, sem arquivos físicos)
-- ===========================================
INSERT INTO patient_documents (patient_id, appointment_id, filename, original_name, mimetype, size_bytes, description) VALUES
  -- Documentos de Alice
  (1, 5, 'a1b2c3d4-exame-sangue.pdf', 'Hemograma_Completo_Alice.pdf', 'application/pdf', 245678,
   'Hemograma completo - Laboratório São Paulo'),
  (1, 6, 'e5f6g7h8-glicemia.pdf', 'Glicemia_Jejum.pdf', 'application/pdf', 123456,
   'Exame de glicemia em jejum'),
  (1, NULL, 'i9j0k1l2-carteira-vacina.jpg', 'Carteira_Vacinacao.jpg', 'image/jpeg', 1567890,
   'Carteira de vacinação atualizada'),
   
  -- Documentos de Bruno
  (2, 8, 'm3n4o5p6-ecg.pdf', 'ECG_Bruno.pdf', 'application/pdf', 345678,
   'Eletrocardiograma de repouso'),
  (2, 9, 'q7r8s9t0-hemoglobina.pdf', 'Hemoglobina_Glicada.pdf', 'application/pdf', 189012,
   'Hemoglobina glicada - controle diabetes'),
  (2, NULL, 'u1v2w3x4-receita.jpg', 'Receita_Metformina.jpg', 'image/jpeg', 890123,
   'Receita médica atual'),
   
  -- Documentos de Carla
  (3, 11, 'y5z6a7b8-pressao.pdf', 'Monitoramento_PA.pdf', 'application/pdf', 456789,
   'MAPA - Monitorização Ambulatorial da Pressão Arterial'),
  (3, 12, 'c9d0e1f2-ecocardiograma.pdf', 'Ecocardiograma.pdf', 'application/pdf', 2345678,
   'Ecocardiograma transtorácico');

-- ===========================================
-- Logs de e-mails enviados
-- ===========================================
INSERT INTO email_logs (recipient_email, subject, email_type, appointment_id, status, sent_at) VALUES
  -- E-mails de confirmação
  ('alice@example.com', 'Consulta Confirmada - 15/10/2025 às 09:00', 'confirmation', 5, 'sent', '2025-10-10 14:30:00'),
  ('alice@example.com', 'Consulta Confirmada - 01/11/2025 às 10:00', 'confirmation', 6, 'sent', '2025-10-28 09:15:00'),
  ('alice@example.com', 'Consulta Confirmada - 15/11/2025 às 14:00', 'confirmation', 7, 'sent', '2025-11-10 16:45:00'),
  ('bruno@example.com', 'Consulta Confirmada - 20/09/2025 às 11:00', 'confirmation', 8, 'sent', '2025-09-15 10:00:00'),
  ('bruno@example.com', 'Consulta Confirmada - 20/10/2025 às 09:00', 'confirmation', 9, 'sent', '2025-10-15 11:30:00'),
  ('bruno@example.com', 'Consulta Confirmada - 10/11/2025 às 15:00', 'confirmation', 10, 'sent', '2025-11-05 08:00:00'),
  ('carla@example.com', 'Consulta Confirmada - 05/10/2025 às 10:00', 'confirmation', 11, 'sent', '2025-10-01 12:00:00'),
  ('carla@example.com', 'Consulta Confirmada - 05/11/2025 às 11:00', 'confirmation', 12, 'sent', '2025-10-30 14:20:00'),
  
  -- E-mails de lembrete
  ('alice@example.com', 'Lembrete: Sua consulta é amanhã! - 15/10/2025', 'reminder', 5, 'sent', '2025-10-14 09:00:00'),
  ('alice@example.com', 'Lembrete: Sua consulta é em 1 hora!', 'reminder', 5, 'sent', '2025-10-15 08:00:00'),
  ('bruno@example.com', 'Lembrete: Sua consulta é amanhã! - 20/10/2025', 'reminder', 9, 'sent', '2025-10-19 09:00:00'),
  ('carla@example.com', 'Lembrete: Sua consulta é amanhã! - 05/11/2025', 'reminder', 12, 'sent', '2025-11-04 09:00:00'),
  
  -- E-mail de cancelamento
  ('alice@example.com', 'Consulta Cancelada - 20/11/2025', 'cancellation', 13, 'sent', '2025-11-19 10:35:00'),
  
  -- E-mail com falha (exemplo)
  ('teste@invalido.com', 'Consulta Confirmada - Teste', 'confirmation', NULL, 'failed', NULL);

-- ===========================================
-- Fila de notificações
-- ===========================================
INSERT INTO notification_queue (appointment_id, patient_id, notification_type, scheduled_for, status) VALUES
  -- Lembretes para consultas futuras
  (1, 1, '24h_before', '2025-11-30 09:00:00', 'pending'),
  (1, 1, '1h_before', '2025-12-01 08:00:00', 'pending'),
  (2, 2, '24h_before', '2025-11-30 10:00:00', 'pending'),
  (2, 2, '1h_before', '2025-12-01 09:00:00', 'pending'),
  (3, 2, '24h_before', '2025-12-01 11:00:00', 'pending'),
  (3, 2, '1h_before', '2025-12-02 10:00:00', 'pending'),
  (4, 3, '24h_before', '2025-12-02 14:00:00', 'pending'),
  (4, 3, '1h_before', '2025-12-03 13:00:00', 'pending'),
  
  -- Notificações já enviadas (histórico)
  (5, 1, '24h_before', '2025-10-14 09:00:00', 'sent'),
  (5, 1, '1h_before', '2025-10-15 08:00:00', 'sent'),
  (8, 2, '24h_before', '2025-09-19 11:00:00', 'sent'),
  (11, 3, '24h_before', '2025-10-04 10:00:00', 'sent'),
  (11, 3, '1h_before', '2025-10-05 09:00:00', 'sent');

-- ===========================================
-- Bloqueios de horário
-- ===========================================
INSERT INTO blocked_times (date, time, reason) VALUES
  ('2025-12-01', '13:00', 'Reunião interna'),
  ('2025-12-02', '15:00', 'Manutenção do sistema');

-- ===========================================
-- Estatísticas resumidas
-- ===========================================
SELECT '=== RESUMO DOS DADOS INSERIDOS ===' AS info;

SELECT 'Pacientes' AS tabela, COUNT(*) AS registros FROM patients
UNION ALL
SELECT 'Médicos', COUNT(*) FROM doctors
UNION ALL
SELECT 'Tipos de consulta', COUNT(*) FROM appointment_types
UNION ALL
SELECT 'Perfis de pacientes', COUNT(*) FROM patient_profiles
UNION ALL
SELECT 'Consultas', COUNT(*) FROM appointments
UNION ALL
SELECT 'Avaliações', COUNT(*) FROM appointment_reviews
UNION ALL
SELECT 'Documentos', COUNT(*) FROM patient_documents
UNION ALL
SELECT 'Logs de e-mail', COUNT(*) FROM email_logs
UNION ALL
SELECT 'Fila de notificações', COUNT(*) FROM notification_queue
UNION ALL
SELECT 'Bloqueios de horário', COUNT(*) FROM blocked_times;

SELECT '=== MÉDIA DE AVALIAÇÕES POR MÉDICO ===' AS info;

SELECT 
  d.name AS medico,
  COUNT(r.id) AS total_avaliacoes,
  ROUND(AVG(r.rating), 2) AS media_estrelas
FROM doctors d
LEFT JOIN appointment_reviews r ON d.id = r.doctor_id
GROUP BY d.id, d.name;
