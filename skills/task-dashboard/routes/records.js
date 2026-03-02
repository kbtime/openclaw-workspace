/**
 * Execution Records API Routes
 */

const express = require('express');
const { getDb } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

/**
 * GET /api/records - 获取执行记录
 */
router.get('/', (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    const cronJobId = req.query.cron_job_id;

    const db = getDb();

    // 直接从数据库返回（不每次都同步，太慢）
    let stmt, records;

    if (cronJobId) {
        stmt = db.prepare(`
            SELECT * FROM execution_records
            WHERE cron_job_id = ?
            ORDER BY started_at DESC
            LIMIT ? OFFSET ?
        `);
        records = stmt.all(cronJobId, limit, offset);
    } else {
        stmt = db.prepare(`
            SELECT * FROM execution_records
            ORDER BY started_at DESC
            LIMIT ? OFFSET ?
        `);
        records = stmt.all(limit, offset);
    }

    res.json(records);
});

/**
 * 从 openclaw cron runs 同步执行记录
 */
function syncExecutionRecords() {
    try {
        const { execSync } = require('child_process');
        
        // 获取所有 cron 任务
        const cronOutput = execSync('openclaw cron list --json 2>&1', { encoding: 'utf-8', timeout: 30000 });
        const jsonStart = cronOutput.indexOf('{');
        const cronData = JSON.parse(jsonStart >= 0 ? cronOutput.substring(jsonStart) : cronOutput);
        
        if (!cronData.jobs) return;
        
        const db = getDb();
        
        // 过滤掉不需要记录的任务
        const excludeTasks = ['刷新飞书 User Token', '刷新飞书 Tenant Token'];
        
        for (const job of cronData.jobs) {
            // 跳过 Token 刷新任务
            if (excludeTasks.some(t => job.name && job.name.includes(t))) {
                continue;
            }
            
            // 获取每个任务的执行历史
            try {
                const runsOutput = execSync(`openclaw cron runs --id ${job.id} --limit 20 2>&1`, { encoding: 'utf-8', timeout: 30000 });
                const runsJsonStart = runsOutput.indexOf('{');
                if (runsJsonStart < 0) continue;
                
                const runsData = JSON.parse(runsOutput.substring(runsJsonStart));
                if (!runsData.entries) continue;
                
                for (const entry of runsData.entries) {
                    if (entry.action !== 'finished') continue;
                    
                    const startedAt = new Date(entry.runAtMs).toISOString();
                    const finishedAt = new Date(entry.runAtMs + (entry.durationMs || 0)).toISOString();
                    const status = entry.status === 'ok' ? 'success' : entry.status === 'error' ? 'failed' : entry.status;
                    
                    // 检查是否已存在
                    const existing = db.prepare(`
                        SELECT id FROM execution_records 
                        WHERE cron_job_id = ? AND started_at = ?
                    `).get(job.id, startedAt);
                    
                    if (!existing) {
                        db.prepare(`
                            INSERT INTO execution_records 
                            (cron_job_id, task_name, started_at, finished_at, status, result, error_message, duration_ms)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        `).run(
                            job.id,
                            job.name,
                            startedAt,
                            finishedAt,
                            status,
                            (entry.summary || '').substring(0, 500),
                            entry.error || '',
                            entry.durationMs || 0
                        );
                    }
                }
            } catch (e) {
                console.error(`同步任务 ${job.name} 失败:`, e.message);
            }
        }
    } catch (e) {
        console.error('同步执行记录失败:', e.message);
    }
}

/**
 * GET /api/records/stats - 获取统计信息
 */
router.get('/stats', (req, res) => {
    const db = getDb();

    // 最近 24 小时统计
    const stmt = db.prepare(`
        SELECT
            COUNT(*) as total,
            SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
            SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
            AVG(duration_ms) as avg_duration_ms
        FROM execution_records
        WHERE started_at > datetime('now', '-24 hours')
    `);

    const stats = stmt.get();
    res.json(stats);
});

/**
 * GET /api/records/:id - 获取单条记录
 */
router.get('/:id', (req, res) => {
    const { id } = req.params;
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM execution_records WHERE id = ?');
    const record = stmt.get(id);

    if (!record) {
        return res.status(404).json({ error: 'Record not found' });
    }

    res.json(record);
});

module.exports = router;
