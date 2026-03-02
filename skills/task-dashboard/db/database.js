/**
 * SQLite Database Module
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = process.env.DASHBOARD_DB_PATH || path.join(process.env.HOME, '.openclaw/workspace/data/dashboard.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

let db = null;

/**
 * 初始化数据库
 */
function initDatabase() {
    // 确保目录存在
    const dbDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }

    // 创建数据库连接
    db = new Database(DB_PATH);

    // 启用 WAL 模式
    db.pragma('journal_mode = WAL');

    // 读取并执行 schema
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
    db.exec(schema);

    console.log(`✅ Database initialized: ${DB_PATH}`);

    // 创建默认管理员账号
    createDefaultAdmin();

    return db;
}

/**
 * 创建默认管理员账号
 */
function createDefaultAdmin() {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM users');
    const result = stmt.get();

    if (result.count === 0) {
        // 生成随机密码
        const password = generateRandomPassword(12);
        const passwordHash = bcrypt.hashSync(password, 10);

        const insert = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)');
        insert.run('admin', passwordHash);

        console.log('');
        console.log('========================================');
        console.log('🔐 Default Admin Account Created');
        console.log(`   Username: admin`);
        console.log(`   Password: ${password}`);
        console.log('   Please change password after login!');
        console.log('========================================');
        console.log('');

        // 同时保存到文件
        const credFile = path.join(path.dirname(DB_PATH), 'dashboard-credentials.txt');
        fs.writeFileSync(credFile, `Username: admin\nPassword: ${password}\nCreated: ${new Date().toISOString()}\n`);
        console.log(`   Credentials saved to: ${credFile}`);
    }
}

/**
 * 生成随机密码
 */
function generateRandomPassword(length) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

/**
 * 获取数据库连接
 */
function getDb() {
    if (!db) {
        initDatabase();
    }
    return db;
}

/**
 * 关闭数据库连接
 */
function closeDatabase() {
    if (db) {
        db.close();
        db = null;
        console.log('Database closed');
    }
}

module.exports = {
    initDatabase,
    getDb,
    closeDatabase
};
