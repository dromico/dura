/**
 * Duratile Promotional Popup System
 * Manages promotional popups with frequency control and price management
 * Enhanced with robust toggle functionality and real-time state management
 */

class DuratilePopupSystem {
    constructor() {
        this.cookieName = 'duratile_popup_count';
        this.cookieExpireDays = 30;
        this.maxDisplays = 3;
        this.storageKey = 'duratile_price_data';
        this.popupDelay = 2000; // 2 seconds delay after page load
        this.isInitialized = false;
        this.debugMode = false; // Set to true for debugging

        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.safeInitialize());
        } else {
            this.safeInitialize();
        }
    }

    // Enhanced initialization with better error handling and state validation
    safeInitialize() {
        try {
            this.log('Initializing Duratile Popup System...');

            // Validate storage accessibility
            if (!this.validateStorageAccess()) {
                this.log('Storage access validation failed', 'error');
                return;
            }

            // Initialize default data if needed
            this.initializeDefaultData();

            // Check and show popup with enhanced validation
            this.checkAndShowPopup();

            this.isInitialized = true;
            this.log('Popup system initialized successfully');

        } catch (error) {
            this.log(`Initialization error: ${error.message}`, 'error');
        }
    }

    // Validate that localStorage is accessible
    validateStorageAccess() {
        try {
            const testKey = 'duratile_test_storage';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            this.log('localStorage not accessible', 'error');
            return false;
        }
    }

    // Initialize default data structure if not present
    initializeDefaultData() {
        const currentData = this.getPriceData();
        if (!currentData.hasOwnProperty('enabled')) {
            this.log('Initializing default enabled state');
            const updatedData = { ...currentData, enabled: true };
            localStorage.setItem(this.storageKey, JSON.stringify(updatedData));
        }
    }

    // Enhanced logging for debugging
    log(message, level = 'info') {
        if (this.debugMode || level === 'error') {
            const timestamp = new Date().toLocaleTimeString();
            const prefix = `[Duratile Popup ${timestamp}]`;

            switch (level) {
                case 'error':
                    console.error(`${prefix} ERROR: ${message}`);
                    break;
                case 'warn':
                    console.warn(`${prefix} WARN: ${message}`);
                    break;
                default:
                    console.log(`${prefix} ${message}`);
            }
        }
    }
    
    // Cookie management functions
    setCookie(name, value, days) {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
    }
    
    getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }
    
    // Get current popup display count
    getPopupCount() {
        const count = this.getCookie(this.cookieName);
        return count ? parseInt(count) : 0;
    }
    
    // Increment popup display count
    incrementPopupCount() {
        const currentCount = this.getPopupCount();
        const newCount = currentCount + 1;
        this.setCookie(this.cookieName, newCount, this.cookieExpireDays);
        
        // Update localStorage statistics
        this.updatePopupStats();
        
        return newCount;
    }
    
    // Update popup statistics in localStorage
    updatePopupStats() {
        try {
            const priceData = this.getPriceData();
            priceData.popupDisplayCount = (priceData.popupDisplayCount || 0) + 1;
            localStorage.setItem(this.storageKey, JSON.stringify(priceData));
        } catch (e) {
            console.error('Error updating popup stats:', e);
        }
    }
    
    // Get price data from localStorage
    getPriceData() {
        const defaultData = {
            price: 25.00, // Default price
            lastUpdated: null,
            popupDisplayCount: 0,
            enabled: true // Default to enabled
        };
        
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? { ...defaultData, ...JSON.parse(stored) } : defaultData;
        } catch (e) {
            console.error('Error loading price data:', e);
            return defaultData;
        }
    }
    
    // Enhanced popup enabled check with detailed logging
    isPopupEnabled() {
        try {
            const priceData = this.getPriceData();
            const isEnabled = priceData.enabled !== false; // Default to enabled if not set

            this.log(`Popup enabled check: ${isEnabled} (raw value: ${priceData.enabled})`);
            return isEnabled;
        } catch (e) {
            this.log(`Error checking popup enabled status: ${e.message}`, 'error');
            return true; // Default to enabled on error
        }
    }

    // Enhanced popup display logic with comprehensive validation
    checkAndShowPopup() {
        this.log('Starting popup display check...');

        // First check if popup is enabled by admin
        const isEnabled = this.isPopupEnabled();
        if (!isEnabled) {
            this.log('Popup disabled by admin - skipping display');
            return;
        }

        // Check frequency control
        const currentCount = this.getPopupCount();
        this.log(`Current popup count: ${currentCount}/${this.maxDisplays}`);

        if (currentCount >= this.maxDisplays) {
            this.log('Maximum popup displays reached - skipping display');
            return;
        }

        // All checks passed - schedule popup display
        this.log(`Scheduling popup display in ${this.popupDelay}ms`);
        setTimeout(() => {
            // Double-check enabled status before showing (in case it changed during delay)
            if (this.isPopupEnabled()) {
                this.showPopup();
            } else {
                this.log('Popup was disabled during delay - cancelling display');
            }
        }, this.popupDelay);
    }

    // Method to dynamically enable popup system
    enablePopup() {
        try {
            const currentData = this.getPriceData();
            const updatedData = { ...currentData, enabled: true };
            localStorage.setItem(this.storageKey, JSON.stringify(updatedData));
            this.log('Popup system enabled');
            return true;
        } catch (error) {
            this.log(`Error enabling popup: ${error.message}`, 'error');
            return false;
        }
    }

    // Method to dynamically disable popup system
    disablePopup() {
        try {
            const currentData = this.getPriceData();
            const updatedData = { ...currentData, enabled: false };
            localStorage.setItem(this.storageKey, JSON.stringify(updatedData));

            // Also close any currently displayed popup
            this.closePopup();

            this.log('Popup system disabled');
            return true;
        } catch (error) {
            this.log(`Error disabling popup: ${error.message}`, 'error');
            return false;
        }
    }

    // Method to toggle popup state
    togglePopup() {
        const currentlyEnabled = this.isPopupEnabled();
        return currentlyEnabled ? this.disablePopup() : this.enablePopup();
    }
    
    // Enhanced popup creation with validation and error handling
    showPopup() {
        this.log('Attempting to show popup...');

        // Prevent multiple popups
        if (document.getElementById('duratile-popup')) {
            this.log('Popup already exists - skipping display');
            return;
        }

        // Final validation before showing
        if (!this.isPopupEnabled()) {
            this.log('Popup disabled during show attempt - aborting');
            return;
        }

        try {
            const priceData = this.getPriceData();
            const price = priceData.price.toFixed(2);

            this.log(`Creating popup with price: RM${price}`);

            // Create popup HTML
            const popupHTML = `
                <div id="duratile-popup" class="duratile-popup-overlay">
                    <div class="duratile-popup-container">
                        <div class="duratile-popup-header">
                            <h2 style="color: #333333;">🎉 Special Promotion!</h2>
                            <button class="duratile-popup-close" onclick="duratilePopup.closePopup()">&times;</button>
                        </div>
                        <div class="duratile-popup-content">
                            <div class="duratile-popup-icon">
                                <img src="img/p4_1.jpg" alt="Duratile" style="width: 80px; height: 80px; border-radius: 8px; object-fit: cover;">
                            </div>
                            <div class="duratile-popup-message">
                                <h3>Promotion Sale, Duratile</h3>
                                <p class="duratile-popup-price">RM${price}/box</p>
                                <p class="duratile-popup-cta">Contact us for Enquiry</p>
                            </div>
                        </div>
                        <div class="duratile-popup-actions">
                            <a href="contact.html#top" class="duratile-popup-btn duratile-popup-btn-primary">Contact Us Now</a>
                            <button class="duratile-popup-btn duratile-popup-btn-secondary" onclick="duratilePopup.closePopup()">Maybe Later</button>
                        </div>
                    </div>
                </div>
            `;

            // Add popup to page
            document.body.insertAdjacentHTML('beforeend', popupHTML);

            // Add event listeners
            this.setupPopupEventListeners();

            // Show popup with animation
            setTimeout(() => {
                const popup = document.getElementById('duratile-popup');
                if (popup) {
                    popup.classList.add('duratile-popup-show');
                    this.log('Popup displayed successfully');
                }
            }, 100);

            // Increment display count
            this.incrementPopupCount();

        } catch (error) {
            this.log(`Error creating popup: ${error.message}`, 'error');
        }
    }
    
    // Setup event listeners for popup
    setupPopupEventListeners() {
        const popup = document.getElementById('duratile-popup');
        if (!popup) return;
        
        // Close on overlay click
        popup.addEventListener('click', (e) => {
            if (e.target === popup) {
                this.closePopup();
            }
        });
        
        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closePopup();
            }
        });
    }
    
    // Enhanced popup closing with logging
    closePopup() {
        const popup = document.getElementById('duratile-popup');
        if (popup) {
            this.log('Closing popup');
            popup.classList.add('duratile-popup-hide');
            setTimeout(() => {
                popup.remove();
                this.log('Popup removed from DOM');
            }, 300);
        } else {
            this.log('No popup found to close');
        }
    }

    // Method to get current system status for debugging
    getSystemStatus() {
        return {
            isInitialized: this.isInitialized,
            isEnabled: this.isPopupEnabled(),
            currentCount: this.getPopupCount(),
            maxDisplays: this.maxDisplays,
            priceData: this.getPriceData(),
            hasActivePopup: !!document.getElementById('duratile-popup')
        };
    }

    // Method to reset popup count (for testing/admin purposes)
    resetPopupCount() {
        try {
            this.setCookie(this.cookieName, '0', this.cookieExpireDays);
            this.log('Popup count reset to 0');
            return true;
        } catch (error) {
            this.log(`Error resetting popup count: ${error.message}`, 'error');
            return false;
        }
    }

    // Method to force show popup (for testing purposes)
    forceShowPopup() {
        this.log('Force showing popup (bypassing frequency control)');

        // Temporarily reset count
        const originalCount = this.getPopupCount();
        this.setCookie(this.cookieName, '0', this.cookieExpireDays);

        // Show popup
        this.showPopup();

        // Restore original count (minus 1 since showPopup increments it)
        this.setCookie(this.cookieName, originalCount.toString(), this.cookieExpireDays);
    }

    // Enable debug mode
    enableDebugMode() {
        this.debugMode = true;
        this.log('Debug mode enabled');
    }

    // Disable debug mode
    disableDebugMode() {
        this.debugMode = false;
        console.log('[Duratile Popup] Debug mode disabled');
    }
}

// Initialize popup system
const duratilePopup = new DuratilePopupSystem();

// Expose debug methods globally for console access
window.duratilePopupDebug = {
    getStatus: () => duratilePopup.getSystemStatus(),
    enable: () => duratilePopup.enablePopup(),
    disable: () => duratilePopup.disablePopup(),
    toggle: () => duratilePopup.togglePopup(),
    reset: () => duratilePopup.resetPopupCount(),
    forceShow: () => duratilePopup.forceShowPopup(),
    enableDebug: () => duratilePopup.enableDebugMode(),
    disableDebug: () => duratilePopup.disableDebugMode()
};
