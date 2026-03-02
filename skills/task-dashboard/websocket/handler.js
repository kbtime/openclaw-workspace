/**
 * WebSocket Handler
 */

const WebSocket = require('ws');
const { verifyToken } = require('../middleware/auth');
const { getDb } = require('../db/database');
const config = require('../config');

let wss = null;
const clients = new Set();

/**
 * 初始化 WebSocket Server
 */
function initWebSocket(server) {
    wss = new WebSocket.Server({
        server,
        path: config.websocket.path,
        verifyClient: verifyClient
    });

    wss.on('connection', (ws, req) => {
        console.log(`WebSocket client connected: ${req.user?.username || 'unknown'}`);

        ws.user = req.user;
        ws.isAlive = true;
        clients.add(ws);

        // 发送初始状态
        sendInitialState(ws);

        // 心跳
        ws.on('pong', () => {
            ws.isAlive = true;
        });

        // 客户端消息
        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message);
                handleMessage(ws, data);
            } catch (e) {
                console.error('WebSocket message parse error:', e.message);
            }
        });

        // 断开连接
        ws.on('close', () => {
            clients.delete(ws);
            console.log('WebSocket client disconnected');
        });
    });

    // 心跳检测
    setInterval(() => {
        for (const ws of clients) {
            if (!ws.isAlive) {
                clients.delete(ws);
                ws.terminate();
                continue;
            }
            ws.isAlive = false;
            ws.ping();
        }
    }, config.websocket.heartbeatInterval);

    console.log(`WebSocket server initialized at ${config.websocket.path}`);
}

/**
 * 验证客户端
 */
function verifyClient(info, cb) {
    const url = new URL(info.req.url, `http://${info.req.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
        return cb(false, 401, 'No token');
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        return cb(false, 401, 'Invalid token');
    }

    info.req.user = decoded;
    cb(true);
}

/**
 * 处理客户端消息
 */
function handleMessage(ws, data) {
    switch (data.type) {
        case 'ping':
            ws.send(JSON.stringify({ type: 'pong' }));
            break;
        case 'subscribe':
            ws.subscriptions = data.channels || ['all'];
            break;
    }
}

/**
 * 发送初始状态
 */
function sendInitialState(ws) {
    const db = getDb();

    const tasks = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all();
    const cronJobs = db.prepare('SELECT * FROM cron_jobs ORDER BY next_run_at ASC').all();
    const recentRecords = db.prepare('SELECT * FROM execution_records ORDER BY started_at DESC LIMIT 20').all();

    ws.send(JSON.stringify({
        type: 'init',
        data: {
            tasks,
            cronJobs,
            recentRecords
        }
    }));
}

/**
 * 广播事件到所有客户端
 */
function broadcast(event, data) {
    const message = JSON.stringify({ type: event, data });

    for (const ws of clients) {
        if (ws.readyState === WebSocket.OPEN) {
            // 检查订阅
            if (!ws.subscriptions || ws.subscriptions.includes('all') || ws.subscriptions.includes(event)) {
                ws.send(message);
            }
        }
    }
}

/**
 * 通知任务更新
 */
function notifyTaskUpdate(task) {
    broadcast('task_updated', task);
}

/**
 * 通知执行记录更新
 */
function notifyExecutionRecord(record) {
    broadcast('execution_completed', record);
}

/**
 * 通知 Cron 状态变化
 */
function notifyCronStatusChange(cronJob) {
    broadcast('cron_status_changed', cronJob);
}

module.exports = {
    initWebSocket,
    broadcast,
    notifyTaskUpdate,
    notifyExecutionRecord,
    notifyCronStatusChange
};
