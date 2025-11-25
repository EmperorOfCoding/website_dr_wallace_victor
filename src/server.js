require('dotenv').config();
const app = require('./app');
const { logger } = require('./middlewares/logger');
const { startNotificationScheduler } = require('./services/notificationService');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Servidor iniciado na porta ${PORT}`);
  
  // Start notification scheduler for appointment reminders
  if (process.env.ENABLE_NOTIFICATIONS !== 'false') {
    startNotificationScheduler();
  }
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});
