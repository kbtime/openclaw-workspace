/**
 * Task Dashboard Server
 */

const express = require('express');
const http = require('http');
const path = require('path');
const config = require('./config');
const { initDatabase, closeDatabase } = require('./db/database');
const { initWebSocket } = require('./websocket/handler');

// 初始化数据库
initDatabase();

// 创建 Express 应用
const app = express();
const server = http.createServer(app);

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件
app.use(express.static(path.join(__dirname, 'public')));

// API 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/cron', require('./routes/cron'));
app.use('/api/records', require('./routes/records'));
app.use('/api/status', require('./routes/status'));

// 登录页
app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// 也支持 /dashboard/login.html
app.get('/dashboard/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// SPA 路由 - 所有非 API、非静态文件路由返回 index.html
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.match(/\.\w+$/)) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } else {
        res.status(404).json({ error: 'Not found' });
    }
});

// 初始化 WebSocket
initWebSocket(server);

// 启动服务器
server.listen(config.port, config.host, () => {
    console.log('');
    console.log('========================================');
    console.log(`📊 Task Dashboard Started`);
    console.log(`   URL: http://localhost:${config.port}`);
    console.log(`   WebSocket: ws://localhost:${config.port}/ws`);
    console.log('========================================');
    console.log('');
});

// 优雅关闭
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down...');
    closeDatabase();
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down...');
    closeDatabase();
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

module.exports = { app, server };
