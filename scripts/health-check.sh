#!/bin/bash
LOG="/root/.openclaw/logs/health-check.log"
JSON="/root/.openclaw/update-check.json"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] ==== Health Check ====" >> $LOG

# 1. Check process
PID=$(pgrep -f "openclaw-gateway" 2>/dev/null | head -1)
if [ -z "$PID" ]; then
    echo "[$(date)] Gateway not running, starting..." >> $LOG
    /root/.nvm/versions/node/v22.22.0/bin/nohup /root/.nvm/versions/node/v22.22.0/bin/openclaw gateway > /tmp/openclaw.log 2>&1 &
    sleep 5
    PID=$(pgrep -f "openclaw-gateway" 2>/dev/null | head -1)
    [ -n "$PID" ] && echo "[$(date)] Started (PID:$PID)" >> $LOG || echo "[$(date)] Start failed" >> $LOG
else
    echo "[$(date)] Gateway running (PID:$PID)" >> $LOG
fi

# 2. Check response
if curl -s --max-time 3 http://127.0.0.1:18789/ > /dev/null 2>&1; then
    echo "[$(date)] Response OK" >> $LOG
else
    echo "[$(date)] No response, restarting..." >> $LOG
    pkill -f "openclaw-gateway" 2>/dev/null
    sleep 2
    /root/.nvm/versions/node/v22.22.0/bin/nohup /root/.nvm/versions/node/v22.22.0/bin/openclaw gateway > /tmp/openclaw.log 2>&1 &
    echo "[$(date)] Restarted" >> $LOG
fi

# 3. Check update
LATEST=$(timeout 10 /root/.nvm/versions/node/v22.22.0/bin/npm view openclaw version 2>/dev/null)
CURRENT=$(grep "lastNotifiedVersion" $JSON | sed 's/.*: *"\([^"]*\)".*/\1/')

echo "[$(date)] Current:$CURRENT Latest:$LATEST" >> $LOG

if [ "$LATEST" != "$CURRENT" ] && [ -n "$LATEST" ]; then
    echo "[$(date)] New version $LATEST, updating..." >> $LOG
    cd /root/.openclaw && /root/.nvm/versions/node/v22.22.0/bin/npm install openclaw@latest >> $LOG 2>&1
    if [ $? -eq 0 ]; then
        pkill -f "openclaw-gateway" 2>/dev/null
        sleep 3
        /root/.nvm/versions/node/v22.22.0/bin/nohup /root/.nvm/versions/node/v22.22.0/bin/openclaw gateway > /tmp/openclaw.log 2>&1 &
        sed -i "s/\"lastNotifiedVersion\": \".*\"/\"lastNotifiedVersion\": \"$LATEST\"/" $JSON
        echo "[$(date)] Updated to $LATEST" >> $LOG
    else
        echo "[$(date)] Update failed" >> $LOG
    fi
else
    echo "[$(date)] Already latest" >> $LOG
fi

echo "[$(date)] Done" >> $LOG
