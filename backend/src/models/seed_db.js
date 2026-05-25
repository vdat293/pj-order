const { pool } = require('../config/database');
const bcrypt = require('bcrypt');

const seedDB = async () => {
    try {
        console.log('🔄 Đang làm sạch và khởi tạo lại dữ liệu mẫu ẩm thực Việt...');

        // Tạm thời bỏ khóa ngoại để truncate/delete dễ dàng
        await pool.query('SET FOREIGN_KEY_CHECKS = 0');
        
        // 1. Làm sạch dữ liệu cũ
        await pool.query('DELETE FROM order_items');
        await pool.query('DELETE FROM order_status_logs');
        await pool.query('DELETE FROM orders');
        await pool.query('DELETE FROM products');
        await pool.query('DELETE FROM categories');
        await pool.query('DELETE FROM users');
        await pool.query('DELETE FROM dining_tables');

        // Bật lại khóa ngoại
        await pool.query('SET FOREIGN_KEY_CHECKS = 1');

        // 2. Thêm tài khoản Host (Dành chung cho Nhân viên & Nhà bếp) mẫu
        const hostHash = await bcrypt.hash('host123', 10);

        await pool.query(`
            INSERT INTO users (name, email, password_hash, role) VALUES 
            ('Host', 'host@example.com', ?, 'host')
        `, [hostHash]);

        // 3. Thêm Danh mục Việt theo yêu cầu của người dùng
        await pool.query(`
            INSERT INTO categories (id, name, sort_order) VALUES 
            (1, 'Phở', 1),
            (2, 'Bún bò', 2),
            (3, 'Bún bò trộn', 3),
            (4, 'Cơm chiên', 4),
            (5, 'Giải khát', 5)
        `);

        // 4. Thêm Các món ăn đặc sắc chuẩn hương vị Việt (Products)
        await pool.query(`
            INSERT INTO products (id, category_id, name, price, description, is_available, image_url) VALUES 
            -- Phở
            (1, 1, 'Phở bò tái nạm đặc biệt', 55000, 'Nước dùng trong vắt ninh 24h từ xương ống bò cùng thảo mộc thơm nức, ăn kèm nạm bò giòn ngọt và bò tái mềm mọng.', true, 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=500&auto=format&fit=crop&q=60'),
            (2, 1, 'Phở gà ta xé sợi giòn da', 50000, 'Thịt gà ta thả vườn dai ngọt xé phay giòn bì, nước dùng gà thanh tao vàng óng rắc lá chanh thơm mát.', true, 'https://images.unsplash.com/photo-1625398407796-82650a8c135f?w=500&auto=format&fit=crop&q=60'),
            
            -- Bún bò
            (3, 2, 'Bún bò Huế đặc biệt bò viên', 60000, 'Nước dùng đậm đà hương sả và mắm ruốc, ăn kèm nạm bò mềm, bò viên dai sần sật, móng giò heo và chả cua.', true, 'https://images.unsplash.com/photo-1562601519-2b4af53d1780?w=500&auto=format&fit=crop&q=60'),
            (4, 2, 'Bún bò tái gân giòn sần sật', 50000, 'Sự kết hợp hoàn hảo giữa thịt bò tái chín mềm và gân bò hầm giòn sần sật cay nhẹ nồng ấm.', true, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&auto=format&fit=crop&q=60'),
            
            -- Bún bò trộn
            (5, 3, 'Bún bò trộn Nam Bộ đặc trưng', 48000, 'Thịt bò xào sả ớt mềm ngọt đậm vị, giá đỗ chần, rau sống tươi ngon rưới nước mắm chua ngọt thanh mát và lạc rang bùi ngậy.', true, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60'),
            (6, 3, 'Bún bò trộn chả giò tôm thịt', 52000, 'Thịt bò xào sả thơm lừng ăn kèm chả giò tôm thịt chiên giòn tan rụm cuốn hút khó cưỡng.', true, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&auto=format&fit=crop&q=60'),
            
            -- Cơm chiên
            (7, 4, 'Cơm chiên dưa bò hạt giòn', 45000, 'Hạt cơm được rang săn giòn vàng ruộm đảo đều dưa cải chua giòn mặn nhẹ và thịt bò xào tỏi thơm phức.', true, 'https://images.unsplash.com/photo-1603133872878-306509a25b1b?w=500&auto=format&fit=crop&q=60'),
            (8, 4, 'Cơm chiên hải sản trứng muối', 55000, 'Cơm chiên sốt trứng muối bùi béo vàng óng ả, mực ống tươi giòn xào tôm sú bóc vỏ ngọt lịm.', true, 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500&auto=format&fit=crop&q=60'),
            
            -- Giải khát
            (9, 5, 'Trà quất mật ong hạt chia mát lạnh', 22000, 'Quất tươi mọng nước kết hợp mật ong rừng ngọt thanh, bổ dưỡng hạt chia sảng khoái.', true, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=60'),
            (10, 5, 'Sâm mía lau hạt sen thơm mát', 20000, 'Nước mía lau tươi mát nấu cùng lá dứa thanh nhẹ, hạt sen chín bở mềm bùi bổ dưỡng.', true, 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&auto=format&fit=crop&q=60'),
            (11, 5, 'Trà đá hoa lài truyền thống', 5000, 'Trà nhài thơm mát ướp đá sảng khoái, giải nhiệt tuyệt vời cho bữa ăn ngon.', true, 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=500&auto=format&fit=crop&q=60')
        `);

        // 5. Thêm Bàn (Dining Tables)
        // Tạo 10 bàn mẫu
        for (let i = 1; i <= 10; i++) {
            const tableCode = `T${i.toString().padStart(2, '0')}`; // T01, T02...
            const tableName = `Bàn ${i}`;
            const qrToken = `token_table_${i}_abc123`; // Mã token demo cố định

            await pool.query(`
                INSERT INTO dining_tables (table_code, table_name, qr_token) 
                VALUES (?, ?, ?)
            `, [tableCode, tableName, qrToken]);
        }

        console.log('✅ Đã khởi tạo cơ sở dữ liệu mẫu Phở, Bún Bò, Cơm Chiên thành công!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi khi khởi tạo dữ liệu mẫu:', error.message);
        process.exit(1);
    }
};

seedDB();
