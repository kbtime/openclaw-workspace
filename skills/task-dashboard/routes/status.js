/**
 * System Status API Routes
 */

const express = require('express');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { getDb } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

const WORKSPACE_PATH = path.join(process.env.HOME, '.openclaw/workspace');

/**
 * GET /api/status - 获取系统状态
 */
router.get('/', (req, res) => {
    const status = {
        tokens: checkTokens(),
        gateway: checkGateway(),
        services: checkServices(),
        lastUpdate: new Date().toISOString()
    };

    res.json(status);
});

/**
 * 检查 Token 状态
 */
function checkTokens() {
    const tokens = {};

    // User Token
    const userTokenPath = path.join(WORKSPACE_PATH, 'lib/feishu-user-token.json');
    if (fs.existsSync(userTokenPath)) {
        try {
            const data = JSON.parse(fs.readFileSync(userTokenPath, 'utf-8'));
            const expiresAt = data.expiresAt;
            const now = Date.now();
            const remainingMs = expiresAt - now;
            const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
            const remainingMins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

            tokens.userToken = {
                valid: remainingMs > 0,
                expiresAt: new Date(expiresAt).toISOString(),
                remaining: remainingMs > 0 ? `${remainingHours}h ${remainingMins}m` : 'Expired'
            };
        } catch (e) {
            tokens.userToken = { valid: false, error: e.message };
        }
    }

    // Tenant Token
    const tenantTokenPath = path.join(WORKSPACE_PATH, 'lib/feishu-tenant-token.json');
    if (fs.existsSync(tenantTokenPath)) {
        try {
            const data = JSON.parse(fs.readFileSync(tenantTokenPath, 'utf-8'));
            const expiresAt = data.expiresAt;
            const now = Date.now();

            tokens.tenantToken = {
                valid: expiresAt > now,
                expiresAt: new Date(expiresAt).toISOString()
            };
        } catch (e) {
            tokens.tenantToken = { valid: false, error: e.message };
        }
    }

    return tokens;
}

/**
 * 检查 Gateway 状态
 */
function checkGateway() {
    try {
        // 检查进程是否在运行
        const output = execSync('ps aux | grep "openclaw-gateway" | grep -v grep', { encoding: 'utf-8' });
        const running = output.includes('openclaw-gateway');
        
        // 检查端口是否在监听
        const portCheck = execSync('ss -tlnp 2>/dev/null | grep "18789"', { encoding: 'utf-8' });
        const portListening = portCheck.includes('18789');
        
        return {
            running: running && portListening,
            raw: running ? 'Gateway is running (PID from process list)' : 'Not running'
        };
    } catch (e) {
        return {
            running: false,
            error: e.message
        };
    }
}

/**
 * 检查其他服务
 */
function checkServices() {
    const services = {};

    // 检查常见服务
    const checks = [
        { name: 'nginx', cmd: 'systemctl is-active nginx' },
        { name: 'docker', cmd: 'systemctl is-active docker' }
    ];

    for (const check of checks) {
        try {
            const output = execSync(check.cmd + ' 2>/dev/null', { encoding: 'utf-8' });
            services[check.name] = {
                running: output.trim() === 'active'
            };
        } catch (e) {
            services[check.name] = { running: false };
        }
    }

    return services;
}

module.exports = router;
