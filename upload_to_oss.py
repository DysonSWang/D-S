#!/usr/bin/env python3
"""
上传文件到阿里云 OSS
"""

import oss2
import os

# OSS 配置
OSS_BUCKET = 'annsight-images'
OSS_ENDPOINT = 'oss-cn-shenzhen.aliyuncs.com'
OSS_ACCESS_KEY_ID = 'LTAI5tDxzg4bco4ArdWPQpMG'
OSS_ACCESS_KEY_SECRET = 'F3EC9TuQyP9qOznvQrrYcU208uAzCe'
OSS_CDN_URL = 'https://annsight-images.oss-cn-shenzhen.aliyuncs.com'

# 要上传的文件
file_path = '/root/.openclaw/workspace/设备绑定功能需求文档 - 完整版.docx'
oss_object_name = 'docs/设备绑定功能需求文档 - 完整版.docx'

def upload_to_oss():
    # 认证
    auth = oss2.Auth(OSS_ACCESS_KEY_ID, OSS_ACCESS_KEY_SECRET)
    bucket = oss2.Bucket(auth, OSS_ENDPOINT, OSS_BUCKET)
    
    # 检查文件
    if not os.path.exists(file_path):
        print(f'文件不存在：{file_path}')
        return None
    
    file_size = os.path.getsize(file_path)
    print(f'准备上传：{file_path}')
    print(f'文件大小：{file_size / 1024:.1f} KB')
    
    # 上传
    print(f'上传到 OSS: {OSS_BUCKET}/{oss_object_name}')
    try:
        bucket.put_object_from_file(oss_object_name, file_path)
        print('✅ 上传成功！')
        
        # 生成访问链接
        file_url = f'{OSS_CDN_URL}/{oss_object_name}'
        print(f'\n📎 访问链接：{file_url}')
        
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
    result = upload_to_oss()
    if result:
        print(f'\n===== 上传完成 =====')
        print(f'文件：{result["object_name"]}')
        print(f'公开访问：{result["public_url"]}')
        print(f'下载链接：{result["signed_url"]}')
