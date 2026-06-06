const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const publicRoutes = require('./routes/publicRoutes');
const authRoutes = require('./routes/authRoutes');
const staffRoutes = require('./routes/staffRoutes');

const app = express();

app.set('trust proxy', 1);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/public', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/staff', staffRoutes);

app.get('/api/health', (req, res) => {
    res.json({ message: 'QR Order System API is running...' });
});

const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');

if (fs.existsSync(frontendDistPath)) {
    app.use(express.static(frontendDistPath));
    app.get(/^(?!\/api).*/, (req, res) => {
        res.sendFile(path.join(frontendDistPath, 'index.html'));
    });
} else {
    app.get('/', (req, res) => {
        res.json({ message: 'QR Order System API is running...' });
    });
}

module.exports = app;
