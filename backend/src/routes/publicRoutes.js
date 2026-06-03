const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');
const { createRateLimiter } = require('../middlewares/rateLimit');

const publicReadLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 120,
    keyPrefix: 'public-read',
    message: 'Bạn thao tác quá nhanh. Vui lòng thử lại sau.'
});

const createOrderLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 8,
    keyPrefix: 'create-order',
    message: 'Bạn đã gửi quá nhiều yêu cầu đặt món. Vui lòng thử lại sau.'
});

// [GET] /api/public/tables/:code
router.get('/tables/:code', publicReadLimiter, publicController.getTableInfo);

// [GET] /api/public/menu
router.get('/menu', publicReadLimiter, publicController.getMenu);

// [POST] /api/public/orders
router.post('/orders', createOrderLimiter, publicController.createOrder);

// [GET] /api/public/orders/:orderId
router.get('/orders/:orderId', publicReadLimiter, publicController.getOrderDetails);

module.exports = router;
