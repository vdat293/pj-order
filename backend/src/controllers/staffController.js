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
