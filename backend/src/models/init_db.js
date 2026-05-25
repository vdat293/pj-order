const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

const initDB = async () => {
    try {
        console.log('🔄 Đang khởi tạo Database...');
        
        // Đọc file schema.sql
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        // Tách các câu lệnh bằng dấu ';'
        const queries = schema.split(';').filter(query => query.trim() !== '');

        // Thực thi lần lượt từng câu lệnh
        for (let query of queries) {
            if (query.trim()) {
                await pool.query(query);
            }
        }

        console.log('✅ Khởi tạo các bảng thành công!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi khởi tạo Database:', error.message);
        process.exit(1);
    }
};

initDB();
