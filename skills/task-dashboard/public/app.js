/**
 * Task Dashboard Frontend - Vercel/Next.js Style
 */

const API_BASE = '/api';
let ws = null;
let usePolling = false;
let currentPage = 1;
let cronPage = 1;
const pageSize = 10;
let totalRecords = 0;
let totalCronJobs = 0;

// ==================== 初始化 ====================

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    
    // 每 5 分钟自动刷新数据
    setInterval(() => {
        if (localStorage.getItem('token')) {
            fetchInitialData();
        }
    }, 5 * 60 * 1000);
});

function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/dashboard/login.html';
        return;
    }

    fetch(`${API_BASE}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
        if (res.ok) return res.json();
        throw new Error('Unauthorized');
    })
    .then(data => {
        document.getElementById('userInfo').textContent = data.user.username;
        initWebSocket();
        fetchInitialData();
    })
    .catch(() => {
        localStorage.removeItem('token');
        window.location.href = '/dashboard/login.html';
    });
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (ws) ws.close();
    window.location.href = '/dashboard/login.html';
}

// ==================== WebSocket ====================

function initWebSocket() {
    const token = localStorage.getItem('token');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?token=${token}`;

    updateConnectionStatus('connecting');

    try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            updateConnectionStatus('online');
            usePolling = false;
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleWebSocketMessage(data);
        };

        ws.onclose = () => {
            if (!usePolling) {
                usePolling = true;
                startPolling();
            }
        };

        ws.onerror = () => {
            ws.close();
        };
    } catch (e) {
        usePolling = true;
        startPolling();
    }
}

function startPolling() {
    updateConnectionStatus('online');
    fetchInitialData();
    
    setInterval(() => {
        if (usePolling) {
            fetchInitialData();
        }
    }, 30000);
}

function updateConnectionStatus(status) {
    const statusEl = document.getElementById('connectionStatus');
    const dot = statusEl.querySelector('.status-dot');
    const text = statusEl.querySelector('.status-text');

    dot.className = 'status-dot ' + status;
    text.textContent = status === 'online' ? '在线' : status === 'connecting' ? '连接中' : '离线';
}

function handleWebSocketMessage(data) {
    switch (data.type) {
        case 'init':
            renderCronJobs(data.data.cronJobs);
            renderRecords(data.data.recentRecords);
            break;
    }
    updateLastUpdate();
}

// ==================== API 调用 ====================

async function fetchInitialData() {
    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };

    try {
        const [cronRes, statusRes] = await Promise.all([
            fetch(`${API_BASE}/cron`, { headers }),
            fetch(`${API_BASE}/status`, { headers })
        ]);

        const cronJobs = await cronRes.json();
        const status = await statusRes.json();

        renderCronJobs(cronJobs);
        renderStatus(status);
        await fetchRecords(1);

        updateLastUpdate();
    } catch (err) {
        console.error('Failed to fetch data:', err);
    }
}

async function fetchRecords(page) {
    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };
    
    currentPage = page;
    const offset = (page - 1) * pageSize;

    try {
        // 获取记录
        const res = await fetch(`${API_BASE}/records?limit=${pageSize}&offset=${offset}`, { headers });
        const records = await res.json();
        
        // 获取总数（第一页时估算）
        if (page === 1) {
            if (records.length < pageSize) {
                totalRecords = records.length;
            } else {
                // 获取第二页来判断总数
                const res2 = await fetch(`${API_BASE}/records?limit=${pageSize}&offset=${pageSize}`, { headers });
                const records2 = await res2.json();
                totalRecords = pageSize + records2.length;
            }
        }
        
        renderRecords(records, page);
    } catch (err) {
        console.error('Failed to fetch records:', err);
    }
}

// ==================== 渲染函数 ====================

function renderStatus(status) {
    // Gateway
    const gatewayEl = document.getElementById('statusGateway');
    gatewayEl.textContent = status.gateway?.running ? '✅ 运行中' : '❌ 未运行';
    gatewayEl.className = 'status-value ' + (status.gateway?.running ? 'success' : 'error');

    // User Token
    const userTokenEl = document.getElementById('statusUserToken');
    if (status.tokens?.userToken) {
        const t = status.tokens.userToken;
        userTokenEl.textContent = t.valid ? `✅ ${t.remaining}` : '❌ 已过期';
        userTokenEl.className = 'status-value ' + (t.valid ? 'success' : 'error');
    }

    // Tenant Token
    const tenantTokenEl = document.getElementById('statusTenantToken');
    if (status.tokens?.tenantToken) {
        const t = status.tokens.tenantToken;
        tenantTokenEl.textContent = t.valid ? '✅ 有效' : '❌ 无效';
        tenantTokenEl.className = 'status-value ' + (t.valid ? 'success' : 'error');
    }

    // Nginx
    const nginxEl = document.getElementById('statusNginx');
    nginxEl.textContent = status.services?.nginx?.running ? '✅ 运行中' : '❌ 未运行';
    nginxEl.className = 'status-value ' + (status.services?.nginx?.running ? 'success' : 'error');

    // Docker
    const dockerEl = document.getElementById('statusDocker');
    dockerEl.textContent = status.services?.docker?.running ? '✅ 运行中' : '❌ 未运行';
    dockerEl.className = 'status-value ' + (status.services?.docker?.running ? 'success' : 'error');
}

function renderCronJobs(jobs) {
    const container = document.getElementById('cronList');
    
    // 存储全部任务
    window.allCronJobs = jobs || [];
    totalCronJobs = window.allCronJobs.length;
    document.getElementById('cronCount').textContent = totalCronJobs;

    if (!jobs || jobs.length === 0) {
        container.innerHTML = '<p class="empty-state">暂无定时任务</p>';
        return;
    }

    // 渲染当前页
    renderCronPage(cronPage);
}

function renderCronPage(page) {
    const container = document.getElementById('cronList');
    const jobs = window.allCronJobs || [];
    const totalPages = Math.ceil(jobs.length / pageSize);
    const start = (page - 1) * pageSize;
    const pageJobs = jobs.slice(start, start + pageSize);

    cronPage = page;

    let html = pageJobs.map(job => {
        const isFailed = job.last_status === 'failed' || job.last_status === 'error';
        const statusIcon = job.last_status === 'ok' || job.last_status === 'success' ? '✅' : 
                          isFailed ? '❌' : '⏳';
        
        return `
            <div class="cron-item ${isFailed ? 'failed' : ''}">
                <div class="cron-info">
                    <div class="cron-name">${escapeHtml(job.name)}</div>
                    <div class="cron-schedule">
                        ${escapeHtml(job.schedule || '')} 
                        ${job.next_run_at ? `→ ${formatDateTime(job.next_run_at)}` : ''}
                    </div>
                </div>
                <div class="cron-status">${statusIcon}</div>
            </div>
        `;
    }).join('');

    if (totalPages > 1) {
        html += `
            <div class="pagination">
                <button class="btn-page" onclick="renderCronPage(${page - 1})" ${page <= 1 ? 'disabled' : ''}>上一页</button>
                <span class="page-info">${page} / ${totalPages}</span>
                <button class="btn-page" onclick="renderCronPage(${page + 1})" ${page >= totalPages ? 'disabled' : ''}>下一页</button>
            </div>
        `;
    }

    container.innerHTML = html;
}

function renderRecords(records, page = 1) {
    const container = document.getElementById('recordsList');

    if (!records || records.length === 0) {
        container.innerHTML = '<p class="empty-state">暂无执行记录</p>';
        return;
    }

    const totalPages = Math.ceil(totalRecords / pageSize);

    container.innerHTML = `
        <table class="records-table">
            <thead>
                <tr>
                    <th>时间</th>
                    <th>任务</th>
                    <th>状态</th>
                    <th>耗时</th>
                </tr>
            </thead>
            <tbody>
                ${records.map(r => `
                    <tr>
                        <td>${formatTime(r.started_at)}</td>
                        <td>${escapeHtml(r.task_name)}</td>
                        <td><span class="status-badge ${r.status}">${r.status === 'success' ? '成功' : r.status === 'failed' ? '失败' : '运行中'}</span></td>
                        <td>${r.duration_ms ? formatDuration(r.duration_ms) : '-'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        <div class="pagination">
            <button class="btn-page" onclick="fetchRecords(${page - 1})" ${page <= 1 ? 'disabled' : ''}>上一页</button>
            <span class="page-info">${page} / ${totalPages}</span>
            <button class="btn-page" onclick="fetchRecords(${page + 1})" ${page >= totalPages ? 'disabled' : ''}>下一页</button>
        </div>
    `;
}

function updateLastUpdate() {
    document.getElementById('lastUpdate').textContent = `最后更新: ${new Date().toLocaleTimeString()}`;
}

// ==================== 工具函数 ====================

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatTime(isoString) {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDateTime(isoString) {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDuration(ms) {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}
