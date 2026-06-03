const { pool } = require('../config/database');
const bcrypt = require('bcrypt');

const imageUrls = {
    pho: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600&auto=format&fit=crop&q=70',
    bunBo: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop&q=70',
    bunBoTron: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=70',
    comGa: 'https://images.unsplash.com/photo-1603133872878-306509a25b1b?w=600&auto=format&fit=crop&q=70',
    drink: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=70'
};

const categories = [
    { id: 1, name: 'Phở', sort_order: 1 },
    { id: 2, name: 'Bún bò', sort_order: 2 },
    { id: 3, name: 'Bún bò trộn', sort_order: 3 },
    { id: 4, name: 'Cơm gà xối mỡ', sort_order: 4 },
    { id: 5, name: 'Nước uống', sort_order: 5 }
];

const products = [
    { id: 1, category_id: 1, name: 'Phở bò viên', price: 35000, description: 'Phở bò viên nước dùng đậm vị, dùng nóng cùng rau thơm.', image_url: imageUrls.pho, sort_order: 1 },
    { id: 2, category_id: 1, name: 'Phở tái', price: 40000, description: 'Phở bò tái mềm, nước dùng thơm ngọt.', image_url: imageUrls.pho, sort_order: 2 },
    { id: 3, category_id: 1, name: 'Phở nạm', price: 40000, description: 'Phở nạm bò chín mềm, nước dùng thanh ngọt.', image_url: imageUrls.pho, sort_order: 3 },
    { id: 4, category_id: 1, name: 'Phở gân', price: 40000, description: 'Phở gân bò giòn mềm, ăn kèm rau thơm.', image_url: imageUrls.pho, sort_order: 4 },
    { id: 5, category_id: 1, name: 'Phở gà', price: 40000, description: 'Phở gà thịt mềm, nước dùng nhẹ và thơm.', image_url: imageUrls.pho, sort_order: 5 },
    { id: 6, category_id: 1, name: 'Phở gầu', price: 45000, description: 'Phở gầu bò béo thơm, nước dùng đậm đà.', image_url: imageUrls.pho, sort_order: 6 },
    { id: 7, category_id: 1, name: 'Phở 2 loại thịt', price: 45000, description: 'Tô phở kết hợp 2 loại thịt tùy chọn.', image_url: imageUrls.pho, sort_order: 7 },
    { id: 8, category_id: 1, name: 'Phở đặc biệt', price: 60000, description: 'Tô phở đầy đủ nhiều loại thịt, khẩu phần lớn.', image_url: imageUrls.pho, sort_order: 8 },
    { id: 9, category_id: 2, name: 'Bún bò viên', price: 35000, description: 'Bún bò viên nước dùng đậm vị, dùng nóng cùng rau thơm.', image_url: imageUrls.bunBo, sort_order: 1 },
    { id: 10, category_id: 2, name: 'Bún bò tái', price: 40000, description: 'Bún bò tái mềm, nước dùng thơm ngọt.', image_url: imageUrls.bunBo, sort_order: 2 },
    { id: 11, category_id: 2, name: 'Bún bò nạm', price: 40000, description: 'Bún bò nạm chín mềm, nước dùng đậm đà.', image_url: imageUrls.bunBo, sort_order: 3 },
    { id: 12, category_id: 2, name: 'Bún bò gân', price: 40000, description: 'Bún bò gân giòn mềm, ăn kèm rau thơm.', image_url: imageUrls.bunBo, sort_order: 4 },
    { id: 13, category_id: 2, name: 'Bún bò gà', price: 40000, description: 'Bún bò dùng kèm thịt gà, nước dùng nóng thơm.', image_url: imageUrls.bunBo, sort_order: 5 },
    { id: 14, category_id: 2, name: 'Bún bò gầu', price: 45000, description: 'Bún bò gầu béo thơm, nước dùng đậm đà.', image_url: imageUrls.bunBo, sort_order: 6 },
    { id: 15, category_id: 2, name: 'Bún bò 2 loại thịt', price: 45000, description: 'Tô bún bò kết hợp 2 loại thịt tùy chọn.', image_url: imageUrls.bunBo, sort_order: 7 },
    { id: 16, category_id: 2, name: 'Bún bò đặc biệt', price: 60000, description: 'Tô bún bò đầy đủ nhiều loại thịt, khẩu phần lớn.', image_url: imageUrls.bunBo, sort_order: 8 },
    { id: 17, category_id: 3, name: 'Bún bò trộn tô thường', price: 40000, description: 'Bún bò trộn rau tươi, thịt bò và nước sốt đậm vị.', image_url: imageUrls.bunBoTron, sort_order: 1 },
    { id: 18, category_id: 3, name: 'Bún bò trộn tô đặc biệt', price: 60000, description: 'Bún bò trộn khẩu phần đặc biệt, nhiều thịt hơn.', image_url: imageUrls.bunBoTron, sort_order: 2 },
    { id: 19, category_id: 4, name: 'Cơm đùi gà', price: 35000, description: 'Cơm đùi gà xối mỡ da giòn, ăn kèm rau và nước chấm.', image_url: imageUrls.comGa, sort_order: 1 },
    { id: 20, category_id: 4, name: 'Cơm đùi gà góc tư', price: 45000, description: 'Cơm đùi gà góc tư xối mỡ, khẩu phần lớn.', image_url: imageUrls.comGa, sort_order: 2 },
    { id: 21, category_id: 4, name: 'Cơm má đùi', price: 25000, description: 'Cơm má đùi gà xối mỡ, phần gọn dễ ăn.', image_url: imageUrls.comGa, sort_order: 3 },
    { id: 22, category_id: 5, name: 'Nước suối', price: 10000, description: 'Nước suối đóng chai.', image_url: imageUrls.drink, sort_order: 1 },
    { id: 23, category_id: 5, name: 'Nước ngọt các loại', price: 15000, description: 'Các loại nước ngọt đóng chai hoặc lon.', image_url: imageUrls.drink, sort_order: 2 },
    { id: 24, category_id: 5, name: 'Nước cam', price: 15000, description: 'Nước cam giải khát.', image_url: imageUrls.drink, sort_order: 3 },
    { id: 25, category_id: 5, name: 'Trà tắc', price: 15000, description: 'Trà tắc chua ngọt mát lạnh.', image_url: imageUrls.drink, sort_order: 4 }
];

const toppings = [
    { category_id: 1, name: 'Bò viên', price: 15000, type: 'cung' },
    { category_id: 1, name: 'Tái', price: 15000, type: 'cung' },
    { category_id: 1, name: 'Nạm', price: 15000, type: 'cung' },
    { category_id: 1, name: 'Gân', price: 15000, type: 'cung' },
    { category_id: 1, name: 'Gà', price: 15000, type: 'cung' },
    { category_id: 1, name: 'Gầu', price: 20000, type: 'cung' },
    { category_id: 1, name: 'Chén thịt', price: 30000, type: 'cung' },
    { category_id: 1, name: 'Chén gầu', price: 35000, type: 'cung' },
    { category_id: 1, name: 'Bánh thêm', price: 10000, type: 'them' },
    { category_id: 1, name: 'Chén trứng', price: 10000, type: 'them' },
    { category_id: 1, name: 'Chén trứng tiết', price: 15000, type: 'them' },
    { category_id: 2, name: 'Bò viên', price: 15000, type: 'cung' },
    { category_id: 2, name: 'Tái', price: 15000, type: 'cung' },
    { category_id: 2, name: 'Nạm', price: 15000, type: 'cung' },
    { category_id: 2, name: 'Gân', price: 15000, type: 'cung' },
    { category_id: 2, name: 'Gà', price: 15000, type: 'cung' },
    { category_id: 2, name: 'Gầu', price: 20000, type: 'cung' },
    { category_id: 2, name: 'Chén thịt', price: 30000, type: 'cung' },
    { category_id: 2, name: 'Chén gầu', price: 35000, type: 'cung' },
    { category_id: 2, name: 'Bún thêm', price: 10000, type: 'them' },
    { category_id: 2, name: 'Chén trứng', price: 10000, type: 'them' },
    { category_id: 2, name: 'Chén trứng tiết', price: 15000, type: 'them' },
    { category_id: 3, name: 'Thịt heo', price: 0, type: 'cung' },
    { category_id: 3, name: 'Thịt bò', price: 0, type: 'cung' },
    { category_id: 3, name: 'Cả hai', price: 0, type: 'cung' }
];

const tableTokens = [
    'q8vL3mN7pR2xT9cK5dH1',
    'aP4zW8nQ6tF2yX7kM1sJ',
    'uH9cL2rV5bN8qT3mD6xF',
    'fK7pZ1xM4vR9nC2tY5hW',
    'mT3qJ8dH6sP1aV9xL4cN',
    'rN5yX2kQ7uF3mZ8pD1hL',
    'cV8mR4tH1pJ6xN9qW2zK',
    'xD2hL7pM5cT8nQ3vF1yR',
    'nQ6xF1mK9rV4tH2pZ7cJ',
    'pY3cN8qL5xM1hD7vT2rW',
    'zM7tH2pR5nQ9xF4cV1kL'
];

const seedDB = async () => {
    try {
        console.log('Dang lam sach va khoi tao lai du lieu mau Pho Huong Phu...');

        await pool.query('SET FOREIGN_KEY_CHECKS = 0');
        await pool.query('DELETE FROM order_item_toppings');
        await pool.query('DELETE FROM toppings');
        await pool.query('DELETE FROM order_items');
        await pool.query('DELETE FROM order_status_logs');
        await pool.query('DELETE FROM orders');
        await pool.query('DELETE FROM products');
        await pool.query('DELETE FROM categories');
        await pool.query('DELETE FROM users');
        await pool.query('DELETE FROM dining_tables');
        await pool.query('SET FOREIGN_KEY_CHECKS = 1');

        const hostHash = await bcrypt.hash('host123', 10);
        await pool.query(
            'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
            ['Host', 'host@example.com', hostHash, 'host']
        );

        for (const category of categories) {
            await pool.query(
                'INSERT INTO categories (id, name, sort_order) VALUES (?, ?, ?)',
                [category.id, category.name, category.sort_order]
            );
        }

        for (const product of products) {
            await pool.query(
                `INSERT INTO products
                 (id, category_id, name, price, description, image_url, sort_order, is_available, is_active)
                 VALUES (?, ?, ?, ?, ?, ?, ?, TRUE, TRUE)`,
                [
                    product.id,
                    product.category_id,
                    product.name,
                    product.price,
                    product.description,
                    product.image_url,
                    product.sort_order
                ]
            );
        }

        for (let i = 1; i <= 11; i++) {
            const tableCode = `B${i.toString().padStart(2, '0')}`;
            const token = tableTokens[i - 1];
            await pool.query(
                'INSERT INTO dining_tables (table_code, table_name, qr_token) VALUES (?, ?, ?)',
                [tableCode, `Bàn ${i}`, token]
            );
        }

        for (const topping of toppings) {
            await pool.query(
                'INSERT INTO toppings (category_id, name, price, type, is_available, is_active) VALUES (?, ?, ?, ?, TRUE, TRUE)',
                [topping.category_id, topping.name, topping.price, topping.type]
            );
        }

        console.log('Da khoi tao du lieu mau Pho Huong Phu thanh cong!');
        process.exit(0);
    } catch (error) {
        console.error('Loi khi khoi tao du lieu mau:', error.message);
        process.exit(1);
    }
};

seedDB();
