#!/usr/bin/env node

/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║                                                                  ║
 * ║     🌐 NEXUS COLLECTOR - Data Collection Server                 ║
 * ║                                                                  ║
 * ║     Secure server for receiving system data from NEXUS tool     ║
 * ║                                                                  ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

// ============================================
// DEPENDENCIES
// ============================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

// ============================================
// CONFIGURATION - All from environment
// ============================================

const CONFIG = {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    
    // Security
    nexusSecret: process.env.NEXUS_SECRET,
    adminPassword: process.env.ADMIN_PASSWORD,
    
    // Rate Limiting
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 60000,
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    
    // Storage
    dataDir: process.env.DATA_DIR || './data',
    maxFileSize: process.env.MAX_FILE_SIZE || '50mb',
    
    // CORS
    corsOrigin: process.env.CORS_ORIGIN || '*',
    
    // Logging
    logLevel: process.env.LOG_LEVEL || 'info'
};

// Validate required configuration
if (!CONFIG.nexusSecret) {
    console.error('❌ NEXUS_SECRET is required. Set it in .env file');
    process.exit(1);
}

if (!CONFIG.adminPassword) {
    console.error('❌ ADMIN_PASSWORD is required. Set it in .env file');
    process.exit(1);
}

// ============================================
// INITIALIZE EXPRESS
// ============================================

const app = express();

// ============================================
// MIDDLEWARE
// ============================================

// Security headers
app.use(helmet({
    contentSecurityPolicy: false // Allow inline scripts for admin dashboard
}));

// CORS
app.use(cors({
    origin: CONFIG.corsOrigin,
    credentials: true
}));

// Compression
app.use(compression());

// Logging
app.use(morgan(CONFIG.nodeEnv === 'production' ? 'combined' : 'dev'));

// Rate limiting
const limiter = rateLimit({
    windowMs: CONFIG.rateLimitWindow,
    max: CONFIG.rateLimitMax,
    message: 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', limiter);

// Body parsing
app.use(express.json({ limit: CONFIG.maxFileSize }));
app.use(express.urlencoded({ extended: true, limit: CONFIG.maxFileSize }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// ============================================
// DATA STORAGE UTILITIES
// ============================================

const DATA_DIR = path.join(__dirname, CONFIG.dataDir);
const SUBMISSIONS_DIR = path.join(DATA_DIR, 'submissions');
const STATS_FILE = path.join(DATA_DIR, 'stats.json');

// Ensure directories exist
async function initializeStorage() {
    try {
        // Create submissions directory
        await fs.mkdir(SUBMISSIONS_DIR, { recursive: true });
        
        // Initialize stats file if it doesn't exist
        try {
            await fs.access(STATS_FILE);
        } catch {
            const initialStats = {
                totalSubmissions: 0,
                uniqueHosts: [],
                submissions: [],
                createdAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
            };
            await fs.writeFile(STATS_FILE, JSON.stringify(initialStats, null, 2));
        }
        
        console.log('📁 Storage initialized successfully');
        console.log(`   📂 Data directory: ${DATA_DIR}`);
        console.log(`   📄 Stats file: ${STATS_FILE}`);
    } catch (error) {
        console.error('❌ Failed to initialize storage:', error.message);
        throw error;
    }
}

// ============================================
// DOWNLOAD ROUTES - One Click Installers
// ============================================

const INSTALLER_DIR = path.join(__dirname, '..', 'nexus-tool', 'installers');

// Serve installer page
app.get('/install', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'installer.html'));
});

// Download Windows installer
app.get('/download/run-windows.bat', (req, res) => {
    res.download(path.join(INSTALLER_DIR, 'run-windows.bat'));
});

// Download Mac installer
app.get('/download/run-mac.sh', (req, res) => {
    res.download(path.join(INSTALLER_DIR, 'run-mac.sh'));
});

// Download Linux installer
app.get('/download/run-linux.sh', (req, res) => {
    res.download(path.join(INSTALLER_DIR, 'run-linux.sh'));
});

// Download universal installer
app.get('/download/run-all.sh', (req, res) => {
    res.download(path.join(INSTALLER_DIR, 'run-all.sh'));
});

// ============================================
// API ROUTES
// ============================================

/**
 * POST /api/collect
 * Receive system data from NEXUS tool
 */
app.post('/api/collect', async (req, res) => {
    try {
        const { secret, ...data } = req.body;
        
        // Verify secret
        if (secret !== CONFIG.nexusSecret) {
            console.warn('⚠️ Invalid secret attempted from:', req.ip);
            return res.status(401).json({
                success: false,
                error: 'Invalid authentication'
            });
        }
        
        // Validate data
        if (!data || Object.keys(data).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No data provided'
            });
        }
        
        // Save submission
        const id = await saveSubmission(data);
        const hostname = data.systemProfile?.hostname || data.hostname || 'unknown';
        
        console.log(`📥 [${id}] Data received from ${hostname}`);
        
        res.json({
            success: true,
            message: 'Data collected successfully',
            id: id,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error collecting data:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * GET /api/stats
 * Get submission statistics (admin only)
 */
app.get('/api/stats', async (req, res) => {
    try {
        const { password } = req.query;
        
        if (password !== CONFIG.adminPassword) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized'
            });
        }
        
        const stats = JSON.parse(await fs.readFile(STATS_FILE, 'utf8'));
        
        // Don't expose full submission details in stats
        const sanitizedStats = {
            totalSubmissions: stats.totalSubmissions,
            uniqueHosts: stats.uniqueHosts.length,
            uniqueHostsList: stats.uniqueHosts,
            lastUpdated: stats.lastUpdated,
            recentSubmissions: stats.submissions.slice(-10).reverse()
        };
        
        res.json({
            success: true,
            data: sanitizedStats
        });
        
    } catch (error) {
        console.error('❌ Error fetching stats:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * GET /api/submissions
 * List all submissions (admin only)
 */
app.get('/api/submissions', async (req, res) => {
    try {
        const { password, limit = 50 } = req.query;
        
        if (password !== CONFIG.adminPassword) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized'
            });
        }
        
        const stats = JSON.parse(await fs.readFile(STATS_FILE, 'utf8'));
        const submissions = stats.submissions.slice(-parseInt(limit)).reverse();
        
        res.json({
            success: true,
            data: submissions
        });
        
    } catch (error) {
        console.error('❌ Error fetching submissions:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * GET /api/submission/:id
 * Get specific submission (admin only)
 */
app.get('/api/submission/:id', async (req, res) => {
    try {
        const { password } = req.query;
        const { id } = req.params;
        
        if (password !== CONFIG.adminPassword) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized'
            });
        }
        
        // Find the submission file
        const files = await fs.readdir(SUBMISSIONS_DIR);
        const file = files.find(f => f.includes(id));
        
        if (!file) {
            return res.status(404).json({
                success: false,
                error: 'Submission not found'
            });
        }
        
        const data = await fs.readFile(path.join(SUBMISSIONS_DIR, file), 'utf8');
        const submission = JSON.parse(data);
        
        res.json({
            success: true,
            data: submission
        });
        
    } catch (error) {
        console.error('❌ Error fetching submission:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0'
    });
});

/**
 * GET /admin
 * Admin dashboard page
 */
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

/**
 * GET /download
 * Redirect to tool download
 */
app.get('/download', (req, res) => {
    // In production, this would redirect to GitHub release or serve a zip
    res.json({
        message: 'Tool download available at: https://github.com/yourusername/nexus-tool'
    });
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('❌ Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// ============================================
// START SERVER
// ============================================

async function startServer() {
    try {
        await initializeStorage();
        
        const server = app.listen(CONFIG.port, () => {
            console.log('\n' + '='.repeat(60));
            console.log('🌐 NEXUS COLLECTOR SERVER');
            console.log('='.repeat(60));
            console.log(`📍 Server running at: http://localhost:${CONFIG.port}`);
            console.log(`📡 Collect endpoint: http://localhost:${CONFIG.port}/api/collect`);
            console.log(`🔐 Admin dashboard: http://localhost:${CONFIG.port}/admin`);
            console.log(`📊 Stats API: http://localhost:${CONFIG.port}/api/stats?password=****`);
            console.log(`🔄 Health check: http://localhost:${CONFIG.port}/api/health`);
            console.log('='.repeat(60));
            console.log(`📁 Data directory: ${DATA_DIR}`);
            console.log(`📊 Total submissions: 0`);
            console.log('='.repeat(60));
            console.log(`✅ Server is ready to receive data!\n`);
        });
        
        // Graceful shutdown
        process.on('SIGTERM', () => {
            console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
            server.close(() => {
                console.log('✅ Server closed');
                process.exit(0);
            });
        });
        
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Start the server
startServer();

// ============================================
// EXPORTS (for testing)
// ============================================

module.exports = { app, CONFIG };