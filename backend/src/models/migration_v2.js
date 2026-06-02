const { pool } = require('../config/database');

const runMigrationV2 = async () => {
    try {
        console.log('🔄 Bắt đầu chạy DB Migration V2 (Thêm phân loại Toppings)...');

        // 1. Kiểm tra và thêm cột type vào bảng toppings nếu chưa tồn tại
        const [columns] = await pool.query("SHOW COLUMNS FROM toppings LIKE 'type'");
        if (columns.length === 0) {
            console.log("Adding 'type' column to 'toppings' table...");
            await pool.query(`
                ALTER TABLE toppings 
                ADD COLUMN type ENUM('them', 'cung') NOT NULL DEFAULT 'them' AFTER price
            `);
            console.log("✅ Cột 'type' đã được thêm thành công.");
        } else {
            console.log("ℹ️ Cột 'type' đã tồn tại sẵn trong bảng toppings.");
        }

        // 2. Làm sạch bảng toppings và seed dữ liệu toppings phân loại chuẩn
        // Món ăn cùng ('cung') là ăn kèm tạo thành món (như Gân, Nạm, Bò viên...)
        // Món ăn thêm ('them') là đồ gọi thêm riêng biệt (như Trứng chần, Quẩy giòn, Bánh phở thêm...)
        console.log('🌱 Làm sạch và nạp lại dữ liệu toppings có phân loại...');
        await pool.query('SET FOREIGN_KEY_CHECKS = 0');
        await pool.query('DELETE FROM order_item_toppings');
        await pool.query('DELETE FROM toppings');
        await pool.query('SET FOREIGN_KEY_CHECKS = 1');

        const defaultToppings = [
            // Phở (category_id = 1)
            { category_id: 1, name: 'Gân bò hầm nhừ', price: 15000, type: 'cung' },
            { category_id: 1, name: 'Nạm bò giòn ngọt', price: 15000, type: 'cung' },
            { category_id: 1, name: 'Thịt bò tái thêm', price: 20000, type: 'cung' },
            { category_id: 1, name: 'Trứng gà chần', price: 5000, type: 'them' },
            { category_id: 1, name: 'Quẩy giòn giòn (1 đĩa)', price: 5000, type: 'them' },
            { category_id: 1, name: 'Bánh phở gọi thêm', price: 10000, type: 'them' },

            // Bún bò (category_id = 2)
            { category_id: 2, name: 'Bò viên dai sần sật (2 viên)', price: 10000, type: 'cung' },
            { category_id: 2, name: 'Gân bò thêm', price: 15000, type: 'cung' },
            { category_id: 2, name: 'Giò khoanh thêm', price: 15000, type: 'cung' },
            { category_id: 2, name: 'Chả cua thêm', price: 10000, type: 'cung' },

            // Bún bò trộn (category_id = 3)
            { category_id: 3, name: 'Thịt bò xào sả thêm', price: 15000, type: 'cung' },
            { category_id: 3, name: 'Chả giò chiên thêm (1 chiếc)', price: 8000, type: 'them' },

            // Cơm chiên (category_id = 4)
            { category_id: 4, name: 'Lạp xưởng tươi chiên thêm', price: 10000, type: 'cung' },
            { category_id: 4, name: 'Trứng ốp la lòng đào', price: 5000, type: 'them' },

            // Giải khát (category_id = 5)
            { category_id: 5, name: 'Hạt chia hữu cơ', price: 3000, type: 'them' },
            { category_id: 5, name: 'Thạch sương sáo thanh mát', price: 5000, type: 'them' },
            { category_id: 5, name: 'Hạt sen bùi bùi thêm', price: 5000, type: 'them' }
        ];

        for (const top of defaultToppings) {
            await pool.query(
                'INSERT INTO toppings (category_id, name, price, type) VALUES (?, ?, ?, ?)',
                [top.category_id, top.name, top.price, top.type]
            );
        }
        console.log('✅ Đã nạp thành công các toppings mẫu phân loại cung/them.');

        console.log('✅ DB Migration V2 hoàn tất thành công!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi khi chạy DB Migration V2:', error.message);
        process.exit(1);
    }
};

runMigrationV2();
