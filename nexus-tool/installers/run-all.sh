#!/bin/bash

# NEXUS Infiltration - Universal Runner
# Detects OS and runs appropriate script

echo "🔍 Detecting operating system..."

case "$(uname -s)" in
    Darwin*)
        echo "🍎 macOS detected"
        bash "$(dirname "$0")/run-mac.sh"
        ;;
    Linux*)
        echo "🐧 Linux detected"
        bash "$(dirname "$0")/run-linux.sh"
        ;;
    CYGWIN*|MINGW*|MSYS*)
        echo "🪟 Windows detected"
        cmd /c "$(dirname "$0")/run-windows.bat"
        ;;
    *)
        echo "❌ Unknown operating system"
        echo "Please run the appropriate script manually:"
        echo "  - Windows: run-windows.bat"
        echo "  - Mac: run-mac.sh"
        echo "  - Linux: run-linux.sh"
        exit 1
        ;;
esac