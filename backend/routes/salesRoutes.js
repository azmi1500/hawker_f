// backend/routes/salesRoutes.js
const express = require('express');
const router = express.Router();
const {
    createSale,
    getSales,
    getSalesSummary
} = require('../controllers/salesController');

// Route definitions
router.post('/', createSale);              // POST /api/sales
router.get('/', getSales);                  // GET /api/sales?filter=today
router.get('/summary', getSalesSummary);     // Your existing route
router.get('/summarys', getSalesSummary);   // GET /api/sales/summary?filter=today  ✅ This is what you need

module.exports = router;