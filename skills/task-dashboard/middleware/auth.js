/**
 * JWT Authentication Middleware
 */

const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * 生成 JWT Token
 */
function generateToken(payload) {
    return jwt.sign(payload, config.jwtSecret, {
        expiresIn: config.jwtExpiresIn
    });
}

/**
 * 验证 JWT Token
 */
function verifyToken(token) {
    try {
        return jwt.verify(token, config.jwtSecret);
    } catch (err) {
        return null;
    }
}

/**
 * Express 认证中间件
 */
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = decoded;
    next();
}

/**
 * WebSocket 认证
 */
function wsAuthMiddleware(info, cb) {
    const url = new URL(info.req.url, `http://${info.req.headers.host}`);
    const token = url.searchParams.get('token') || info.req.headers['x-auth-token'];

    if (!token) {
        return cb(false, 401, 'No token provided');
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        return cb(false, 401, 'Invalid token');
    }

    info.req.user = decoded;
    cb(true);
}

module.exports = {
    generateToken,
    verifyToken,
    authMiddleware,
    wsAuthMiddleware
};
