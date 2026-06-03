const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../config/jwt');

const JWT_SECRET = getJwtSecret();

module.exports = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Không có quyền truy cập. Vui lòng đăng nhập lại.' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Gán thông tin user vào request
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Lỗi Auth Middleware:', error.message);
        return res.status(403).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
    }
};
