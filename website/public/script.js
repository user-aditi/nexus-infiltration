/**
 * NEXUS Landing Page - Frontend Logic
 */

// ============================================
// DOM Ready
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('⚡ NEXUS Landing Page loaded');
    
    // Add smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Animate terminal typing effect
    animateTerminal();
    
    // Check server status
    checkServerStatus();
});

// ============================================
// Terminal Animation
// ============================================

function animateTerminal() {
    const lines = document.querySelectorAll('.terminal-line.output');
    let delay = 0;
    
    lines.forEach((line, index) => {
        setTimeout(() => {
            line.style.opacity = '1';
            line.style.transform = 'translateY(0)';
        }, 500 + (index * 200));
        
        // Initial state (hidden)
        line.style.opacity = '0';
        line.style.transform = 'translateY(10px)';
        line.style.transition = 'all 0.3s ease';
    });
}

// ============================================
// Server Status Check
// ============================================

async function checkServerStatus() {
    try {
        const response = await fetch('/api/health');
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Server is healthy:', data);
            
            // Add status indicator if exists
            const statusElement = document.querySelector('.server-status');
            if (statusElement) {
                statusElement.textContent = '🟢 Online';
                statusElement.style.color = 'var(--accent-green)';
            }
        }
    } catch (error) {
        console.log('ℹ️ Server status check: Offline (expected for static sites)');
    }
}

// ============================================
// Download Tracking
// ============================================

document.querySelectorAll('.btn-download, .nav-download').forEach(btn => {
    btn.addEventListener('click', () => {
        console.log('📥 Download clicked');
        // You can add analytics here
        // Example: ga('send', 'event', 'Download', 'click');
    });
});

// ============================================
// Smooth Scroll Progress
// ============================================

window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = (scrolled / maxScroll) * 100;
    
    // Update scroll progress bar if exists
    const progressBar = document.querySelector('.scroll-progress');
    if (progressBar) {
        progressBar.style.width = `${progress}%`;
    }
});

console.log('🚀 NEXUS Landing Page - Ready!');