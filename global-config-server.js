/**
 * D'Romico's Global Configuration Server Simulation
 * Simple Node.js server to handle global configuration updates
 * This simulates a backend server for true global state management
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
const CONFIG_FILE = 'duratile-config.json';

// CORS headers for cross-origin requests
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
};

// Load configuration from file
function loadConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const data = fs.readFileSync(CONFIG_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading config:', error);
    }
    
    // Return default configuration
    return {
        version: "1.0.0",
        lastUpdated: new Date().toISOString(),
        popup: {
            enabled: true,
            price: 70.00,
            maxDisplays: 3,
            cookieExpireDays: 30,
            popupDelay: 2000,
            message: {
                title: "🎉 Special Promotion!",
                subtitle: "Promotion Sale, Duratile",
                cta: "Contact us for Enquiry",
                buttonPrimary: "Contact Us Now",
                buttonSecondary: "Maybe Later"
            }
        },
        admin: {
            lastModifiedBy: "system",
            changeLog: []
        }
    };
}

// Save configuration to file
function saveConfig(config) {
    try {
        config.lastUpdated = new Date().toISOString();
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
        console.log(`📝 Configuration saved at ${config.lastUpdated}`);
        return true;
    } catch (error) {
        console.error('Error saving config:', error);
        return false;
    }
}

// Create HTTP server
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const method = req.method;
    const pathname = parsedUrl.pathname;

    // Set CORS headers
    Object.keys(corsHeaders).forEach(key => {
        res.setHeader(key, corsHeaders[key]);
    });

    // Handle preflight OPTIONS requests
    if (method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    console.log(`${method} ${pathname} - ${new Date().toLocaleTimeString()}`);

    // Handle configuration requests
    if (pathname === '/duratile-config.json' || pathname === '/config') {
        
        if (method === 'GET') {
            // Return current configuration
            const config = loadConfig();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(config));
            console.log('📤 Configuration sent to client');
            
        } else if (method === 'POST' || method === 'PUT') {
            // Update configuration
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            
            req.on('end', () => {
                try {
                    const updates = JSON.parse(body);
                    const currentConfig = loadConfig();
                    
                    // Merge updates with current configuration
                    const updatedConfig = {
                        ...currentConfig,
                        popup: {
                            ...currentConfig.popup,
                            ...updates.popup
                        },
                        admin: {
                            ...currentConfig.admin,
                            lastModifiedBy: updates.admin?.lastModifiedBy || 'api',
                            changeLog: [
                                ...(currentConfig.admin?.changeLog || []),
                                {
                                    timestamp: new Date().toISOString(),
                                    action: 'api_update',
                                    changes: updates,
                                    source: req.headers['user-agent'] || 'unknown'
                                }
                            ].slice(-10) // Keep only last 10 changes
                        }
                    };
                    
                    if (saveConfig(updatedConfig)) {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ 
                            success: true, 
                            message: 'Configuration updated successfully',
                            config: updatedConfig 
                        }));
                        console.log('✅ Configuration updated:', updates);
                    } else {
                        throw new Error('Failed to save configuration');
                    }
                    
                } catch (error) {
                    console.error('❌ Configuration update error:', error);
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: false, 
                        error: error.message 
                    }));
                }
            });
            
        } else {
            res.writeHead(405, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Method not allowed' }));
        }
        
    } else if (pathname === '/status') {
        // Server status endpoint
        const config = loadConfig();
        const status = {
            server: 'D\'Romico Global Config Server',
            status: 'running',
            timestamp: new Date().toISOString(),
            configLastUpdated: config.lastUpdated,
            version: config.version
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(status));
        
    } else {
        // 404 for other paths
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
    }
});

// Start server
server.listen(PORT, () => {
    console.log('🚀 D\'Romico\'s Global Configuration Server started');
    console.log(`📡 Server running at http://localhost:${PORT}`);
    console.log(`📋 Configuration endpoint: http://localhost:${PORT}/duratile-config.json`);
    console.log(`📊 Status endpoint: http://localhost:${PORT}/status`);
    console.log('');
    console.log('Available endpoints:');
    console.log('  GET  /duratile-config.json - Get current configuration');
    console.log('  POST /duratile-config.json - Update configuration');
    console.log('  GET  /status - Server status');
    console.log('');
    
    // Load initial configuration
    const config = loadConfig();
    console.log('📋 Initial configuration loaded:');
    console.log(`  Popup Enabled: ${config.popup.enabled}`);
    console.log(`  Price: RM${config.popup.price.toFixed(2)}`);
    console.log(`  Last Updated: ${config.lastUpdated}`);
});

// Handle server shutdown gracefully
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    server.close(() => {
        console.log('✅ Server shut down successfully');
        process.exit(0);
    });
});

// Export for testing
module.exports = { server, loadConfig, saveConfig };
