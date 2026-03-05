#!/usr/bin/env python3
"""
上传 D/s 任务打卡系统 PRD 到阿里云 OSS
"""

import oss2
import os
from datetime import datetime

# OSS 配置
OSS_BUCKET = 'annsight-images'
OSS_ENDPOINT = 'oss-cn-shenzhen.aliyuncs.com'
OSS_ACCESS_KEY_ID = 'LTAI5tDxzg4bco4ArdWPQpMG'
OSS_ACCESS_KEY_SECRET = 'F3EC9TuQyP9qOznvQrrYcU208uAzCe'
OSS_CDN_URL = 'https://annsight-images.oss-cn-shenzhen.aliyuncs.com'

# 要上传的文件
file_path = '/root/.openclaw/workspace/ds-task-app/PRD.md'
oss_object_name = f'ds-task-app/PRD-{datetime.now().strftime("%Y%m%d")}.md'

def upload_to_oss():
    # 认证
    auth = oss2.Auth(OSS_ACCESS_KEY_ID, OSS_ACCESS_KEY_SECRET)
    bucket = oss2.Bucket(auth, OSS_ENDPOINT, OSS_BUCKET)
    
    # 检查文件
    if not os.path.exists(file_path):
        print(f'❌ 文件不存在：{file_path}')
        return None
    
    file_size = os.path.getsize(file_path)
    print(f'准备上传：{file_path}')
    print(f'文件大小：{file_size / 1024:.1f} KB')
    
    # 上传
    print(f'上传到 OSS: {OSS_BUCKET}/{oss_object_name}')
    try:
        bucket.put_object_from_file(oss_object_name, file_path)
        print('✅ 上传成功！')
        
        # 设置公开读权限
        bucket.put_object_acl(oss_object_name, oss2.OBJECT_ACL_PUBLIC_READ)
        print('✅ 权限设置为公开读！')
        
        # 生成访问链接
        file_url = f'{OSS_CDN_URL}/{oss_object_name}'
        print(f'\n📎 公开访问链接：{file_url}')
        
        # 生成带签名的下载链接（7 天有效）
        signed_url = bucket.sign_url('GET', oss_object_name, 604800)  # 7 天 = 604800 秒
        print(f'📥 下载链接（7 天有效）：{signed_url}')
        
        return {
            'public_url': file_url,
            'signed_url': signed_url,
            'object_name': oss_object_name
        }
    except Exception as e:
        print(f'❌ 上传失败：{e}')
        return None

if __name__ == '__main__':
    print('=' * 60)
    print('D/s 任务打卡系统 PRD 上传工具')
    print('=' * 60)
    print()
    
    result = upload_to_oss()
    if result:
        print(f'\n===== 上传完成 =====')
        print(f'文件：{result["object_name"]}')
        print(f'公开访问：{result["public_url"]}')
        print(f'下载链接：{result["signed_url"]}')
        print(f'\n✅ 可以直接将公开访问链接发给专家评审！')
