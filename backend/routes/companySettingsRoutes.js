// backend/routes/companySettingsRoutes.js - CREATE THIS FILE

const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// GET company settings for a user
router.get('/:userId', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const loggedInUserId = req.user.id;
        
        // Security check
        if (parseInt(userId) !== loggedInUserId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const pool = getPool();
        
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .query(`
                SELECT 
                    CompanyName,
                    Address,
                    GSTNo,
                    GSTPercentage,
                    Phone,
                    Email,
                    CashierName
                FROM CompanySettings 
                WHERE UserId = @userId
            `);
        
        if (result.recordset.length === 0) {
            // Create default settings if none exist
            await pool.request()
                .input('userId', sql.Int, userId)
                .input('companyName', sql.NVarChar, 'POS System')
                .input('address', sql.NVarChar, '')
                .input('gstNo', sql.NVarChar, '')
                .input('gstPercentage', sql.Decimal(5,2), 0)
                .input('phone', sql.NVarChar, '')
                .input('email', sql.NVarChar, '')
                .input('cashierName', sql.NVarChar, 'Admin')
                .query(`
                    INSERT INTO CompanySettings 
                    (UserId, CompanyName, Address, GSTNo, GSTPercentage, Phone, Email, CashierName)
                    VALUES (@userId, @companyName, @address, @gstNo, @gstPercentage, @phone, @email, @cashierName)
                `);
            
            return res.json({
                success: true,
                settings: {
                    CompanyName: 'POS System',
                    Address: '',
                    GSTNo: '',
                    GSTPercentage: 0,
                    Phone: '',
                    Email: '',
                    CashierName: 'Admin'
                }
            });
        }
        
        res.json({
            success: true,
            settings: result.recordset[0]
        });
        
    } catch (err) {
        console.error('❌ Error getting settings:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST (create/update) company settings
router.post('/:userId', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const loggedInUserId = req.user.id;
        
        // Security check
        if (parseInt(userId) !== loggedInUserId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const { 
            CompanyName, 
            Address, 
            GSTNo, 
            GSTPercentage, 
            Phone, 
            Email, 
            CashierName 
        } = req.body;
        
        const pool = getPool();
        
        // Check if settings exist
        const exists = await pool.request()
            .input('userId', sql.Int, userId)
            .query('SELECT Id FROM CompanySettings WHERE UserId = @userId');
        
        if (exists.recordset.length > 0) {
            // Update
            await pool.request()
                .input('userId', sql.Int, userId)
                .input('companyName', sql.NVarChar, CompanyName || 'POS System')
                .input('address', sql.NVarChar, Address || '')
                .input('gstNo', sql.NVarChar, GSTNo || '')
                .input('gstPercentage', sql.Decimal(5,2), GSTPercentage || 0)
                .input('phone', sql.NVarChar, Phone || '')
                .input('email', sql.NVarChar, Email || '')
                .input('cashierName', sql.NVarChar, CashierName || 'Admin')
                .query(`
                    UPDATE CompanySettings 
                    SET CompanyName = @companyName,
                        Address = @address,
                        GSTNo = @gstNo,
                        GSTPercentage = @gstPercentage,
                        Phone = @phone,
                        Email = @email,
                        CashierName = @cashierName
                    WHERE UserId = @userId
                `);
        } else {
            // Insert
            await pool.request()
                .input('userId', sql.Int, userId)
                .input('companyName', sql.NVarChar, CompanyName || 'POS System')
                .input('address', sql.NVarChar, Address || '')
                .input('gstNo', sql.NVarChar, GSTNo || '')
                .input('gstPercentage', sql.Decimal(5,2), GSTPercentage || 0)
                .input('phone', sql.NVarChar, Phone || '')
                .input('email', sql.NVarChar, Email || '')
                .input('cashierName', sql.NVarChar, CashierName || 'Admin')
                .query(`
                    INSERT INTO CompanySettings 
                    (UserId, CompanyName, Address, GSTNo, GSTPercentage, Phone, Email, CashierName)
                    VALUES (@userId, @companyName, @address, @gstNo, @gstPercentage, @phone, @email, @cashierName)
                `);
        }
        
        res.json({ 
            success: true, 
            message: 'Company settings saved successfully' 
        });
        
    } catch (err) {
        console.error('❌ Error saving settings:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;