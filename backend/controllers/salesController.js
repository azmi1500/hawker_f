const { getPool, sql } = require('../config/db');

// backend/controllers/salesController.js
// backend/controllers/salesController.js

const createSale = async (req, res) => {
    try {
        const { total, paymentMethod, items } = req.body;
        const userId = req.user.id;
        
        const itemsJson = JSON.stringify(items);
        console.log('📦 Saving items:', itemsJson);
        
        const pool = getPool();
        
        // ✅ FIX: INSERT first, then SELECT separately
        await pool.request()
            .input('total', sql.Decimal(10,2), total)
            .input('paymentMethod', sql.NVarChar, paymentMethod)
            .input('itemsJson', sql.NVarChar, itemsJson)
            .input('userId', sql.Int, userId)
            .query(`
                INSERT INTO Sales (Total, PaymentMethod, ItemsJson, UserId)
                VALUES (@total, @paymentMethod, @itemsJson, @userId)
            `);

        // Get the inserted record
        const result = await pool.request()
            .query('SELECT TOP 1 Id, Total, PaymentMethod, SaleDate, ItemsJson FROM Sales ORDER BY Id DESC');

        const savedSale = result.recordset[0];
        
        // Parse items safely
        let parsedItems = items;
        if (savedSale.ItemsJson) {
            try {
                parsedItems = typeof savedSale.ItemsJson === 'string' 
                    ? JSON.parse(savedSale.ItemsJson)
                    : savedSale.ItemsJson;
            } catch (e) {
                console.error('Parse error:', e);
            }
        }

        const newSale = {
            id: savedSale.Id,
            total: savedSale.Total,
            paymentMethod: savedSale.PaymentMethod,
            date: savedSale.SaleDate,
            items: parsedItems
        };

        console.log('✅ Sale saved:', newSale);
        res.status(201).json(newSale);
        
    } catch (err) {
        console.error('❌ Error:', err);
        res.status(500).json({ error: err.message });
    }
};

// Get filtered sales
// In backend/controllers/salesController.js
const getSales = async (req, res) => {
    try {
        const { filter, startDate, endDate } = req.query;
        const userId = req.user.id;
        const pool = getPool();
        
        let query = 'SELECT Id, Total, PaymentMethod, SaleDate, CAST(ItemsJson AS NVARCHAR(MAX)) as ItemsJson FROM Sales WHERE UserId = @userId';
        const request = pool.request();
        request.input('userId', sql.Int, userId);

        console.log('Filter:', filter, 'Start:', startDate, 'End:', endDate); // ✅ Debug

        // ✅ FIX: Apply filters correctly
        if (filter === 'today') {
            query += ' AND CAST(SaleDate AS DATE) = CAST(GETDATE() AS DATE)';
        } 
        else if (filter === 'week') {
            query += ' AND SaleDate >= DATEADD(day, -7, GETDATE())';
        } 
        else if (filter === 'month') {
            query += ' AND SaleDate >= DATEADD(month, -1, GETDATE())';
        } 
        else if (filter === 'custom' && startDate && endDate) {
            // ✅ IMPORTANT FIX: Parse dates correctly
            const start = new Date(startDate);
            const end = new Date(endDate);
            
            // Set time boundaries
            start.setHours(0, 0, 0, 0);  // Start of day
            end.setHours(23, 59, 59, 999); // End of day
            
            console.log('Custom dates:', { start, end }); // ✅ Debug
            
            query += ' AND SaleDate >= @startDate AND SaleDate <= @endDate';
            request.input('startDate', sql.DateTime, start);
            request.input('endDate', sql.DateTime, end);
        }

        query += ' ORDER BY SaleDate DESC';
        console.log('Final query:', query); // ✅ Debug
        
        const result = await request.query(query);
        console.log(`Found ${result.recordset.length} sales`); // ✅ Debug
        
        // Format response
        const formattedSales = result.recordset.map(sale => {
            let items = [];
            try {
                items = JSON.parse(sale.ItemsJson);
            } catch (e) {
                console.error('Parse error:', e);
                items = [];
            }
            
            return {
                id: sale.Id,
                total: sale.Total,
                paymentMethod: sale.PaymentMethod,
                date: sale.SaleDate,
                items: items
            };
        });

        res.json(formattedSales);
    } catch (err) {
        console.error('Error getting sales:', err);
        res.status(500).json({ error: err.message });
    }
};


// Get sales summary
const getSalesSummary = async (req, res) => {
    try {
        const { filter, startDate, endDate } = req.query;
        const userId = req.user.id;
        const pool = getPool();
        
        let query = 'SELECT * FROM Sales WHERE UserId = @userId';
        const request = pool.request();
        request.input('userId', sql.Int, userId);

        // ✅ FIX: Same filter logic
        if (filter === 'today') {
            query += ' AND CAST(SaleDate AS DATE) = CAST(GETDATE() AS DATE)';
        } 
        else if (filter === 'week') {
            query += ' AND SaleDate >= DATEADD(day, -7, GETDATE())';
        } 
        else if (filter === 'month') {
            query += ' AND SaleDate >= DATEADD(month, -1, GETDATE())';
        } 
        else if (filter === 'custom' && startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            
            query += ' AND SaleDate >= @startDate AND SaleDate <= @endDate';
            request.input('startDate', sql.DateTime, start);
            request.input('endDate', sql.DateTime, end);
        }

        const result = await request.query(query);
        
        // Calculate summary
        let totalRevenue = 0;
        let totalItems = 0;
        const paymentBreakdown = {};
        
        result.recordset.forEach(sale => {
            totalRevenue += sale.Total;
            
            try {
                const items = JSON.parse(sale.ItemsJson);
                items.forEach(item => {
                    totalItems += item.quantity || 0;
                });
            } catch (e) {
                console.error('Error parsing items');
            }
            
            paymentBreakdown[sale.PaymentMethod] = (paymentBreakdown[sale.PaymentMethod] || 0) + sale.Total;
        });

        res.json({
            totalSales: result.recordset.length,
            totalRevenue,
            totalItems,
            paymentBreakdown
        });
    } catch (err) {
        console.error('Error getting sales summary:', err);
        res.status(500).json({ error: err.message });
    }
};



module.exports = {
    createSale,
    getSales,
    getSalesSummary
};