const express = require('express');
const appointmentRoutes = require('./routes/appointmentRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

app.use(express.json());
app.use(appointmentRoutes);
app.use(authRoutes);
app.use(adminRoutes);

app.use((req, res) => {
  res.status(404).json({ status: 'error', message: 'Rota não encontrada.' });
});

module.exports = app;
