#!/bin/bash
# OpenClaw 健康检查 + 自动更新脚本
# 服务器: fanfan (43.164.0.202)
# 执行时间: 每天凌晨 1 点

SERVER_NAME="fanfan"
LOG="/root/.openclaw/logs/health-check-fanfan.log"
JSON="/root/.openclaw/update-check.json"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] [${SERVER_NAME}] ==== Health Check ====" >> $LOG

# 1. 检查进程
PID=$(pgrep -f "openclaw-gateway" 2>/dev/null | head -1)
if [ -z "$PID" ]; then
    echo "[$(date)] [${SERVER_NAME}] Gateway not running, starting..." >> $LOG
    /root/.nvm/versions/node/v22.22.0/bin/nohup /root/.nvm/versions/node/v22.22.0/bin/openclaw gateway > /tmp/openclaw-fanfan.log 2>&1 &
    sleep 5
    PID=$(pgrep -f "openclaw-gateway" 2>/dev/null | head -1)
    [ -n "$PID" ] && echo "[$(date)] [${SERVER_NAME}] Started (PID:$PID)" >> $LOG || echo "[$(date)] [${SERVER_NAME}] Start failed" >> $LOG
else
    echo "[$(date)] [${SERVER_NAME}] Gateway running (PID:$PID)" >> $LOG
fi

# 2. 检查响应
if curl -s --max-time 3 http://127.0.0.1:18789/ > /dev/null 2>&1; then
    echo "[$(date)] [${SERVER_NAME}] Response OK" >> $LOG
else
    echo "[$(date)] [${SERVER_NAME}] No response, restarting..." >> $LOG
    pkill -f "openclaw-gateway" 2>/dev/null
    sleep 2
    /root/.nvm/versions/node/v22.22.0/bin/nohup /root/.nvm/versions/node/v22.22.0/bin/openclaw gateway > /tmp/openclaw-fanfan.log 2>&1 &
    echo "[$(date)] [${SERVER_NAME}] Restarted" >> $LOG
fi

# 3. 检查更新
LATEST=$(timeout 10 /root/.nvm/versions/node/v22.22.0/bin/npm view openclaw version 2>/dev/null)
CURRENT=$(grep "lastNotifiedVersion" $JSON | sed 's/.*: *"\([^"]*\)".*/\1/')

echo "[$(date)] [${SERVER_NAME}] Current:$CURRENT Latest:$LATEST" >> $LOG

if [ "$LATEST" != "$CURRENT" ] && [ -n "$LATEST" ]; then
    echo "[$(date)] [${SERVER_NAME}] New version $LATEST, updating..." >> $LOG
    cd /root/.openclaw && /root/.nvm/versions/node/v22.22.0/bin/npm install openclaw@latest >> $LOG 2>&1
    if [ $? -eq 0 ]; then
        pkill -f "openclaw-gateway" 2>/dev/null
        sleep 3
        /root/.nvm/versions/node/v22.22.0/bin/nohup /root/.nvm/versions/node/v22.22.0/bin/openclaw gateway > /tmp/openclaw-fanfan.log 2>&1 &
        sed -i "s/\"lastNotifiedVersion\": \".*\"/\"lastNotifiedVersion\": \"$LATEST\"/" $JSON
        echo "[$(date)] [${SERVER_NAME}] Updated to $LATEST" >> $LOG
    else
        echo "[$(date)] [${SERVER_NAME}] Update failed" >> $LOG
    fi
else
    echo "[$(date)] [${SERVER_NAME}] Already latest" >> $LOG
fi

echo "[$(date)] [${SERVER_NAME}] Done" >> $LOG
