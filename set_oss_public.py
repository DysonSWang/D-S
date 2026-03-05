#!/usr/bin/env python3
"""
设置 OSS 文件为公开读权限
"""

import oss2

# OSS 配置
OSS_BUCKET = 'annsight-images'
OSS_ENDPOINT = 'oss-cn-shenzhen.aliyuncs.com'
OSS_ACCESS_KEY_ID = 'LTAI5tDxzg4bco4ArdWPQpMG'
OSS_ACCESS_KEY_SECRET = 'F3EC9TuQyP9qOznvQrrYcU208uAzCe'
OSS_CDN_URL = 'https://annsight-images.oss-cn-shenzhen.aliyuncs.com'

# 文件路径
oss_object_name = 'docs/设备绑定功能需求文档 - 完整版.docx'

def set_public_read():
    # 认证
    auth = oss2.Auth(OSS_ACCESS_KEY_ID, OSS_ACCESS_KEY_SECRET)
    bucket = oss2.Bucket(auth, OSS_ENDPOINT, OSS_BUCKET)
    
    print(f'设置文件权限：{oss_object_name}')
    print('权限：public-read（公开读）')
    
    try:
        # 设置 ACL 为公开读
        bucket.put_object_acl(oss_object_name, oss2.OBJECT_ACL_PUBLIC_READ)
        print('✅ 权限设置成功！')
        
        # 生成公开访问链接
        public_url = f'{OSS_CDN_URL}/{oss_object_name}'
        print(f'\n📎 公开访问链接：{public_url}')
        
        # 验证权限
        acl_info = bucket.get_object_acl(oss_object_name)
        print(f'当前 ACL: {acl_info.acl}')
        
        return public_url
    except Exception as e:
        print(f'❌ 设置失败：{e}')
        return None

if __name__ == '__main__':
    set_public_read()
