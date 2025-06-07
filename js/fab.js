/**
 * Floating Action Button (FAB) Enhanced Interactions
 * Provides additional functionality for the promotional FAB
 */

(function() {
    'use strict';
    
    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', function() {
        const fab = document.querySelector('.fab');
        
        if (!fab) return;
        
        // Add click analytics tracking (if Google Analytics is available)
        fab.addEventListener('click', function(e) {
            // Track FAB click in Google Analytics if available
            if (typeof gtag !== 'undefined') {
                gtag('event', 'click', {
                    'event_category': 'FAB',
                    'event_label': 'Duratile XL Marbling Floor Tile',
                    'value': 1
                });
            }
            
            // Add a subtle click effect
            fab.style.transform = 'translateY(0) scale(0.95)';
            setTimeout(function() {
                fab.style.transform = '';
            }, 150);
        });
        
        // Add keyboard navigation support
        fab.addEventListener('keydown', function(e) {
            // Activate on Enter or Space key
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fab.click();
            }
        });
        
        // Pause pulse animation on hover for better UX
        fab.addEventListener('mouseenter', function() {
            fab.style.setProperty('--pulse-animation', 'paused');
        });
        
        fab.addEventListener('mouseleave', function() {
            fab.style.setProperty('--pulse-animation', 'running');
        });
        
        // Hide FAB when scrolling up, show when scrolling down (optional enhancement)
        let lastScrollTop = 0;
        let scrollTimeout;
        
        window.addEventListener('scroll', function() {
            clearTimeout(scrollTimeout);
            
            scrollTimeout = setTimeout(function() {
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                
                // Only apply scroll behavior on mobile devices
                if (window.innerWidth <= 768) {
                    if (scrollTop > lastScrollTop && scrollTop > 100) {
                        // Scrolling down - hide FAB
                        fab.style.transform = 'translateY(100px)';
                        fab.style.opacity = '0.7';
                    } else {
                        // Scrolling up or at top - show FAB
                        fab.style.transform = '';
                        fab.style.opacity = '1';
                    }
                }
                
                lastScrollTop = scrollTop;
            }, 100);
        });
        
        // Add intersection observer to show FAB only when main content is visible
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        fab.style.display = 'flex';
                    }
                });
            }, {
                threshold: 0.1
            });
            
            const mainContent = document.querySelector('section');
            if (mainContent) {
                observer.observe(mainContent);
            }
        }
        
        // Add touch feedback for mobile devices
        if ('ontouchstart' in window) {
            fab.addEventListener('touchstart', function() {
                fab.style.transform = 'translateY(-2px) scale(1.02)';
            });
            
            fab.addEventListener('touchend', function() {
                setTimeout(function() {
                    fab.style.transform = '';
                }, 150);
            });
        }
    });
})();
