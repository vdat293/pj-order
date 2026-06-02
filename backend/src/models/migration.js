const { pool } = require('../config/database');

const runMigration = async () => {
    try {
        console.log('🔄 Bắt đầu chạy DB Migration cho tính năng Toppings...');

        // 1. Tạo bảng toppings nếu chưa tồn tại
        await pool.query(`
            CREATE TABLE IF NOT EXISTS toppings (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                product_id BIGINT NULL,
                category_id BIGINT NULL,
                name VARCHAR(100) NOT NULL,
                price DECIMAL(12,2) NOT NULL DEFAULT 0,
                is_available BOOLEAN DEFAULT TRUE,
                is_active BOOLEAN DEFAULT TRUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Đã kiểm tra/tạo bảng toppings thành công.');

        // 2. Tạo bảng order_item_toppings nếu chưa tồn tại
        await pool.query(`
            CREATE TABLE IF NOT EXISTS order_item_toppings (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                order_item_id BIGINT NOT NULL,
                topping_id BIGINT NOT NULL,
                topping_name VARCHAR(100) NOT NULL,
                price DECIMAL(12,2) NOT NULL,
                quantity INT NOT NULL DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE,
                FOREIGN KEY (topping_id) REFERENCES toppings(id)
            )
        `);
        console.log('✅ Đã kiểm tra/tạo bảng order_item_toppings thành công.');

        // 3. Seed dữ liệu toppings mặc định nếu bảng toppings đang trống
        const [rows] = await pool.query('SELECT COUNT(*) as count FROM toppings');
        if (rows[0].count === 0) {
            console.log('🌱 Bảng toppings đang trống, tiến hành seed dữ liệu toppings mẫu...');

            const defaultToppings = [
                // Phở (category_id = 1)
                { category_id: 1, name: 'Gân bò hầm nhừ', price: 15000 },
                { category_id: 1, name: 'Nạm bò giòn ngọt', price: 15000 },
                { category_id: 1, name: 'Thịt bò tái thêm', price: 20000 },
                { category_id: 1, name: 'Trứng gà chần', price: 5000 },
                { category_id: 1, name: 'Quẩy giòn giòn (1 đĩa)', price: 5000 },

                // Bún bò (category_id = 2)
                { category_id: 2, name: 'Bò viên dai sần sật (2 viên)', price: 10000 },
                { category_id: 2, name: 'Gân bò thêm', price: 15000 },
                { category_id: 2, name: 'Giò khoanh thêm', price: 15000 },
                { category_id: 2, name: 'Chả cua thêm', price: 10000 },

                // Bún bò trộn (category_id = 3)
                { category_id: 3, name: 'Chả giò chiên thêm (1 chiếc)', price: 8000 },
                { category_id: 3, name: 'Thịt bò xào sả thêm', price: 15000 },

                // Cơm chiên (category_id = 4)
                { category_id: 4, name: 'Trứng ốp la lòng đào', price: 5000 },
                { category_id: 4, name: 'Lạp xưởng tươi chiên thêm', price: 10000 },

                // Giải khát (category_id = 5)
                { category_id: 5, name: 'Hạt chia hữu cơ', price: 3000 },
                { category_id: 5, name: 'Thạch sương sáo thanh mát', price: 5000 },
                { category_id: 5, name: 'Hạt sen bùi bùi thêm', price: 5000 }
            ];

            for (const top of defaultToppings) {
                await pool.query(
                    'INSERT INTO toppings (category_id, name, price) VALUES (?, ?, ?)',
                    [top.category_id, top.name, top.price]
                );
            }
            console.log('🌱 Đã nạp thành công các toppings mẫu cho danh mục Phở, Bún Bò, Bún Bò Trộn, Cơm Chiên, Giải Khát.');
        } else {
            console.log('ℹ️ Bảng toppings đã có dữ liệu, bỏ qua bước seed.');
        }

        console.log('✅ DB Migration hoàn tất thành công!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi khi chạy DB Migration:', error.message);
        process.exit(1);
    }
};

runMigration();
