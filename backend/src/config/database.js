const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a connection pool instead of a single connection
// This helps manage multiple concurrent requests efficiently
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'qr_order_db',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Helper function to test the connection
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Kết nối MySQL thành công!');
        connection.release();
    } catch (error) {
        console.error('❌ Lỗi kết nối MySQL:', error.message);
        console.error('Hãy chắc chắn rằng MySQL đang chạy và thông tin trong .env là chính xác.');
    }
};

module.exports = { pool, testConnection };
