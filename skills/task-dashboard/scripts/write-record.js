#!/usr/bin/env node
/**
 * 写入执行记录到数据库
 *
 * 用法:
 *   node write-record.js --cron-job-id <id> --task-name <name> --status <status> [--result <result>] [--error <error>] [--duration <ms>]
 *
 * 或者作为模块引入:
 *   const { writeRecord } = require('./write-record');
 *   await writeRecord({ cronJobId, taskName, status, result, error, durationMs });
 */

const path = require('path');

// 添加 db 目录到路径
process.chdir(path.join(__dirname, '..'));

const { getDb } = require('../db/database');

function parseArgs() {
    const args = process.argv.slice(2);
    const result = {};

    for (let i = 0; i < args.length; i++) {
        if (args[i].startsWith('--')) {
            const key = args[i].substring(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
            result[key] = args[++i];
        }
    }

    return result;
}

/**
 * 写入执行记录
 */
function writeRecord(options) {
    const {
        cronJobId,
        taskName,
        status = 'success',
        result = '',
        error = '',
        durationMs = 0
    } = options;

    if (!taskName) {
        console.error('Error: task-name is required');
        return false;
    }

    const db = getDb();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
        INSERT INTO execution_records
            (cron_job_id, task_name, started_at, finished_at, status, result, error_message, duration_ms)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result_db = stmt.run(
        cronJobId || null,
        taskName,
        now,
        now,
        status,
        result,
        error,
        parseInt(durationMs) || 0
    );

    console.log(`✅ Record saved: ${taskName} - ${status} (ID: ${result_db.lastInsertRowid})`);

    // 更新 cron_jobs 表的 last_run_at 和 last_status
    if (cronJobId) {
        const updateStmt = db.prepare(`
            UPDATE cron_jobs
            SET last_run_at = ?, last_status = ?
            WHERE id = ?
        `);
        updateStmt.run(now, status, cronJobId);
    }

    return true;
}

// CLI 调用
if (require.main === module) {
    const args = parseArgs();

    if (!args.taskName) {
        console.log('Usage: node write-record.js --task-name <name> --status <status> [--cron-job-id <id>] [--result <result>] [--error <error>] [--duration-ms <ms>]');
        process.exit(1);
    }

    writeRecord({
        cronJobId: args.cronJobId,
        taskName: args.taskName,
        status: args.status || 'success',
        result: args.result || '',
        error: args.error || '',
        durationMs: args.durationMs || 0
    });
}

module.exports = { writeRecord };
