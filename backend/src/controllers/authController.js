const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { getJwtSecret } = require('../config/jwt');

const JWT_SECRET = getJwtSecret();

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ email và mật khẩu' });
        }

        // Tìm user theo email
        const [users] = await pool.query(
            'SELECT id, name, email, password_hash, role, is_active FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ message: 'Tài khoản hoặc mật khẩu không chính xác' });
        }

        const user = users[0];

        if (!user.is_active) {
            return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa' });
        }

        // So khớp mật khẩu
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Tài khoản hoặc mật khẩu không chính xác' });
        }

        // Sinh JWT token
        const token = jwt.sign(
            { id: user.id, name: user.name, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Đăng nhập thành công',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Lỗi API login:', error);
        res.status(500).json({ message: 'Lỗi máy chủ khi xử lý đăng nhập' });
    }
};
