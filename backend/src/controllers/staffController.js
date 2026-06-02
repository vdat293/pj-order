const { pool } = require('../config/database');

// API: Lấy danh sách toàn bộ đơn hàng (sắp xếp mới nhất trước)
exports.getOrders = async (req, res) => {
    try {
        const { status } = req.query;
        let query = `
            SELECT o.id, o.order_code, o.status, o.total_amount, o.customer_note, 
                   o.payment_status, o.payment_method, o.created_at, dt.table_name, dt.table_code
            FROM orders o
            JOIN dining_tables dt ON o.table_id = dt.id
        `;
        const params = [];

        if (status && status !== 'all') {
            query += ` WHERE o.status = ?`;
            params.push(status);
        }

        query += ` ORDER BY o.created_at DESC`;

        const [orders] = await pool.query(query, params);

        // Lấy tất cả items cho các đơn hàng để gộp lại
        if (orders.length === 0) {
            return res.json([]);
        }

        const orderIds = orders.map(o => o.id);
        const [items] = await pool.query(
            `SELECT oi.id, oi.order_id, oi.product_id, oi.product_name, oi.unit_price, 
                    oi.quantity, oi.note, oi.subtotal, oi.status
             FROM order_items oi
             WHERE oi.order_id IN (?)`,
            [orderIds]
        );

        // Lấy tất cả toppings đi kèm cho các items này
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

        // Gộp items vào từng order tương ứng
        const ordersWithItems = orders.map(order => {
            return {
                ...order,
                items: items.filter(item => item.order_id === order.id)
            };
        });

        res.json(ordersWithItems);
    } catch (error) {
        console.error('Lỗi API getOrders:', error);
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách đơn hàng' });
    }
};

// API: Cập nhật trạng thái đơn hàng (Confirmed, Preparing, Served, Completed, Cancelled)
exports.updateOrderStatus = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { orderId } = req.params;
        const { status, note } = req.body;
        const changedBy = req.user ? req.user.id : null;

        if (!status) {
            return res.status(400).json({ message: 'Thiếu trạng thái cập nhật' });
        }

        // Bắt đầu Transaction
        await connection.beginTransaction();

        // 1. Kiểm tra đơn hàng hiện tại
        const [orders] = await connection.query(
            'SELECT status, order_code, table_id FROM orders WHERE id = ?',
            [orderId]
        );

        if (orders.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        }

        const currentOrder = orders[0];
        const oldStatus = currentOrder.status;

        // 2. Cập nhật trạng thái trong bảng orders
        // Nếu chuyển sang trạng thái completed thì tự động đánh dấu payment_status = 'paid' và completed_at = NOW()
        let updateQuery = 'UPDATE orders SET status = ?';
        const updateParams = [status];

        if (status === 'completed') {
            updateQuery += ', payment_status = \'paid\', completed_at = CURRENT_TIMESTAMP';
        }

        updateQuery += ' WHERE id = ?';
        updateParams.push(orderId);

        await connection.query(updateQuery, updateParams);

        // 3. Ghi log lịch sử trạng thái
        await connection.query(
            `INSERT INTO order_status_logs (order_id, old_status, new_status, changed_by, note) 
             VALUES (?, ?, ?, ?, ?)`,
            [orderId, oldStatus, status, changedBy, note || `Cập nhật trạng thái từ nhân viên`]
        );

        // Commit transaction
        await connection.commit();

        // Phát tín hiệu Real-time qua Socket.io
        const io = req.app.get('io');
        if (io) {
            // Thông báo cho toàn bộ Staff khác biết để đồng bộ giao diện
            io.to('staff').emit('order:status_updated', {
                order_id: orderId,
                status: status,
                payment_status: status === 'completed' ? 'paid' : undefined
            });

            // Thông báo cho room bàn cụ thể biết (nếu cần thiết cho Client cập nhật nhanh)
            const [tableRows] = await pool.query('SELECT table_code FROM dining_tables WHERE id = ?', [currentOrder.table_id]);
            if (tableRows.length > 0) {
                const tableCode = tableRows[0].table_code;
                io.to(`table:${tableCode}`).emit('order:client_status_updated', {
                    order_id: orderId,
                    status: status
                });
            }
        }

        res.json({ 
            message: 'Cập nhật trạng thái đơn hàng thành công',
            status 
        });

    } catch (error) {
        await connection.rollback();
        console.error('Lỗi API updateOrderStatus:', error);
        res.status(500).json({ message: 'Lỗi server khi cập nhật trạng thái đơn hàng' });
    } finally {
        connection.release();
    }
};

// API: Cập nhật trạng thái thanh toán thủ công
exports.updatePaymentStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { payment_status, payment_method } = req.body;

        if (!payment_status) {
            return res.status(400).json({ message: 'Thiếu trạng thái thanh toán' });
        }

        const [result] = await pool.query(
            `UPDATE orders 
             SET payment_status = ?, payment_method = ? 
             WHERE id = ?`,
            [payment_status, payment_method || 'cash', orderId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        }

        // Phát tín hiệu socket đồng bộ
        const io = req.app.get('io');
        if (io) {
            io.to('staff').emit('order:payment_updated', {
                order_id: orderId,
                payment_status,
                payment_method
            });
        }

        res.json({ message: 'Cập nhật trạng thái thanh toán thành công' });
    } catch (error) {
        console.error('Lỗi API updatePaymentStatus:', error);
        res.status(500).json({ message: 'Lỗi server khi cập nhật thanh toán' });
    }
};

// API: Lấy danh sách toàn bộ Toppings đang hiển thị
exports.getToppings = async (req, res) => {
    try {
        const [toppings] = await pool.query(
            `SELECT t.*, c.name as category_name 
             FROM toppings t 
             LEFT JOIN categories c ON t.category_id = c.id 
             WHERE t.is_active = TRUE 
             ORDER BY t.category_id ASC, t.id ASC`
        );
        res.json(toppings);
    } catch (error) {
        console.error('Lỗi API getToppings:', error);
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách món thêm' });
    }
};

// API: Thêm một món thêm (Topping) mới
exports.createTopping = async (req, res) => {
    try {
        const { category_id, name, price, type } = req.body;
        if (!name || price === undefined) {
            return res.status(400).json({ message: 'Thiếu thông tin tên hoặc giá món thêm' });
        }

        const [result] = await pool.query(
            `INSERT INTO toppings (category_id, name, price, type, is_available, is_active) 
             VALUES (?, ?, ?, ?, TRUE, TRUE)`,
            [category_id || null, name, price, type || 'them']
        );

        res.status(201).json({ 
            message: 'Thêm món thêm thành công', 
            topping_id: result.insertId 
        });
    } catch (error) {
        console.error('Lỗi API createTopping:', error);
        res.status(500).json({ message: 'Lỗi máy chủ khi thêm món thêm' });
    }
};

// API: Cập nhật chi tiết một món thêm (Topping)
exports.updateTopping = async (req, res) => {
    try {
        const { id } = req.params;
        const { category_id, name, price, is_available, type } = req.body;

        if (!name || price === undefined) {
            return res.status(400).json({ message: 'Thiếu tên hoặc giá trị cập nhật' });
        }

        const [result] = await pool.query(
            `UPDATE toppings 
             SET category_id = ?, name = ?, price = ?, type = ?, is_available = ? 
             WHERE id = ? AND is_active = TRUE`,
            [category_id || null, name, price, type || 'them', is_available !== undefined ? is_available : true, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Không tìm thấy món thêm hoặc món đã bị xoá' });
        }

        res.json({ message: 'Cập nhật món thêm thành công' });
    } catch (error) {
        console.error('Lỗi API updateTopping:', error);
        res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật món thêm' });
    }
};

// API: Xoá mềm một món thêm (Topping) để bảo toàn dữ liệu lịch sử đơn hàng
exports.deleteTopping = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.query(
            `UPDATE toppings 
             SET is_active = FALSE 
             WHERE id = ?`,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Không tìm thấy món thêm cần xoá' });
        }

        res.json({ message: 'Xóa món thêm thành công' });
    } catch (error) {
        console.error('Lỗi API deleteTopping:', error);
        res.status(500).json({ message: 'Lỗi máy chủ khi xoá món thêm' });
    }
};

// ========================== CRUD MÓN ĂN CHÍNH (PRODUCTS) ==========================

// API: Lấy danh sách toàn bộ sản phẩm chính để quản lý
exports.getProducts = async (req, res) => {
    try {
        const [products] = await pool.query(
            `SELECT p.*, c.name as category_name 
             FROM products p 
             JOIN categories c ON p.category_id = c.id 
             WHERE p.is_active = TRUE 
             ORDER BY p.category_id ASC, p.sort_order ASC`
        );
        res.json(products);
    } catch (error) {
        console.error('Lỗi API getProducts:', error);
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách món chính' });
    }
};

// API: Thêm một sản phẩm chính mới
exports.createProduct = async (req, res) => {
    try {
        const { category_id, name, price, description, image_url } = req.body;
        if (!category_id || !name || price === undefined) {
            return res.status(400).json({ message: 'Thiếu thông tin danh mục, tên hoặc giá sản phẩm' });
        }

        const [result] = await pool.query(
            `INSERT INTO products (category_id, name, price, description, image_url, is_available, is_active) 
             VALUES (?, ?, ?, ?, ?, TRUE, TRUE)`,
            [category_id, name, price, description || '', image_url || '']
        );

        res.status(201).json({ 
            message: 'Thêm món chính thành công', 
            product_id: result.insertId 
        });
    } catch (error) {
        console.error('Lỗi API createProduct:', error);
        res.status(500).json({ message: 'Lỗi server khi thêm món chính' });
    }
};

// API: Cập nhật thông tin chi tiết một sản phẩm chính
exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { category_id, name, price, description, image_url, is_available } = req.body;

        if (!category_id || !name || price === undefined) {
            return res.status(400).json({ message: 'Thiếu thông tin sản phẩm cập nhật' });
        }

        const [result] = await pool.query(
            `UPDATE products 
             SET category_id = ?, name = ?, price = ?, description = ?, image_url = ?, is_available = ? 
             WHERE id = ? AND is_active = TRUE`,
            [category_id, name, price, description || '', image_url || '', is_available !== undefined ? is_available : true, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Không tìm thấy món chính' });
        }

        res.json({ message: 'Cập nhật món chính thành công' });
    } catch (error) {
        console.error('Lỗi API updateProduct:', error);
        res.status(500).json({ message: 'Lỗi server khi cập nhật món chính' });
    }
};

// API: Xoá mềm một sản phẩm chính
exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.query(
            `UPDATE products 
             SET is_active = FALSE 
             WHERE id = ?`,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Không tìm thấy món chính cần xoá' });
        }

        res.json({ message: 'Xoá món chính thành công' });
    } catch (error) {
        console.error('Lỗi API deleteProduct:', error);
        res.status(500).json({ message: 'Lỗi server khi xoá món chính' });
    }
};


