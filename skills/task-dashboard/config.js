/**
 * Task Dashboard Configuration
 */

module.exports = {
    // Server
    port: parseInt(process.env.DASHBOARD_PORT) || 3100,
    host: process.env.DASHBOARD_HOST || '0.0.0.0',

    // JWT
    jwtSecret: process.env.DASHBOARD_JWT_SECRET || generateSecret(),
    jwtExpiresIn: '24h',

    // Database
    database: {
        path: process.env.DASHBOARD_DB_PATH || require('path').join(process.env.HOME, '.openclaw/workspace/data/dashboard.db')
    },

    // WebSocket
    websocket: {
        path: '/ws',
        heartbeatInterval: 30000
    }
};

/**
 * 生成随机密钥
 */
function generateSecret() {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
}
