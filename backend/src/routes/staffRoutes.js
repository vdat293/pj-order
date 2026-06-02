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

// Quản lý món thêm (Toppings)
router.get('/toppings', staffController.getToppings);
router.post('/toppings', staffController.createTopping);
router.put('/toppings/:id', staffController.updateTopping);
router.delete('/toppings/:id', staffController.deleteTopping);

// Quản lý món chính (Products)
router.get('/products', staffController.getProducts);
router.post('/products', staffController.createProduct);
router.put('/products/:id', staffController.updateProduct);
router.delete('/products/:id', staffController.deleteProduct);

module.exports = router;
