const blockedTimeService = require('../services/blockedTimeService');

function isValidDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

function isValidTime(time) {
  return /^\d{2}:\d{2}$/.test(time);
}

function isWithinWorkingHours(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours >= 8 && hours < 18 && minutes === 0;
}

async function createBlockedTime(req, res) {
  try {
    const { date, time, reason } = req.body || {};

    if (!date || !time) {
      return res.status(400).json({ status: 'error', message: 'Campos obrigatórios ausentes.' });
    }

    if (!isValidDate(date) || !isValidTime(time) || !isWithinWorkingHours(time)) {
      return res.status(400).json({ status: 'error', message: 'Data ou horário inválido.' });
    }

    const dateTime = new Date(`${date}T${time}:00`);
    if (Number.isNaN(dateTime.getTime()) || dateTime <= new Date()) {
      return res.status(400).json({ status: 'error', message: 'Não é possível bloquear horário no passado.' });
    }

    try {
      await blockedTimeService.createBlockedTime({ date, time, reason });
    } catch (error) {
      if (error.message === 'BLOCKED_EXISTS') {
        return res.status(409).json({ status: 'error', message: 'Horário já bloqueado.' });
      }
      if (error.message === 'APPOINTMENT_CONFLICT') {
        return res.status(409).json({ status: 'error', message: 'Horário já possui consulta agendada.' });
      }
      throw error;
    }

    return res.status(201).json({ status: 'success', message: 'Horário bloqueado com sucesso.' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Erro ao bloquear horário.' });
  }
}

async function listBlockedTimes(req, res) {
  try {
    const { date, page = 1, limit = 10 } = req.query || {};
    if (date && !isValidDate(date)) {
      return res.status(400).json({ status: 'error', message: 'Data inválida.' });
    }

    const result = await blockedTimeService.listBlockedTimes({ date, page, limit });
    const blockedTimes = result.blockedTimes.map((item) => ({
      id: item.id,
      date: item.date,
      time: item.time,
      reason: item.reason,
      created_at: item.created_at
    }));

    return res.status(200).json({
      status: 'success',
      blocked_times: blockedTimes,
      page: result.page,
      totalPages: result.totalPages,
      total: result.total
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Erro ao listar bloqueios.' });
  }
}

async function deleteBlockedTime(req, res) {
  try {
    const { id } = req.params;

    const blocked = await blockedTimeService.findBlockedById(id);
    if (!blocked) {
      return res.status(404).json({ status: 'error', message: 'Bloqueio não encontrado.' });
    }

    const blockedDateTime = new Date(`${blocked.date}T${blocked.time}`);
    if (blockedDateTime <= new Date()) {
      return res.status(400).json({ status: 'error', message: 'Não é possível remover bloqueio passado.' });
    }

    await blockedTimeService.deleteBlockedTime(id);
    return res.status(200).json({ status: 'success', message: 'Bloqueio removido.' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Erro ao remover bloqueio.' });
  }
}

module.exports = {
  createBlockedTime,
  listBlockedTimes,
  deleteBlockedTime
};
