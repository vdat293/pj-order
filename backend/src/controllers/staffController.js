const { pool } = require('../config/database');
const {
    ensureTableSessionSchema,
    revokeSessionsForOrder
} = require('../services/tableSessionService');

// API: Lấy danh sách toàn bộ đơn hàng (sắp xếp mới nhất trước)
exports.getOrders = async (req, res) => {
    try {
        const { status, date } = req.query;
        let query = `
            SELECT o.id, o.order_code, o.status, o.total_amount, o.customer_note, 
                   o.payment_status, o.payment_method, o.created_at, dt.table_name, dt.table_code
            FROM orders o
            JOIN dining_tables dt ON o.table_id = dt.id
        `;
        const params = [];
        const conditions = [];

        if (status && status !== 'all') {
            conditions.push(`o.status = ?`);
            params.push(status);
        }

        if (date === 'today') {
            conditions.push(`DATE(o.created_at) = CURDATE()`);
        }

        if (conditions.length > 0) {
            query += ` WHERE ${conditions.join(' AND ')}`;
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

        await ensureTableSessionSchema(connection);

        // Bắt đầu Transaction
        await connection.beginTransaction();

        // 1. Kiểm tra đơn hàng hiện tại
        const [orders] = await connection.query(
            'SELECT status, order_code, table_id FROM orders WHERE id = ?',
            [orderId]
        );

        if (orders.length === 0) {
            await connection.rollback();
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

        if (status === 'completed') {
            await revokeSessionsForOrder(connection, orderId);
        }

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
    const connection = await pool.getConnection();
    try {
        const { orderId } = req.params;
        const { payment_status, payment_method } = req.body;

        if (!payment_status) {
            return res.status(400).json({ message: 'Thiếu trạng thái thanh toán' });
        }

        await ensureTableSessionSchema(connection);

        await connection.beginTransaction();

        const [result] = await connection.query(
            `UPDATE orders 
             SET payment_status = ?, payment_method = ? 
             WHERE id = ?`,
            [payment_status, payment_method || 'cash', orderId]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        }

        if (payment_status === 'paid') {
            await revokeSessionsForOrder(connection, orderId);
        }

        await connection.commit();

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
        await connection.rollback();
        console.error('Lỗi API updatePaymentStatus:', error);
        res.status(500).json({ message: 'Lỗi server khi cập nhật thanh toán' });
    } finally {
        connection.release();
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

// ========================== THỐNG KÊ DOANH THU THỰC TẾ ==========================

// Helper: Lấy điều kiện thời gian cho SQL
const getDateFilterCondition = (filterType, startDateStr, endDateStr, params) => {
    let condition = "";
    
    switch (filterType) {
        case 'today':
            condition = " AND DATE(o.created_at) = CURDATE()";
            break;
        case 'yesterday':
            condition = " AND DATE(o.created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)";
            break;
        case 'seven_days':
            condition = " AND o.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
            break;
        case 'this_month':
            condition = " AND o.created_at >= DATE_FORMAT(NOW(), '%Y-%m-01 00:00:00')";
            break;
        case 'custom':
            if (startDateStr && endDateStr) {
                condition = " AND o.created_at BETWEEN ? AND ?";
                params.push(`${startDateStr} 00:00:00`);
                params.push(`${endDateStr} 23:59:59`);
            }
            break;
        default:
            // Mặc định là 'today'
            condition = " AND DATE(o.created_at) = CURDATE()";
    }
    return condition;
};

// [GET] /api/staff/revenue/stats
exports.getRevenueStats = async (req, res) => {
    try {
        const { filterType = 'today', startDate, endDate } = req.query;
        
        // 1. Lấy điều kiện ngày
        const paramsOverview = [];
        const dateCondition = getDateFilterCondition(filterType, startDate, endDate, paramsOverview);
        
        // 2. Query thông tin tổng quan (KPIs)
        const overviewQuery = `
            SELECT 
                COALESCE(SUM(o.total_amount), 0) as total_revenue,
                COUNT(o.id) as total_orders,
                COALESCE(AVG(o.total_amount), 0) as avg_order_value
            FROM orders o
            WHERE o.payment_status = 'paid' AND o.status != 'cancelled' ${dateCondition}
        `;
        const [[overview]] = await pool.query(overviewQuery, paramsOverview);

        // 3. Cơ cấu phương thức thanh toán
        const paramsPayment = [];
        const dateConditionPayment = getDateFilterCondition(filterType, startDate, endDate, paramsPayment);
        const paymentQuery = `
            SELECT 
                o.payment_method,
                COUNT(o.id) as count,
                COALESCE(SUM(o.total_amount), 0) as total_revenue
            FROM orders o
            WHERE o.payment_status = 'paid' AND o.status != 'cancelled' ${dateConditionPayment}
            GROUP BY o.payment_method
        `;
        const [paymentBreakdown] = await pool.query(paymentQuery, paramsPayment);

        // 4. Doanh thu theo ngày (Biểu đồ xu hướng)
        const paramsTrend = [];
        const dateConditionTrend = getDateFilterCondition(filterType, startDate, endDate, paramsTrend);
        const trendQuery = `
            SELECT 
                DATE_FORMAT(o.created_at, '%Y-%m-%d') as date,
                COUNT(o.id) as count,
                COALESCE(SUM(o.total_amount), 0) as total_revenue
            FROM orders o
            WHERE o.payment_status = 'paid' AND o.status != 'cancelled' ${dateConditionTrend}
            GROUP BY DATE(o.created_at)
            ORDER BY DATE(o.created_at) ASC
        `;
        const [dailyTrend] = await pool.query(trendQuery, paramsTrend);

        // 5. Top 5 món bán chạy nhất
        const paramsTopItems = [];
        const dateConditionTop = getDateFilterCondition(filterType, startDate, endDate, paramsTopItems);
        const topItemsQuery = `
            SELECT 
                oi.product_name,
                SUM(oi.quantity) as quantity_sold,
                COALESCE(SUM(oi.subtotal), 0) as total_revenue
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE o.payment_status = 'paid' AND o.status != 'cancelled' ${dateConditionTop}
            GROUP BY oi.product_id, oi.product_name
            ORDER BY quantity_sold DESC, total_revenue DESC
            LIMIT 5
        `;
        const [topProducts] = await pool.query(topItemsQuery, paramsTopItems);

        // 6. Tính toán doanh số từ topping
        const paramsToppings = [];
        const dateConditionToppings = getDateFilterCondition(filterType, startDate, endDate, paramsToppings);
        const toppingsQuery = `
            SELECT 
                COALESCE(SUM(oit.price * oit.quantity), 0) as toppings_revenue
            FROM order_item_toppings oit
            JOIN order_items oi ON oit.order_item_id = oi.id
            JOIN orders o ON oi.order_id = o.id
            WHERE o.payment_status = 'paid' AND o.status != 'cancelled' ${dateConditionToppings}
        `;
        const [[toppingsOverview]] = await pool.query(toppingsQuery, paramsToppings);

        res.json({
            overview: {
                total_revenue: parseFloat(overview.total_revenue),
                total_orders: parseInt(overview.total_orders),
                avg_order_value: parseFloat(overview.avg_order_value),
                toppings_revenue: parseFloat(toppingsOverview.toppings_revenue)
            },
            paymentBreakdown: paymentBreakdown.map(p => ({
                payment_method: p.payment_method,
                count: parseInt(p.count),
                total_revenue: parseFloat(p.total_revenue)
            })),
            dailyTrend: dailyTrend.map(d => ({
                date: d.date,
                count: parseInt(d.count),
                total_revenue: parseFloat(d.total_revenue)
            })),
            topProducts: topProducts.map(p => ({
                product_name: p.product_name,
                quantity_sold: parseInt(p.quantity_sold),
                total_revenue: parseFloat(p.total_revenue)
            }))
        });

    } catch (error) {
        console.error('Lỗi API getRevenueStats:', error);
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy thống kê doanh thu' });
    }
};

// [GET] /api/staff/revenue/orders
exports.getRevenueOrders = async (req, res) => {
    try {
        const { search = '', filterType = 'today', startDate, endDate } = req.query;
        
        const params = [];
        let query = `
            SELECT o.id, o.order_code, o.status, o.total_amount, o.payment_status, 
                   o.payment_method, o.created_at, dt.table_name, dt.table_code
            FROM orders o
            JOIN dining_tables dt ON o.table_id = dt.id
            WHERE o.payment_status = 'paid' AND o.status != 'cancelled'
        `;
        
        // Thêm điều kiện thời gian
        query += getDateFilterCondition(filterType, startDate, endDate, params);

        // Thêm điều kiện tìm kiếm (Mã đơn hoặc Tên bàn)
        if (search) {
            query += " AND (o.order_code LIKE ? OR dt.table_name LIKE ?)";
            params.push(`%${search}%`);
            params.push(`%${search}%`);
        }

        query += " ORDER BY o.created_at DESC";

        const [orders] = await pool.query(query, params);

        if (orders.length === 0) {
            return res.json([]);
        }

        // Lấy chi tiết món ăn của các đơn hàng này
        const orderIds = orders.map(o => o.id);
        const [items] = await pool.query(
            `SELECT oi.id, oi.order_id, oi.product_name, oi.unit_price, oi.quantity, oi.subtotal
             FROM order_items oi
             WHERE oi.order_id IN (?)`,
            [orderIds]
        );

        // Ghép món ăn vào đơn tương ứng
        const ordersWithItems = orders.map(order => {
            return {
                ...order,
                items: items.filter(item => item.order_id === order.id).map(item => ({
                    product_name: item.product_name,
                    unit_price: parseFloat(item.unit_price),
                    quantity: parseInt(item.quantity),
                    subtotal: parseFloat(item.subtotal)
                }))
            };
        });

        res.json(ordersWithItems);

    } catch (error) {
        console.error('Lỗi API getRevenueOrders:', error);
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy danh sách hóa đơn doanh thu' });
    }
};

