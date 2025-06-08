/**
 * Duratile Promotional Popup System
 * Enhanced with global configuration management and cross-browser synchronization
 * Manages promotional popups with frequency control and price management
 * D'Romico's Master Architecture - Global State Management Solution
 */

class DuratilePopupSystem {
    constructor() {
        // Configuration sources (priority order)
        this.configUrl = 'duratile-config.json';
        this.storageKey = 'duratile_price_data';
        this.configCacheKey = 'duratile_config_cache';
        this.broadcastChannelName = 'duratile-popup-sync';

        // Default configuration (fallback)
        this.defaultConfig = {
            cookieName: 'duratile_popup_count',
            cookieExpireDays: 30,
            maxDisplays: 3,
            popupDelay: 2000,
            enabled: true,
            price: 70.00
        };

        // Runtime state
        this.config = { ...this.defaultConfig };
        this.isInitialized = false;
        this.debugMode = false;
        this.broadcastChannel = null;
        this.configLastFetched = 0;
        this.configCacheTTL = 300000; // 5 minutes

        this.init();
    }

    async init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.safeInitialize());
        } else {
            await this.safeInitialize();
        }
    }

    // Enhanced initialization with global configuration loading
    async safeInitialize() {
        try {
            this.log('🚀 Initializing D\'Romico\'s Global Popup System...');

            // Validate storage accessibility
            if (!this.validateStorageAccess()) {
                this.log('Storage access validation failed', 'error');
                return;
            }

            // Initialize cross-tab communication
            this.initializeBroadcastChannel();

            // Load global configuration
            await this.loadGlobalConfiguration();

            // Initialize default data if needed
            this.initializeDefaultData();

            // Setup storage event listeners for cross-browser sync
            this.setupStorageEventListeners();

            // Check and show popup with enhanced validation
            this.checkAndShowPopup();

            this.isInitialized = true;
            this.log('✅ Global popup system initialized successfully');

        } catch (error) {
            this.log(`❌ Initialization error: ${error.message}`, 'error');
            // Fallback to local configuration
            this.initializeDefaultData();
            this.checkAndShowPopup();
        }
    }

    // Initialize BroadcastChannel for cross-tab communication
    initializeBroadcastChannel() {
        try {
            if ('BroadcastChannel' in window) {
                this.broadcastChannel = new BroadcastChannel(this.broadcastChannelName);
                this.broadcastChannel.addEventListener('message', (event) => {
                    this.handleBroadcastMessage(event.data);
                });
                this.log('📡 BroadcastChannel initialized for cross-tab sync');
            } else {
                this.log('⚠️ BroadcastChannel not supported, using storage events only');
            }
        } catch (error) {
            this.log(`BroadcastChannel initialization error: ${error.message}`, 'warn');
        }
    }

    // Load global configuration from external JSON
    async loadGlobalConfiguration() {
        try {
            // Check cache first
            const cachedConfig = this.getCachedConfig();
            if (cachedConfig && this.isCacheValid()) {
                this.config = { ...this.defaultConfig, ...cachedConfig };
                this.log('📋 Using cached global configuration');
                return;
            }

            this.log('🌐 Fetching global configuration...');
            const response = await fetch(this.configUrl + '?t=' + Date.now());

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const globalConfig = await response.json();

            // Validate and merge configuration
            if (this.validateGlobalConfig(globalConfig)) {
                this.config = this.mergeConfigurations(globalConfig);
                this.cacheConfig(globalConfig);
                this.configLastFetched = Date.now();
                this.log('✅ Global configuration loaded successfully');

                // Broadcast configuration update to other tabs
                this.broadcastConfigUpdate(globalConfig);
            } else {
                throw new Error('Invalid global configuration format');
            }

        } catch (error) {
            this.log(`⚠️ Failed to load global config: ${error.message}`, 'warn');
            this.log('📋 Falling back to local configuration');

            // Try to load from localStorage as fallback
            const localData = this.getPriceData();
            this.config = { ...this.defaultConfig, ...localData };
        }
    }

    // Configuration management methods
    getCachedConfig() {
        try {
            const cached = localStorage.getItem(this.configCacheKey);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            this.log(`Error reading cached config: ${error.message}`, 'warn');
            return null;
        }
    }

    isCacheValid() {
        return (Date.now() - this.configLastFetched) < this.configCacheTTL;
    }

    cacheConfig(config) {
        try {
            const cacheData = {
                config: config,
                timestamp: Date.now()
            };
            localStorage.setItem(this.configCacheKey, JSON.stringify(cacheData));
        } catch (error) {
            this.log(`Error caching config: ${error.message}`, 'warn');
        }
    }

    validateGlobalConfig(config) {
        return config &&
               config.popup &&
               typeof config.popup.enabled === 'boolean' &&
               typeof config.popup.price === 'number' &&
               config.popup.price >= 0;
    }

    mergeConfigurations(globalConfig) {
        return {
            ...this.defaultConfig,
            enabled: globalConfig.popup.enabled,
            price: globalConfig.popup.price,
            maxDisplays: globalConfig.popup.maxDisplays || this.defaultConfig.maxDisplays,
            cookieExpireDays: globalConfig.popup.cookieExpireDays || this.defaultConfig.cookieExpireDays,
            popupDelay: globalConfig.popup.popupDelay || this.defaultConfig.popupDelay,
            cookieName: globalConfig.popup.cookieName || this.defaultConfig.cookieName
        };
    }

    // Cross-tab communication
    broadcastConfigUpdate(config) {
        if (this.broadcastChannel) {
            this.broadcastChannel.postMessage({
                type: 'CONFIG_UPDATE',
                config: config,
                timestamp: Date.now()
            });
            this.log('📡 Configuration update broadcasted to other tabs');
        }
    }

    handleBroadcastMessage(data) {
        try {
            if (data.type === 'CONFIG_UPDATE') {
                this.log('📡 Received configuration update from another tab');
                const globalConfig = data.config;
                if (this.validateGlobalConfig(globalConfig)) {
                    this.config = this.mergeConfigurations(globalConfig);
                    this.cacheConfig(globalConfig);

                    // Update local storage for backward compatibility
                    this.updateLocalStorage();

                    // Close existing popup if disabled
                    if (!this.config.enabled) {
                        this.closePopup();
                    }
                }
            }
        } catch (error) {
            this.log(`Error handling broadcast message: ${error.message}`, 'error');
        }
    }

    // Setup storage event listeners for cross-browser synchronization
    setupStorageEventListeners() {
        window.addEventListener('storage', (event) => {
            if (event.key === this.storageKey || event.key === this.configCacheKey) {
                this.log('💾 Storage change detected, updating configuration');
                this.loadGlobalConfiguration();
            }
        });
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
            const updatedData = { ...currentData, enabled: this.config.enabled, price: this.config.price };
            localStorage.setItem(this.storageKey, JSON.stringify(updatedData));
        }
    }

    // Update localStorage with current configuration
    updateLocalStorage() {
        try {
            const currentData = this.getPriceData();
            const updatedData = {
                ...currentData,
                enabled: this.config.enabled,
                price: this.config.price,
                lastUpdated: new Date().toLocaleString()
            };
            localStorage.setItem(this.storageKey, JSON.stringify(updatedData));
        } catch (error) {
            this.log(`Error updating localStorage: ${error.message}`, 'error');
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
        const count = this.getCookie(this.config.cookieName);
        return count ? parseInt(count) : 0;
    }

    // Increment popup display count
    incrementPopupCount() {
        const currentCount = this.getPopupCount();
        const newCount = currentCount + 1;
        this.setCookie(this.config.cookieName, newCount, this.config.cookieExpireDays);

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
    
    // Get price data from localStorage (with global config integration)
    getPriceData() {
        const defaultData = {
            price: this.config.price,
            lastUpdated: null,
            popupDisplayCount: 0,
            enabled: this.config.enabled
        };

        try {
            const stored = localStorage.getItem(this.storageKey);
            const localData = stored ? JSON.parse(stored) : {};

            // Merge with global configuration (global config takes precedence)
            return {
                ...defaultData,
                ...localData,
                enabled: this.config.enabled, // Always use global config for enabled state
                price: this.config.price      // Always use global config for price
            };
        } catch (e) {
            this.log(`Error loading price data: ${e.message}`, 'error');
            return defaultData;
        }
    }

    // Enhanced popup enabled check with global configuration
    isPopupEnabled() {
        try {
            // Use global configuration as primary source
            const isEnabled = this.config.enabled;

            this.log(`🔍 Popup enabled check: ${isEnabled} (source: global config)`);
            return isEnabled;
        } catch (e) {
            this.log(`❌ Error checking popup enabled status: ${e.message}`, 'error');
            return true; // Default to enabled on error
        }
    }

    // Enhanced popup display logic with global configuration validation
    checkAndShowPopup() {
        this.log('🔍 Starting popup display check...');

        // First check if popup is enabled by global admin configuration
        const isEnabled = this.isPopupEnabled();
        if (!isEnabled) {
            this.log('🚫 Popup disabled by global admin configuration - skipping display');
            return;
        }

        // Check frequency control using global configuration
        const currentCount = this.getPopupCount();
        this.log(`📊 Current popup count: ${currentCount}/${this.config.maxDisplays}`);

        if (currentCount >= this.config.maxDisplays) {
            this.log('⏰ Maximum popup displays reached - skipping display');
            return;
        }

        // All checks passed - schedule popup display
        this.log(`⏱️ Scheduling popup display in ${this.config.popupDelay}ms`);
        setTimeout(() => {
            // Double-check enabled status before showing (in case it changed during delay)
            if (this.isPopupEnabled()) {
                this.showPopup();
            } else {
                this.log('🚫 Popup was disabled during delay - cancelling display');
            }
        }, this.config.popupDelay);
    }

    // Method to dynamically enable popup system (updates global config)
    async enablePopup() {
        try {
            this.config.enabled = true;
            await this.updateGlobalConfiguration({ enabled: true });
            this.updateLocalStorage();
            this.broadcastConfigUpdate({ popup: this.config });
            this.log('✅ Popup system enabled globally');
            return true;
        } catch (error) {
            this.log(`❌ Error enabling popup: ${error.message}`, 'error');
            return false;
        }
    }

    // Method to dynamically disable popup system (updates global config)
    async disablePopup() {
        try {
            this.config.enabled = false;
            await this.updateGlobalConfiguration({ enabled: false });
            this.updateLocalStorage();

            // Also close any currently displayed popup
            this.closePopup();

            this.broadcastConfigUpdate({ popup: this.config });
            this.log('🚫 Popup system disabled globally');
            return true;
        } catch (error) {
            this.log(`❌ Error disabling popup: ${error.message}`, 'error');
            return false;
        }
    }

    // Method to toggle popup state
    async togglePopup() {
        const currentlyEnabled = this.isPopupEnabled();
        return currentlyEnabled ? await this.disablePopup() : await this.enablePopup();
    }

    // Method to update price globally
    async updatePrice(newPrice) {
        try {
            if (typeof newPrice !== 'number' || newPrice < 0) {
                throw new Error('Invalid price value');
            }

            this.config.price = newPrice;
            await this.updateGlobalConfiguration({ price: newPrice });
            this.updateLocalStorage();
            this.broadcastConfigUpdate({ popup: this.config });
            this.log(`💰 Price updated globally to RM${newPrice.toFixed(2)}`);
            return true;
        } catch (error) {
            this.log(`❌ Error updating price: ${error.message}`, 'error');
            return false;
        }
    }

    // Update global configuration file (simulated - in real implementation would POST to server)
    async updateGlobalConfiguration(updates) {
        try {
            // In a real implementation, this would POST to a server endpoint
            // For now, we'll update the local cache and broadcast the change
            const cachedConfig = this.getCachedConfig();
            if (cachedConfig && cachedConfig.config) {
                const updatedConfig = {
                    ...cachedConfig.config,
                    popup: {
                        ...cachedConfig.config.popup,
                        ...updates,
                        lastUpdated: new Date().toISOString()
                    },
                    admin: {
                        ...cachedConfig.config.admin,
                        lastModifiedBy: 'admin',
                        changeLog: [
                            ...(cachedConfig.config.admin?.changeLog || []),
                            {
                                timestamp: new Date().toISOString(),
                                action: 'update',
                                changes: updates
                            }
                        ]
                    }
                };

                this.cacheConfig(updatedConfig);
                this.log('🌐 Global configuration updated (cached)');
            }

            return true;
        } catch (error) {
            this.log(`❌ Error updating global configuration: ${error.message}`, 'error');
            return false;
        }
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
            const price = this.config.price.toFixed(2);

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
            this.setCookie(this.config.cookieName, '0', this.config.cookieExpireDays);
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
        this.setCookie(this.config.cookieName, '0', this.config.cookieExpireDays);

        // Show popup
        this.showPopup();

        // Restore original count (minus 1 since showPopup increments it)
        this.setCookie(this.config.cookieName, originalCount.toString(), this.config.cookieExpireDays);
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
    updatePrice: (price) => duratilePopup.updatePrice(price),
    reset: () => duratilePopup.resetPopupCount(),
    forceShow: () => duratilePopup.forceShowPopup(),
    enableDebug: () => duratilePopup.enableDebugMode(),
    disableDebug: () => duratilePopup.disableDebugMode(),
    reloadConfig: () => duratilePopup.loadGlobalConfiguration(),
    getConfig: () => duratilePopup.config
};
