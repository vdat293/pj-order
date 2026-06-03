const { pool } = require('../config/database');

// API: Lấy thông tin bàn
exports.getTableInfo = async (req, res) => {
    try {
        const { code } = req.params;
        const { token } = req.query; // Xác thực token

        const [tables] = await pool.query(
            'SELECT id, table_code, table_name, status FROM dining_tables WHERE table_code = ? AND qr_token = ?',
            [code, token]
        );

        if (tables.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy bàn hoặc mã QR không hợp lệ' });
        }

        res.json({ table: tables[0] });
    } catch (error) {
        console.error('Lỗi API getTableInfo:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// API: Lấy thực đơn (Menu)
exports.getMenu = async (req, res) => {
    try {
        // Lấy tất cả danh mục đang active
        const [categories] = await pool.query(
            'SELECT id, name FROM categories WHERE is_active = TRUE ORDER BY sort_order ASC'
        );

        // Lấy tất cả món ăn đang bán
        const [products] = await pool.query(
            `SELECT 
                p.id, p.category_id, p.name, p.price, p.description, p.image_url, p.is_available,
                COALESCE((
                    SELECT SUM(oi.quantity)
                    FROM order_items oi
                    JOIN orders o ON o.id = oi.order_id
                    WHERE oi.product_id = p.id
                      AND oi.status <> 'cancelled'
                      AND o.status <> 'cancelled'
                ), 0) AS order_count
             FROM products p
             WHERE p.is_active = TRUE
             ORDER BY p.sort_order ASC`
        );

        // Lấy tất cả toppings đang hoạt động và sẵn sàng phục vụ
        const [toppings] = await pool.query(
            'SELECT id, product_id, category_id, name, price, type, is_available FROM toppings WHERE is_active = TRUE AND is_available = TRUE'
        );

        // Gộp toppings vào món ăn tương ứng dựa trên product_id hoặc category_id
        const productsWithToppings = products.map(prod => {
            return {
                ...prod,
                toppings: toppings.filter(t => t.product_id === prod.id || t.category_id === prod.category_id)
            };
        });

        // Gộp món ăn vào danh mục tương ứng
        const menu = categories.map(cat => ({
            id: cat.id,
            name: cat.name,
            products: productsWithToppings.filter(p => p.category_id === cat.id)
        }));

        res.json(menu);
    } catch (error) {
        console.error('Lỗi API getMenu:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// API: Khách hàng Đặt món
exports.createOrder = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { table_code, qr_token, customer_note, items } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'Giỏ hàng trống' });
        }

        // 1. Kiểm tra tính hợp lệ của bàn
        const [tables] = await connection.query(
            'SELECT id, table_name FROM dining_tables WHERE table_code = ? AND qr_token = ?',
            [table_code, qr_token]
        );

        if (tables.length === 0) {
            return res.status(404).json({ message: 'Thông tin bàn không hợp lệ' });
        }
        
        const table = tables[0];

        // Bắt đầu Transaction
        await connection.beginTransaction();

        // 2. Tạo đơn hàng mới (orders)
        // Cấu trúc mã đơn ngẫu nhiên ví dụ: OD + timestamp + tableId
        const orderCode = `OD${Date.now()}${table.id}`;
        
        const [orderResult] = await connection.query(
            `INSERT INTO orders (order_code, table_id, customer_note, status, total_amount) 
             VALUES (?, ?, ?, 'pending', 0)`,
            [orderCode, table.id, customer_note]
        );
        const orderId = orderResult.insertId;

        // 3. Xử lý chi tiết các món (order_items)
        let totalAmount = 0;

        for (const item of items) {
            const [productRows] = await connection.query(
                'SELECT name, price, category_id, is_available FROM products WHERE id = ?',
                [item.product_id]
            );

            if (productRows.length === 0) {
                throw new Error(`Sản phẩm ID ${item.product_id} không tồn tại`);
            }

            const product = productRows[0];
            if (!product.is_available) {
                throw new Error(`Món "${product.name}" hiện đang hết hàng`);
            }

            // Tính toán tổng tiền các toppings được chọn từ DB để an toàn và chính xác
            let toppingsPrice = 0;
            const itemToppings = [];

            if (item.toppings && item.toppings.length > 0) {
                const toppingIds = item.toppings.map(t => t.topping_id || t.id);
                const [toppingRows] = await connection.query(
                    'SELECT id, category_id, name, price, type, is_available FROM toppings WHERE id IN (?)',
                    [toppingIds]
                );

                for (const top of toppingRows) {
                    if (!top.is_available) {
                        throw new Error(`Topping "${top.name}" hiện đang tạm hết`);
                    }
                    toppingsPrice += parseFloat(top.price);
                    itemToppings.push(top);
                }
            }

            if (product.category_id === 3) {
                const meatOptions = ['Thịt heo', 'Thịt bò', 'Cả hai'];
                const selectedMeatOptions = itemToppings.filter(top =>
                    top.category_id === 3 && meatOptions.includes(top.name)
                );

                if (selectedMeatOptions.length !== 1) {
                    throw new Error(`Món "${product.name}" cần chọn đúng 1 loại thịt: thịt heo, thịt bò hoặc cả hai`);
                }
            }

            const quantity = parseInt(item.quantity) || 1;
            const unitPrice = parseFloat(product.price) + toppingsPrice;
            const subtotal = unitPrice * quantity;
            totalAmount += subtotal;

            const [orderItemResult] = await connection.query(
                `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, note, subtotal) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [orderId, item.product_id, product.name, unitPrice, quantity, item.note || '', subtotal]
            );
            const orderItemId = orderItemResult.insertId;

            // Chèn toppings đã chọn vào bảng order_item_toppings
            for (const top of itemToppings) {
                await connection.query(
                    `INSERT INTO order_item_toppings (order_item_id, topping_id, topping_name, price, quantity)
                     VALUES (?, ?, ?, ?, 1)`,
                    [orderItemId, top.id, top.name, top.price]
                );
            }
        }

        // Cập nhật lại tổng tiền cho đơn hàng
        await connection.query(
            'UPDATE orders SET total_amount = ? WHERE id = ?',
            [totalAmount, orderId]
        );

        // Ghi lại log lịch sử đơn hàng
        await connection.query(
            `INSERT INTO order_status_logs (order_id, new_status, note) 
             VALUES (?, 'pending', 'Khách hàng đặt món mới qua QR')`,
            [orderId]
        );

        // Commit Transaction nếu mọi thứ thành công
        await connection.commit();

        // Gửi sự kiện realtime cho Staff Dashboard
        const io = req.app.get('io');
        if (io) {
            io.to('staff').emit('order:new', {
                order_id: orderId,
                order_code: orderCode,
                table_name: table.table_name,
                total_amount: totalAmount,
                items_count: items.length
            });
        }

        res.status(201).json({ 
            message: 'Đặt món thành công', 
            order_code: orderCode, 
            order_id: orderId 
        });

    } catch (error) {
        // Hoàn tác (Rollback) mọi thay đổi nếu có lỗi (ví dụ: món bị hết)
        await connection.rollback();
        console.error('Lỗi API createOrder:', error);
        res.status(400).json({ message: error.message || 'Lỗi xử lý đơn hàng' });
    } finally {
        connection.release();
    }
};

// API: Lấy chi tiết đơn hàng và trạng thái hiện tại
exports.getOrderDetails = async (req, res) => {
    try {
        const { orderId } = req.params;

        // 1. Lấy thông tin đơn hàng chính kèm tên bàn
        const [orders] = await pool.query(
            `SELECT o.id, o.order_code, o.status, o.total_amount, o.customer_note, 
                    o.payment_status, o.payment_method, o.created_at, dt.table_name, dt.table_code
             FROM orders o
             JOIN dining_tables dt ON o.table_id = dt.id
             WHERE o.id = ?`,
            [orderId]
        );

        if (orders.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng này' });
        }

        const order = orders[0];

        // 2. Lấy danh sách chi tiết các món trong đơn hàng
        const [items] = await pool.query(
            `SELECT oi.id, oi.product_id, oi.product_name, oi.unit_price, 
                    oi.quantity, oi.note, oi.subtotal, oi.status
             FROM order_items oi
             WHERE oi.order_id = ?`,
            [orderId]
        );

        if (items.length > 0) {
            const itemIds = items.map(item => item.id);
            const [toppings] = await pool.query(
                `SELECT oit.id, oit.order_item_id, oit.topping_id, oit.topping_name, oit.price, oit.quantity, t.type
                 FROM order_item_toppings oit
                 LEFT JOIN toppings t ON oit.topping_id = t.id
                 WHERE oit.order_item_id IN (?)`,
                [itemIds]
            );

            items.forEach(item => {
                item.toppings = toppings.filter(t => t.order_item_id === item.id);
            });
        }

        res.json({
            order: {
                ...order,
                items
            }
        });
    } catch (error) {
        console.error('Lỗi API getOrderDetails:', error);
        res.status(500).json({ message: 'Lỗi máy chủ khi truy vấn đơn hàng' });
    }
};
