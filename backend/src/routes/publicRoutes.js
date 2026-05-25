const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

// [GET] /api/public/tables/:code
router.get('/tables/:code', publicController.getTableInfo);

// [GET] /api/public/menu
router.get('/menu', publicController.getMenu);

// [POST] /api/public/orders
router.post('/orders', publicController.createOrder);

// [GET] /api/public/orders/:orderId
router.get('/orders/:orderId', publicController.getOrderDetails);

module.exports = router;
