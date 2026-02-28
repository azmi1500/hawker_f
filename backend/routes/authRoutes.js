// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this';

// Test route
router.get('/test', (req, res) => {
    res.json({ message: 'Auth router is working!' });
});

// REAL LOGIN ROUTE - Replace the test one
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const pool = getPool();
        
        // First, update expired licenses
        await pool.request()
            .query('UPDATE Licenses SET IsActive = 0 WHERE ExpiryDate < GETDATE()');
        
        // Get user with license
        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .query(`
                SELECT u.Id, u.Username, u.PasswordHash, u.Role, u.ShopName, u.FullName, u.Email,
                       l.ExpiryDate, l.IsActive as LicenseActive,
                       DATEDIFF(minute, GETDATE(), l.ExpiryDate) as MinutesRemaining
                FROM Users u
                LEFT JOIN Licenses l ON u.Id = l.UserId
                WHERE u.Username = @username
            `);

        if (result.recordset.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.recordset[0];

        // Check password
        const isMatch = await bcrypt.compare(password, user.PasswordHash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // ✅ FIX: License expired - Return 401 with same message
        if (user.ExpiryDate && new Date(user.ExpiryDate) < new Date()) {
            return res.status(401).json({ 
                error: 'Invalid credentials'  // Same message as wrong password
            });
        }

        // Update last login
        await pool.request()
            .input('userId', sql.Int, user.Id)
            .query('UPDATE Users SET LastLoginDate = GETDATE() WHERE Id = @userId');

        // Create token
        const token = jwt.sign(
            { 
                id: user.Id, 
                username: user.Username, 
                role: user.Role 
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('✅ Login successful for:', user.Username);

        res.json({
    token,
    user: {
        id: user.Id,
        username: user.Username,
        role: user.Role,
        shopName: user.ShopName
    },
    license: {
        expiryDate: user.ExpiryDate,
        minutesRemaining: user.MinutesRemaining
    }
        });
    } catch (err) {
        console.error('❌ Login error:', err);
        res.status(500).json({ error: 'Login failed' });
    }
});

module.exports = router;