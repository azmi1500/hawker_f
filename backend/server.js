// backend/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./config/db');
const { authenticateToken } = require('./middleware/auth');
const startLicenseUpdater = require('./cron/licenseUpdater');
// Import routes
const authRoutes = require('./routes/authRoutes');
const dishGroupRoutes = require('./routes/dishGroupRoutes');
const dishItemRoutes = require('./routes/dishItemRoutes');
const salesRoutes = require('./routes/salesRoutes');
const startLicenseChecker = require('./utils/licenseCron');
const adminRoutes = require('./routes/adminRoutes');
const companySettingsRoutes = require('./routes/companySettingsRoutes');  
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Log all requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    console.log('Headers:', req.headers['content-type']);
    if (req.method === 'POST' || req.method === 'PUT') {
        console.log('Body:', req.body);
    }
    next();
});

// ✅ PUBLIC ROUTES - NO AUTH REQUIRED
app.use('/api/auth', authRoutes);

app.use('/api/admin', authenticateToken, adminRoutes);
app.use('/api/license', authenticateToken, adminRoutes);
app.use('/api/license', authenticateToken, require('./routes/adminRoutes'));
// ✅ PROTECTED ROUTES - AUTH REQUIRED
app.use('/api/dishgroups', authenticateToken, dishGroupRoutes);
app.use('/api/dishitems', authenticateToken, dishItemRoutes);
app.use('/api/sales', authenticateToken, salesRoutes);
app.use('/api/company-settings', authenticateToken, companySettingsRoutes); 
app.get('/api/user/upi/:userId', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const pool = await connectDB();
        
        const result = await pool.request()
            .input('userId', userId)
            .query('SELECT upi_id FROM users WHERE id = @userId');
        
        res.json({ 
            upiId: result.recordset[0]?.upi_id || null 
        });
    } catch (error) {
        console.error('Error fetching UPI ID:', error);
        res.status(500).json({ error: error.message });
    }
});
// server.js - Add these endpoints

// Get user payment modes
app.get('/api/user/payment-modes/:userId', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const pool = await connectDB();
        
        const result = await pool.request()
            .input('userId', userId)
            .query('SELECT payment_modes FROM user_preferences WHERE user_id = @userId');
        
        const modes = result.recordset[0]?.payment_modes 
            ? JSON.parse(result.recordset[0].payment_modes) 
            : [];
        
        res.json({ paymentModes: modes });
    } catch (error) {
        console.error('Error fetching payment modes:', error);
        res.status(500).json({ error: error.message });
    }
});

// UPDATE user payment modes
app.put('/api/user/payment-modes', authenticateToken, async (req, res) => {
    try {
        const { userId, paymentModes } = req.body;
        const pool = await connectDB();
        
        // Check if user preference exists
        const exists = await pool.request()
            .input('userId', userId)
            .query('SELECT id FROM user_preferences WHERE user_id = @userId');
        
        const modesJson = JSON.stringify(paymentModes);
        
        if (exists.recordset.length > 0) {
            // Update
            await pool.request()
                .input('userId', userId)
                .input('paymentModes', modesJson)
                .input('updatedAt', new Date())
                .query('UPDATE user_preferences SET payment_modes = @paymentModes, updated_at = @updatedAt WHERE user_id = @userId');
        } else {
            // Insert
            await pool.request()
                .input('userId', userId)
                .input('paymentModes', modesJson)
                .query('INSERT INTO user_preferences (user_id, payment_modes) VALUES (@userId, @paymentModes)');
        }
        
        res.json({ success: true, paymentModes });
    } catch (error) {
        console.error('Error updating payment modes:', error);
        res.status(500).json({ error: error.message });
    }
});
app.put('/api/user/update-upi', authenticateToken, async (req, res) => {
    try {
        const { userId, upiId } = req.body;
        const pool = await connectDB();
        
        await pool.request()
            .input('userId', userId)
            .input('upiId', upiId)
            .query('UPDATE users SET upi_id = @upiId WHERE id = @userId');
        
        res.json({ 
            success: true, 
            message: 'UPI ID updated successfully',
            upiId 
        });
    } catch (error) {
        console.error('Error updating UPI ID:', error);
        res.status(500).json({ error: error.message });
    }
});
// Test route
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'Server is working!',
        time: new Date().toISOString(),
        routes: {
            auth: '/api/auth/login',
            dishgroups: '/api/dishgroups',
            dishitems: '/api/dishitems',
            sales: '/api/sales'
        }
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err);
    res.status(500).json({ error: err.message });
});

// Start server
connectDB().then(() => {
      startLicenseUpdater(); 
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`✅ Server running on port ${PORT}`);
        console.log(`📍 Local: http://localhost:${PORT}`);
        console.log(`📍 Network: http://192.168.0.243:${PORT}`);
        console.log(`📍 Test: http://localhost:${PORT}/api/test`);
        console.log(`📍 Auth: http://localhost:${PORT}/api/auth/login`);
    });
}).catch(err => {
    console.error('❌ Failed to start server:', err);
});