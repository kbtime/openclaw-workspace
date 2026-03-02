/**
 * Authentication Routes
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../db/database');
const { generateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/auth/login
 */
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    const db = getDb();
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    const user = stmt.get(username);

    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken({
        id: user.id,
        username: user.username
    });

    res.json({
        success: true,
        token,
        user: {
            id: user.id,
            username: user.username
        }
    });
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', (req, res) => {
    res.json({ success: true });
});

/**
 * GET /api/auth/me
 */
router.get('/me', require('../middleware/auth').authMiddleware, (req, res) => {
    res.json({
        user: req.user
    });
});

/**
 * POST /api/auth/change-password
 */
router.post('/change-password', require('../middleware/auth').authMiddleware, (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ error: 'Old and new password required' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const db = getDb();

    // 验证旧密码
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    const user = stmt.get(userId);

    if (!user || !bcrypt.compareSync(oldPassword, user.password_hash)) {
        return res.status(401).json({ error: 'Invalid old password' });
    }

    // 更新密码
    const newPasswordHash = bcrypt.hashSync(newPassword, 10);
    const update = db.prepare('UPDATE users SET password_hash = ? WHERE id = ?');
    update.run(newPasswordHash, userId);

    res.json({ success: true, message: 'Password changed' });
});

module.exports = router;
