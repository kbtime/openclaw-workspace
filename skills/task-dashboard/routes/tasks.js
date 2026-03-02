/**
 * Tasks API Routes
 */

const express = require('express');
const { getDb } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

/**
 * GET /api/tasks - 获取所有任务
 */
router.get('/', (req, res) => {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC');
    const tasks = stmt.all();
    res.json(tasks);
});

/**
 * POST /api/tasks - 创建任务
 */
router.post('/', (req, res) => {
    const { title, description, status, progress } = req.body;

    if (!title) {
        return res.status(400).json({ error: 'Title required' });
    }

    const db = getDb();
    const stmt = db.prepare(`
        INSERT INTO tasks (title, description, status, progress)
        VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(
        title,
        description || '',
        status || 'pending',
        progress || 0
    );

    res.json({
        success: true,
        id: result.lastInsertRowid
    });
});

/**
 * PUT /api/tasks/:id - 更新任务
 */
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { title, description, status, progress } = req.body;

    const db = getDb();
    const stmt = db.prepare(`
        UPDATE tasks
        SET title = COALESCE(?, title),
            description = COALESCE(?, description),
            status = COALESCE(?, status),
            progress = COALESCE(?, progress),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `);

    stmt.run(title, description, status, progress, id);

    res.json({ success: true });
});

/**
 * DELETE /api/tasks/:id - 删除任务
 */
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const db = getDb();
    const stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
    stmt.run(id);
    res.json({ success: true });
});

module.exports = router;
