#!/usr/bin/env python3
"""Test OSS using raw HTTP API with HMAC-SHA1 signature"""
import hmac
import hashlib
import base64
import os
from datetime import datetime
from email.utils import formatdate
import requests

# Load config from env
ACCESS_KEY_ID = os.getenv('OSS_ACCESS_KEY_ID')
ACCESS_KEY_SECRET = os.getenv('OSS_ACCESS_KEY_SECRET')
ENDPOINT = os.getenv('OSS_ENDPOINT')
BUCKET = os.getenv('OSS_BUCKET')

print("=== OSS API Test ===")
print(f"AccessKey ID: {ACCESS_KEY_ID}")
print(f"Secret: {ACCESS_KEY_SECRET[:10]}...{ACCESS_KEY_SECRET[-5:]}")
print(f"Endpoint: {ENDPOINT}")
print(f"Bucket: {BUCKET}")
print()

# Build request
method = 'GET'
date = formatdate(timeval=None, localtime=False, usegmt=True)
content_type = ''
content_md5 = ''
resource = f'/{BUCKET}/'
string_to_sign = f'{method}\n{content_md5}\n{content_type}\n{date}\n{resource}'

print(f"StringToSign:\n{repr(string_to_sign)}")
print()

# Calculate signature
h = hmac.new(
    ACCESS_KEY_SECRET.encode('utf-8'),
    string_to_sign.encode('utf-8'),
    hashlib.sha1
)
signature = base64.b64encode(h.digest()).decode('utf-8')

print(f"Signature: {signature}")
print()

# Build headers
headers = {
    'Authorization': f'OSS {ACCESS_KEY_ID}:{signature}',
    'Date': date,
    'Host': f'{BUCKET}.{ENDPOINT}'
}

# Make request
url = f'https://{BUCKET}.{ENDPOINT}/'
print(f"Request URL: {url}")
print(f"Headers: {headers}")
print()

try:
    resp = requests.get(url, headers=headers, timeout=10)
    print(f"Status: {resp.status_code}")
    print(f"Response:\n{resp.text[:2000]}")
except Exception as e:
    print(f"Error: {type(e).__name__}: {e}")
