#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
语音整理 Skill - 火山引擎认证 (简化版本)
"""

import os
import sys
import json
import time
import uuid
import hmac
import hashlib
import base64
import oss2
import requests
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse

def load_env():
    env_path = Path(__file__).parent.parent / '.env'
    if env_path.exists():
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ.setdefault(key, value)

load_env()

OSS_ACCESS_KEY_ID = os.environ.get('OSS_ACCESS_KEY_ID')
OSS_ACCESS_KEY_SECRET = os.environ.get('OSS_ACCESS_KEY_SECRET')
OSS_BUCKET = os.environ.get('OSS_BUCKET', 'lhong')
OSS_ENDPOINT = os.environ.get('OSS_ENDPOINT', 'oss-cn-shenzhen.aliyuncs.com')
OSS_PREFIX = os.environ.get('OSS_BUCKET_PATH_PREFIX', 'wxhm')

VOLC_APPID = os.environ.get('VOLC_APPID')
VOLC_ACCESS_KEY = os.environ.get('VOLC_ACCESS_KEY')
VOLC_SECRET_KEY = os.environ.get('VOLC_SECRET_KEY')
VOLC_API_RESOURCE_ID = os.environ.get('VOLC_API_RESOURCE_ID', 'volc.seedasr.auc')

def simple_hmac_sign(ak: str, sk: str, method: str, uri: str, body: str) -> str:
    """简单HMAC签名"""
    # 组合字符串: method + uri + body
    sign_str = f"{method.upper()}\n{uri}\n\n{body}"
    signature = hmac.new(sk.encode(), sign_str.encode(), hashlib.sha256).hexdigest()
    return signature

def volc_sign_v2(ak: str, sk: str, method: str, uri: str, headers: dict, body: str) -> str:
    """
    火山引擎签名 v2 (参考官方文档)
    """
    # 1. 构造CanonicalRequest
    http_method = method.upper()
    canonical_uri = uri
    canonical_querystring = ''
    
    # 必需header
    host = 'openspeech.bytedance.com'
    x_date = datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')
    
    if body:
        body_bytes = body.encode('utf-8')
        x_content_sha256 = hashlib.sha256(body_bytes).hexdigest()
    else:
        x_content_sha256 = hashlib.sha256(b'').hexdigest()
    
    # 标准header (小写排序)
    canonical_headers = f"host:{host}\nx-content-sha256:{x_content_sha256}\nx-date:{x_date}\n"
    signed_headers = "host;x-content-sha256;x-date"
    
    canonical_request = f"{http_method}\n{canonical_uri}\n{canonical_querystring}\n{canonical_headers}\n{signed_headers}\n{x_content_sha256}"
    
    # 2. 构造待签名字符串
    algorithm = "HMAC-SHA256"
    credential_scope = f"{datetime.utcnow().strftime('%Y%m%d')}/cn-north-1/speech/request"
    string_to_sign = f"{algorithm}\n{x_date}\n{credential_scope}\n{hashlib.sha256(canonical_request.encode()).hexdigest()}"
    
    # 3. 计算签名密钥
    k_date = hmac.new(f"TC3{sk}".encode(), datetime.utcnow().strftime('%Y%m%d').encode(), hashlib.sha256).digest()
    k_region = hmac.new(k_date, b"cn-north-1", hashlib.sha256).digest()
    k_service = hmac.new(k_region, b"speech", hashlib.sha256).digest()
    k_signing = hmac.new(k_service, b"request", hashlib.sha256).digest()
    
    # 4. 计算签名
    signature = hmac.new(k_signing, string_to_sign.encode(), hashlib.sha256).hexdigest()
    
    # 5. 构造Authorization
    auth_header = f"{algorithm} Credential={ak}/{credential_scope}, SignedHeaders={signed_headers}, Signature={signature}"
    
    return auth_header, x_date, x_content_sha256

def upload_to_oss(local_file: str) -> str:
    """上传文件到阿里云OSS"""
    auth = oss2.Auth(OSS_ACCESS_KEY_ID, OSS_ACCESS_KEY_SECRET)
    bucket = oss2.Bucket(auth, OSS_ENDPOINT, OSS_BUCKET)
    
    filename = os.path.basename(local_file)
    today = datetime.now().strftime('%Y-%m-%d')
    oss_key = f"{OSS_PREFIX}/{today}/{filename}"
    
    print(f"📤 上传到OSS: {local_file}")
    result = bucket.put_object_from_file(oss_key, local_file)
    
    if result.status == 200:
        url = f"https://{OSS_BUCKET}.{OSS_ENDPOINT}/{oss_key}"
        print(f"✅ OSS上传成功")
        return url
    else:
        raise Exception(f"OSS上传失败: {result.status}")

def submit_to_volc(audio_url: str) -> dict:
    """提交音频到火山引擎"""
    request_id = str(uuid.uuid4())
    
    ext = audio_url.split('.')[-1].lower() if '.' in audio_url else 'mp3'
    format_map = {'mp3': 'mp3', 'wav': 'wav', 'ogg': 'ogg', 'm4a': 'm4a', 'opus': 'ogg'}
    audio_format = format_map.get(ext, 'mp3')
    
    payload = {
        "user": {"uid": VOLC_APPID},
        "audio": {
            "url": audio_url,
            "format": audio_format,
            "codec": "raw",
            "rate": 16000,
            "bits": 16,
            "channel": 1
        },
        "request": {
            "model_name": "bigmodel",
            "enable_itn": True,
            "enable_punc": True,
            "show_utterances": True
        }
    }
    
    body_str = json.dumps(payload, separators=(',', ':'))
    uri = "/api/v3/auc/bigmodel/submit"
    
    # 计算签名
    auth, x_date, x_sha256 = volc_sign_v2(VOLC_ACCESS_KEY, VOLC_SECRET_KEY, 'POST', uri, {}, body_str)
    
    headers = {
        'Content-Type': 'application/json',
        'Host': 'openspeech.bytedance.com',
        'X-Date': x_date,
        'X-Content-Sha256': x_sha256,
        'Authorization': auth,
        'X-Api-Key': VOLC_ACCESS_KEY,  # 添加API Key
        'X-Api-Resource-Id': VOLC_API_RESOURCE_ID,
        'X-Api-Request-Id': request_id,
        'X-Api-Sequence': '-1'
    }
    
    print(f"🎙️ 提交到火山引擎...")
    print(f"   Audio: {audio_url}")
    
    response = requests.post(f"https://openspeech.bytedance.com{uri}", 
                            headers=headers, data=body_str, timeout=30)
    
    print(f"   HTTP: {response.status_code}")
    
    result = response.json() if response.text else {}
    
    if response.status_code != 200:
        print(f"❌ 失败: {json.dumps(result, ensure_ascii=False)[:500]}")
        raise Exception(f"API错误 {response.status_code}")
    
    # 检查结果
    resp = result.get('resp', {})
    if 'task_id' in resp:
        print(f"✅ 任务提交，TaskID: {resp['task_id']}")
        return query_volc_result(resp['task_id'], request_id)
    elif 'text' in resp:
        print(f"✅ 同步完成")
        return result
    else:
        print(f"⚠️ 响应: {json.dumps(result, ensure_ascii=False)[:200]}")
        return result

def query_volc_result(task_id: str, request_id: str, max_retries: int = 30, delay: int = 2) -> dict:
    """查询转写结果"""
    uri = "/api/v3/auc/bigmodel/query"
    payload = {"task_id": task_id}
    body_str = json.dumps(payload, separators=(',', ':'))
    
    print(f"⏳ 等待转写结果...")
    
    for i in range(max_retries):
        auth, x_date, x_sha256 = volc_sign_v2(VOLC_ACCESS_KEY, VOLC_SECRET_KEY, 'POST', uri, {}, body_str)
        
        headers = {
            'Content-Type': 'application/json',
            'Host': 'openspeech.bytedance.com',
            'X-Date': x_date,
            'X-Content-Sha256': x_sha256,
            'Authorization': auth,
            'X-Api-Key': VOLC_ACCESS_KEY,
            'X-Api-Resource-Id': VOLC_API_RESOURCE_ID,
            'X-Api-Request-Id': request_id,
            'X-Api-Sequence': '-1'
        }
        
        try:
            response = requests.post(f"https://openspeech.bytedance.com{uri}",
                                    headers=headers, data=body_str, timeout=30)
            result = response.json() if response.text else {}
            
            resp = result.get('resp', {})
            status = resp.get('status', '')
            
            if status == 'completed':
                print(f"✅ 转写完成！")
                return result
            elif status == 'failed':
                raise Exception(f"转写失败: {resp}")
            else:
                if (i + 1) % 5 == 0:
                    print(f"   处理中... ({i+1}/{max_retries}) status={status or 'waiting'}")
                    
        except Exception as e:
            print(f"   查询异常: {e}")
        
        time.sleep(delay)
    
    raise TimeoutError("转写超时")

def save_transcription(result: dict, original_filename: str) -> str:
    """保存转写结果"""
    now = datetime.now()
    diary_dir = Path(f"Diary/{now.strftime('%Y%m')}")
    diary_dir.mkdir(parents=True, exist_ok=True)
    
    base_name = Path(original_filename).stem
    timestamp = now.strftime('%Y%m%d_%H%M%S')
    output_file = diary_dir / f"{base_name}_{timestamp}.md"
    
    text = ""
    utterances = []
    resp = result.get('resp', {})
    
    if 'result' in resp:
        result_data = resp['result']
        text = result_data.get('text', '')
        utterances = result_data.get('utterances', [])
    elif 'text' in resp:
        text = resp['text']
    
    utterances_text = ""
    for u in utterances:
        start = u.get('start_time', 0) / 1000
        end = u.get('end_time', 0) / 1000
        utterances_text += f"[{start:.1f}s-{end:.1f}s] {u.get('text', '')}\n\n"
    
    content = f"""# 语音转写记录

**原始文件**: {original_filename}  
**转写时间**: {now.strftime('%Y-%m-%d %H:%M:%S')}  
**转写引擎**: 火山引擎豆包大模型

---

## 完整文本

{text if text else "（无内容）"}

---

## 分段详情

{utterances_text if utterances_text else "（无分段）"}

---

<details>
<summary>调试信息</summary>

```json
{json.dumps(result, ensure_ascii=False, indent=2)[:2000]}
```
</details>
"""
    
    output_file.write_text(content, encoding='utf-8')
    print(f"📝 转写结果保存: {output_file}")
    return str(output_file)

def process_voice_file(local_file: str):
    """完整处理流程"""
    if not os.path.exists(local_file):
        raise FileNotFoundError(f"文件不存在: {local_file}")
    
    print(f"\n🎯 开始处理: {os.path.basename(local_file)}")
    print("=" * 60)
    
    oss_url = upload_to_oss(local_file)
    result = submit_to_volc(oss_url)
    output_path = save_transcription(result, os.path.basename(local_file))
    
    print("=" * 60)
    print(f"✨ 完成！")
    print(f"   OSS: {oss_url}")
    print(f"   文档: {output_path}")
    
    return {'oss_url': oss_url, 'transcription_file': output_path, 'result': result}

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("用法: python voice_skill.py <语音文件路径>")
        sys.exit(1)
    
    try:
        process_voice_file(sys.argv[1])
        print("\n✅ 全部完成！")
    except Exception as e:
        print(f"\n❌ 失败: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
