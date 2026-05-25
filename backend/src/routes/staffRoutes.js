const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const authMiddleware = require('../middlewares/auth');

// Áp dụng middleware xác thực cho tất cả route staff
router.use(authMiddleware);

// [GET] /api/staff/orders
router.get('/orders', staffController.getOrders);

// [PATCH] /api/staff/orders/:orderId/status
router.patch('/orders/:orderId/status', staffController.updateOrderStatus);

// [PATCH] /api/staff/orders/:orderId/payment
router.patch('/orders/:orderId/payment', staffController.updatePaymentStatus);

module.exports = router;
