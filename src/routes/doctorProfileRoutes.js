const authAdmin = require('../middlewares/authAdmin');

const router = require('express').Router();

// Get doctor profile
router.get('/api/doctors/profile', authAdmin, async (req, res) => {
    try {
        const doctorId = req.user.id;
        const doctor = await req.db.query(
            'SELECT id, name, email, phone, specialty, bio FROM doctors WHERE id = ?',
            [doctorId]
        );

        if (doctor.length === 0) {
            return res.status(404).json({ message: 'Médico não encontrado' });
        }

        res.json({ doctor: doctor[0] });
    } catch (error) {
        console.error('Error fetching doctor profile:', error);
        res.status(500).json({ message: 'Erro ao carregar perfil do médico' });
    }
});

// Update doctor profile
router.put('/api/doctors/profile', authAdmin, async (req, res) => {
    try {
        const doctorId = req.user.id;
        const { phone, specialty, bio } = req.body;

        await req.db.query(
            'UPDATE doctors SET phone = ?, specialty = ?, bio = ? WHERE id = ?',
            [phone || null, specialty || null, bio || null, doctorId]
        );

        res.json({ message: 'Perfil atualizado com sucesso' });
    } catch (error) {
        console.error('Error updating doctor profile:', error);
        res.status(500).json({ message: 'Erro ao atualizar perfil do médico' });
    }
});

module.exports = router;
