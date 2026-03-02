#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import oss2
import os
import sys
from datetime import datetime

# 从环境变量读取配置
access_key_id = os.environ.get('OSS_ACCESS_KEY_ID')
access_key_secret = os.environ.get('OSS_ACCESS_KEY_SECRET')
bucket_name = os.environ.get('OSS_BUCKET', 'lhong')
endpoint = os.environ.get('OSS_ENDPOINT', 'oss-cn-shenzhen.aliyuncs.com')
prefix = os.environ.get('OSS_BUCKET_PATH_PREFIX', 'wxhm')

if not access_key_id or not access_key_secret:
    print("错误: 未设置OSS_ACCESS_KEY_ID或OSS_ACCESS_KEY_SECRET环境变量")
    sys.exit(1)

if len(sys.argv) < 2:
    print("用法: python upload_oss.py <本地文件路径> [OSS目标路径]")
    sys.exit(1)

local_file = sys.argv[1]

# 生成OSS目标路径
if len(sys.argv) >= 3:
    oss_key = sys.argv[2]
else:
    # 自动生成路径: wxhm/2026-02-12/filename
    filename = os.path.basename(local_file)
    today = datetime.now().strftime('%Y-%m-%d')
    oss_key = f"{prefix}/{today}/{filename}"

# 创建OSS认证对象
auth = oss2.Auth(access_key_id, access_key_secret)

# 创建Bucket对象
bucket = oss2.Bucket(auth, endpoint, bucket_name)

print(f"上传文件: {local_file}")
print(f"目标路径: oss://{bucket_name}/{oss_key}")

try:
    # 上传文件
    result = bucket.put_object_from_file(oss_key, local_file)
    
    if result.status == 200:
        # 生成访问URL
        url = f"https://{bucket_name}.{endpoint}/{oss_key}"
        print(f"✅ 上传成功!")
        print(f"📁 OSS路径: {oss_key}")
        print(f"🔗 访问URL: {url}")
    else:
        print(f"❌ 上传失败，状态码: {result.status}")
        sys.exit(1)
        
except Exception as e:
    print(f"❌ 上传出错: {e}")
    sys.exit(1)
