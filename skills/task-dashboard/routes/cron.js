/**
 * Cron Jobs API Routes - 从系统 crontab 读取
 */

const express = require('express');
const { execSync } = require('child_process');
const { getDb } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

/**
 * GET /api/cron - 获取所有定时任务
 */
router.get('/', (req, res) => {
    try {
        // 从系统 crontab 获取
        const output = execSync('crontab -l 2>/dev/null', { encoding: 'utf-8' });
        
        const jobs = parseCrontab(output);
        
        // 同步到数据库
        syncCronToDb(jobs);
        
        // 从数据库返回
        const db = getDb();
        const stmt = db.prepare('SELECT * FROM cron_jobs ORDER BY next_run_at ASC');
        const dbJobs = stmt.all();
        
        res.json(dbJobs);
    } catch (err) {
        // 如果失败，从数据库返回
        const db = getDb();
        const stmt = db.prepare('SELECT * FROM cron_jobs ORDER BY next_run_at ASC');
        const jobs = stmt.all();
        res.json(jobs);
    }
});

/**
 * 解析 crontab 输出
 */
function parseCrontab(output) {
    const jobs = [];
    const lines = output.split('\n');
    
    // 任务映射
    const taskMap = {
        'hdp-sync-12.sh': { name: 'HDP 课程日历同步 - 每天 12:00', desc: '同步 HDP 课程到飞书日历' },
        'hdp-sync-18.sh': { name: 'HDP 课程日历同步 - 每天 18:00', desc: '同步 HDP 课程到飞书日历' },
        'hdp-sync-22.sh': { name: 'HDP 课程日历同步 - 每天 22:00', desc: '同步 HDP 课程到飞书日历' },
        'feishu-token-keepalive.sh': { name: '飞书 Token 刷新', desc: '每小时刷新飞书 Token' },
        'sync-dashboard-records.sh': { name: 'Dashboard 记录同步', desc: '同步执行记录到飞书' },
        'openclaw-daily-update.sh': { name: 'OpenClaw 每日自动更新', desc: '检查并更新 OpenClaw' }
    };
    
    for (const line of lines) {
        if (!line.trim() || line.startsWith('#')) continue;
        
        // 解析 crontab 行
        const parts = line.split(/\s+/);
        if (parts.length < 6) continue;
        
        const schedule = parts.slice(0, 5).join(' ');
        const command = parts.slice(5).join(' ');
        
        // 查找匹配的任务
        let taskInfo = { name: '定时任务', desc: command };
        for (const [key, info] of Object.entries(taskMap)) {
            if (command.includes(key)) {
                taskInfo = info;
                break;
            }
        }
        
        // 计算下次执行时间
        const nextRun = calculateNextRun(schedule);
        
        jobs.push({
            id: command.replace(/[^a-zA-Z0-9]/g, '').substring(0, 20),
            name: taskInfo.name,
            schedule: schedule,
            enabled: 1,
            last_run_at: null,
            last_status: 'ok',
            next_run_at: nextRun,
            created_at: new Date().toISOString(),
            last_error: ''
        });
    }
    
    return jobs;
}

/**
 * 计算下次执行时间
 */
function calculateNextRun(schedule) {
    // 简单实现：基于当前时间推算
    // 实际应该使用 cronie 或其他库
    const now = new Date();
    
    if (schedule.includes('* * * * *')) {
        return new Date(now.getTime() + 60000).toISOString();
    } else if (schedule.startsWith('0 * * * *')) {
        return new Date(now.getTime() + 3600000).toISOString();
    } else if (schedule.startsWith('0 12 * * *')) {
        const next = new Date();
        next.setHours(12, 0, 0, 0);
        if (next <= now) next.setDate(next.getDate() + 1);
        return next.toISOString();
    } else if (schedule.startsWith('0 18 * * *')) {
        const next = new Date();
        next.setHours(18, 0, 0, 0);
        if (next <= now) next.setDate(next.getDate() + 1);
        return next.toISOString();
    } else if (schedule.startsWith('0 19 * * *')) {
        const next = new Date();
        next.setHours(19, 0, 0, 0);
        if (next <= now) next.setDate(next.getDate() + 1);
        return next.toISOString();
    } else if (schedule.startsWith('0 22 * * *')) {
        const next = new Date();
        next.setHours(22, 0, 0, 0);
        if (next <= now) next.setDate(next.getDate() + 1);
        return next.toISOString();
    }
    
    return new Date(now.getTime() + 86400000).toISOString();
}

/**
 * 同步 cron 数据到数据库
 */
function syncCronToDb(jobs) {
    const db = getDb();
    
    // 清空旧数据
    db.prepare('DELETE FROM cron_jobs').run();
    
    // 插入新数据
    for (const job of jobs) {
        const stmt = db.prepare(`
            INSERT INTO cron_jobs (id, name, schedule, enabled, last_run_at, last_status, next_run_at, created_at, last_error)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run(
            job.id,
            job.name,
            job.schedule,
            job.enabled,
            job.last_run_at,
            job.last_status,
            job.next_run_at,
            job.created_at,
            job.last_error
        );
    }
}

/**
 * GET /api/cron/:id/runs - 获取执行历史
 */
router.get('/:id/runs', (req, res) => {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 20;

    // 从执行记录表获取
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM execution_records WHERE cron_job_id = ? ORDER BY finished_at DESC LIMIT ?');
    const records = stmt.all(id, limit);
    
    res.json(records);
});

module.exports = router;
