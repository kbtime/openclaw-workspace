#!/usr/bin/env node
/**
 * 同步 openclaw cron 执行记录到 Dashboard 数据库
 * 
 * 建议每 5 分钟运行一次
 */

const { execSync } = require('child_process');
const path = require('path');

// 设置数据库路径
process.env.DASHBOARD_DB_PATH = path.join(process.env.HOME || '/root', '.openclaw/workspace/data/dashboard.db');

const { getDb } = require('../db/database');

function syncExecutionRecords() {
    console.log('开始同步执行记录...');
    
    try {
        // 获取所有 cron 任务
        const cronOutput = execSync('node /usr/lib/node_modules/openclaw/openclaw.mjs cron list --json 2>&1', { encoding: 'utf-8', timeout: 30000 });
        const jsonStart = cronOutput.indexOf('{');
        const cronData = JSON.parse(jsonStart >= 0 ? cronOutput.substring(jsonStart) : cronOutput);
        
        if (!cronData.jobs) {
            console.log('没有任务');
            return;
        }
        
        const db = getDb();
        
        // 过滤掉不需要记录的任务
        const excludeTasks = [
            '刷新飞书 User Token', 
            '刷新飞书 Tenant Token',
            '同步 Dashboard 执行记录'
        ];
        
        let newCount = 0;
        
        for (const job of cronData.jobs) {
            // 跳过 Token 刷新任务
            if (excludeTasks.some(t => job.name && job.name.includes(t))) {
                continue;
            }
            
            // 获取每个任务的执行历史
            try {
                const runsOutput = execSync(`node /usr/lib/node_modules/openclaw/openclaw.mjs cron runs --id ${job.id} --limit 10 2>&1`, { encoding: 'utf-8', timeout: 30000 });
                const runsJsonStart = runsOutput.indexOf('{');
                if (runsJsonStart < 0) continue;
                
                const runsData = JSON.parse(runsOutput.substring(runsJsonStart));
                if (!runsData.entries) continue;
                
                for (const entry of runsData.entries) {
                    if (entry.action !== 'finished') continue;
                    
                    const startedAt = new Date(entry.runAtMs).toISOString();
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
                            startedAt,
                            status,
                            (entry.summary || '').substring(0, 500),
                            entry.error || '',
                            entry.durationMs || 0
                        );
                        newCount++;
                    }
                }
            } catch (e) {
                console.error(`同步任务 ${job.name} 失败:`, e.message);
            }
        }
        
        console.log(`✅ 同步完成，新增 ${newCount} 条记录`);
    } catch (e) {
        console.error('同步失败:', e.message);
    }
}

syncExecutionRecords();
