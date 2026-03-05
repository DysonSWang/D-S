#!/usr/bin/env python3
"""
直接使用百度 API Key 进行搜索
"""
import requests
import json
import base64
import hmac
import hashlib
from datetime import datetime

# 百度 API Key
API_KEY = "bce-v3/ALTAK-kPsGjEkPDKgHTi3sWzANN/357b810b609b431c6f59bd4c125d8c5613d579e1"

# 提取 AK 和 SK
parts = API_KEY.split('/')
AK = parts[1]  # ALTAK-kPsGjEkPDKgHTi3sWzANN
SK = parts[2]  # 357b810b609b431c6f59bd4c125d8c5613d579e1

def get_baidu_access_token():
    """获取百度 API access token"""
    url = "https://aip.baidubce.com/oauth/2.0/token"
    params = {
        "grant_type": "client_credentials",
        "client_id": AK,
        "client_secret": SK
    }
    
    try:
        response = requests.post(url, params=params, timeout=10)
        data = response.json()
        print(f"Token 响应：{json.dumps(data, indent=2)}")
        return data.get('access_token')
    except Exception as e:
        print(f"获取 Token 失败：{e}")
        return None

def search_with_baidu(query):
    """使用百度文心一言搜索"""
    token = get_baidu_access_token()
    if not token:
        return []
    
    # 尝试文心一言搜索 API
    url = f"https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/search?access_token={token}"
    
    headers = {'Content-Type': 'application/json'}
    payload = {"query": query, "count": 5}
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        print(f"搜索响应状态码：{response.status_code}")
        print(f"搜索响应：{response.text[:500]}")
        return response.json()
    except Exception as e:
        print(f"搜索失败：{e}")
        return None

if __name__ == "__main__":
    print("测试百度搜索 API...")
    print(f"AK: {AK}")
    print(f"SK: {SK[:10]}...")
    print("-" * 50)
    
    result = search_with_baidu("三诺血糖仪")
    print(f"\n最终结果：{json.dumps(result, indent=2, ensure_ascii=False)}")
