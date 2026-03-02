/**
 * 任务执行记录写入飞书多维表格
 * 
 * 用途：定时任务执行后自动记录到飞书"任务执行记录"表
 * 使用 Tenant Access Token（应用身份），无需用户授权
 * 
 * 使用方式：
 * node scripts/log-to-feishu.js "<任务名称>" "<状态>" "<结果>" "<错误>" "<任务ID>"
 */

const fs = require('fs');
const path = require('path');

const FEISHU_BITABLE_API = 'https://open.feishu.cn/open-apis/bitable/v1/apps';
const FEISHU_AUTH_API = 'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal';
const APP_ID = 'cli_a9184c4094b8dcbb';
const APP_SECRET = 'sNEMtAe7F8I43vneAYBwCeHbmlqild3d';
const APP_TOKEN = 'FczmbVS0QaZ2CtsMnQycoiExnaf';
const TABLE_ID = 'tblNOdCsb2gDlTCB'; // 任务执行记录表
const TOKEN_FILE = path.join(process.env.HOME || '/root', '.openclaw/workspace/lib/feishu-tenant-token.json');

/**
 * 获取 Tenant Access Token
 */
async function getTenantToken() {
  // 1. 检查本地缓存的 Token
  try {
    if (fs.existsSync(TOKEN_FILE)) {
      const tokenInfo = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8'));
      const now = Date.now();
      
      // 检查是否过期（提前 5 分钟判断）
      if (tokenInfo.expiresAt && tokenInfo.expiresAt > now + 300000) {
        return tokenInfo.token;
      }
    }
  } catch (e) {
    console.error('读取 Tenant Token 失败:', e.message);
  }
  
  // 2. 重新获取 Token
  try {
    const res = await fetch(FEISHU_AUTH_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_id: APP_ID,
        app_secret: APP_SECRET
      })
    });
    
    const data = await res.json();
    
    if (data.code === 0) {
      const tokenInfo = {
        token: data.tenant_access_token,
        expiresAt: Date.now() + (data.expire - 300) * 1000
      };
      fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokenInfo, null, 2));
      console.log('✅ Tenant Token 已刷新');
      return data.tenant_access_token;
    } else {
      console.error('获取 Tenant Token 失败:', data.msg);
    }
  } catch (e) {
    console.error('请求 Tenant Token 失败:', e.message);
  }
  
  return null;
}

/**
 * 写入任务执行记录
 */
async function logExecution(taskName, status, result = '', error = '', taskId = '') {
  // 过滤掉不需要记录的任务
  const excludeTasks = ['刷新飞书 User Token', '刷新飞书 Tenant Token'];
  if (excludeTasks.some(t => taskName.includes(t))) {
    console.log(`⏭️ 跳过记录: ${taskName}`);
    return true;
  }
  
  const token = await getTenantToken();
  
  if (!token) {
    console.error('❌ 无法获取飞书 Tenant Token');
    return false;
  }
  
  const now = Date.now();
  
  const body = {
    fields: {
      '任务名称': taskName,
      '执行日期': now,
      '执行时间': now,
      '执行状态': status, // 成功/失败/未知
      '任务类型': '定时任务',
      '执行结果': result,
      '错误信息': error,
      '相关任务 ID': taskId
    }
  };
  
  try {
    const response = await fetch(
      `${FEISHU_BITABLE_API}/${APP_TOKEN}/tables/${TABLE_ID}/records`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }
    );
    
    const data = await response.json();
    
    if (data.code === 0) {
      console.log(`✅ 执行记录已写入飞书: ${taskName} - ${status}`);
      return true;
    } else {
      console.error(`❌ 写入失败: ${data.msg}`);
      return false;
    }
  } catch (e) {
    console.error(`❌ 写入异常: ${e.message}`);
    return false;
  }
}

// CLI 调用
const args = process.argv.slice(2);
if (args.length >= 2) {
  const [taskName, status, result, error, taskId] = args;
  logExecution(taskName, status, result || '', error || '', taskId || '');
} else {
  console.log('用法: node log-to-feishu.js "<任务名称>" "<状态>" "[结果]" "[错误]" "[任务ID]"');
  console.log('示例: node log-to-feishu.js "HDP 同步" "成功" "同步了 5 条记录" "" "cron-123"');
}

module.exports = { logExecution };
