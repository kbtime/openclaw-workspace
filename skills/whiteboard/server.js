const express = require('express');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3300;
const JWT_SECRET = 'x.738402.xyz.whiteboard.2026';
const JWT_EXPIRES = '24h';

const USERS = [{ username: 'lhong' }];

// 禁用缓存
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    next();
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'), { 
    maxAge: 0,
    etag: false
}));

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: '未授权' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (e) {
        return res.status(401).json({ error: 'Token 无效' });
    }
}

function parseNginxConfig() {
    const services = [
        { id: 1, name: '📊 Task Dashboard', description: '任务看板', url: '/dashboard/', status: 'online' },
        { id: 2, name: '📚 OpenClaw 使用场景', description: '30个使用场景', url: '/usecases/', status: 'online' },
        { id: 3, name: '🧠 知识库方案', description: '本地 RAG 知识库方案', url: '/kb/', status: 'online' }
    ];
    return services;
}

app.post('/wb/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const defaultPassword = '!liao520gao';
    if (username === 'lhong' && password === defaultPassword) {
        const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
        res.json({ token, username, expiresIn: JWT_EXPIRES });
    } else {
        res.status(401).json({ error: '用户名或密码错误' });
    }
});

app.get('/wb/api/auth/verify', authMiddleware, (req, res) => {
    res.json({ valid: true, user: req.user });
});

app.get('/wb/api/services', authMiddleware, (req, res) => {
    res.json(parseNginxConfig());
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Whiteboard: http://localhost:${PORT}`);
});
