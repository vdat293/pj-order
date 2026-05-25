const express = require('express');
const cors = require('cors');

// Khởi tạo app
const app = express();

// Middlewares
app.use(cors());
app.use(express.json()); // Để parse JSON requests
app.use(express.urlencoded({ extended: true }));

// Import Routes
const publicRoutes = require('./routes/publicRoutes');
const authRoutes = require('./routes/authRoutes');
const staffRoutes = require('./routes/staffRoutes');

// Định tuyến API
app.use('/api/public', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/staff', staffRoutes);

// Route mặc định (Health Check)
app.get('/', (req, res) => {
    res.json({ message: 'QR Order System API is running...' });
});

module.exports = app;
