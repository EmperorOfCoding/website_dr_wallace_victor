# website_dr_wallace_victor

Sistema de Agendamento de Pacientes desenvolvido para o médico Dr. Wallace Victor.

## Configuração do backend

1. Crie um arquivo `.env` com base no `.env.example` e ajuste as credenciais do MySQL.
2. Instale as dependências com `npm install`.
3. Execute as migrações do MySQL rodando o script `sql/schema.sql`.
4. Inicie a API com `npm start`.

A rota principal criada é `POST /api/appointments`.

### Payload esperado

```json
{
  "patient_id": 1,
  "date": "2025-12-30",
  "time": "14:00",
  "type_id": 2
}
```

### Respostas

**Sucesso**
```json
{
  "status": "success",
  "appointment_id": 12,
  "message": "Consulta agendada com sucesso."
}
```

**Conflito de horário**
```json
{
  "status": "error",
  "message": "Horário indisponível."
}
```

## Banco de Dados

O script `sql/schema.sql` cria as tabelas `patients`, `appointment_types` e `appointments` (com restrição de unicidade por data e horário).
