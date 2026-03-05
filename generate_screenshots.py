#!/usr/bin/env python3
"""
使用 Pillow 生成设备绑定功能的界面示意图
无需浏览器，直接生成 PNG 截图
"""

from PIL import Image, ImageDraw, ImageFont
import os

# 配置
OUTPUT_DIR = '/root/.openclaw/workspace/screenshots'
WIDTH = 375
HEIGHT = 812

# 颜色
COLORS = {
    'bg': '#F5F7FA',
    'white': '#FFFFFF',
    'primary': '#00C2CC',
    'primary_dark': '#00AAB2',
    'glucose': '#FB9851',
    'glucose_dark': '#FB7A1E',
    'text_primary': '#1F2937',
    'text_secondary': '#6B7280',
    'text_tertiary': '#9CA3AF',
    'border': '#E5E7EB',
    'success': '#00C2CC',
    'error': '#F04838',
}

def get_font(size=16):
    """获取字体（使用系统默认字体）"""
    try:
        # 尝试使用中文字体
        font_paths = [
            '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc',
            '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',
            '/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc',
            '/System/Library/Fonts/PingFang.ttc',
            'C:\\Windows\\Fonts\\msyh.ttc',
        ]
        for path in font_paths:
            if os.path.exists(path):
                return ImageFont.truetype(path, size)
    except:
        pass
    # 返回默认字体
    return ImageFont.load_default()

def create_base_image():
    """创建基础画布"""
    return Image.new('RGB', (WIDTH, HEIGHT), COLORS['bg'])

def draw_navbar(draw, title='设备绑定', show_back=True):
    """绘制导航栏"""
    # 背景
    draw.rectangle([0, 0, WIDTH, 44], fill=COLORS['white'])
    # 阴影
    for i in range(3):
        alpha = int(10 * (3-i) / 3)
        draw.line([0, 44+i, WIDTH, 44+i], fill=f'rgba(0,0,0,{alpha})')
    
    # 返回按钮
    if show_back:
        draw.polygon([(16, 22), (24, 14), (24, 30)], fill=COLORS['text_primary'])
        draw.line([(24, 22), (32, 22)], fill=COLORS['text_primary'], width=2)
    
    # 标题
    font = get_font(17)
    bbox = draw.textbbox((0, 0), title, font=font)
    text_width = bbox[2] - bbox[0]
    draw.text(((WIDTH - text_width) / 2, 12), title, fill=COLORS['text_primary'], font=font)

def draw_progress_bar(draw, current_step):
    """绘制进度条"""
    y = 60
    dot_radius = 6
    spacing = 50
    start_x = (WIDTH - (5 * spacing)) / 2
    
    for i in range(6):
        x = start_x + i * spacing
        # 背景圆
        draw.ellipse([x-dot_radius, y-dot_radius, x+dot_radius, y+dot_radius], 
                    fill=COLORS['primary'] if i < current_step else COLORS['text_tertiary'],
                    outline=COLORS['primary'] if i == current_step - 1 else COLORS['border'])
        # 激活状态的圆环
        if i == current_step - 1:
            draw.ellipse([x-dot_radius-2, y-dot_radius-2, x+dot_radius+2, y+dot_radius+2],
                        outline=COLORS['primary'], width=2)

def draw_device_card(draw, x, y, width, height, title, subtitle, color, icon='🩸'):
    """绘制设备卡片"""
    # 卡片背景
    draw.rounded_rectangle([x, y, x+width, y+height], radius=12, fill=COLORS['white'])
    # 彩色左边框
    draw.rounded_rectangle([x, y, x+8, y+height], radius=4, fill=color)
    # 图标
    font_large = get_font(32)
    draw.text((x+24, y+20), icon, font=font_large)
    # 标题
    font_title = get_font(18)
    draw.text((x+70, y+20), title, fill=COLORS['text_primary'], font=font_title)
    # 副标题
    font_sub = get_font(14)
    draw.text((x+70, y+48), subtitle, fill=COLORS['text_secondary'], font=font_sub)
    # 蓝牙标识
    draw.text((x+70, y+70), '蓝牙 4.0 BLE', fill=COLORS['text_tertiary'], font=font_sub)

def draw_guide_step(draw, x, y, step_num, title, description):
    """绘制指引步骤"""
    # 步骤编号圆圈
    draw.ellipse([x, y, x+40, y+40], fill=COLORS['primary'], outline=COLORS['primary_dark'])
    font_num = get_font(18)
    draw.text((x+14, y+8), str(step_num), fill=COLORS['white'], font=font_num)
    # 标题
    font_title = get_font(16)
    draw.text((x+56, y+8), title, fill=COLORS['text_primary'], font=font_title)
    # 描述
    font_desc = get_font(14)
    draw.text((x+56, y+32), description, fill=COLORS['text_secondary'], font=font_desc)

def draw_search_animation(draw, center_x, center_y, frame=0):
    """绘制搜索动画"""
    # 扩散圆环
    for i in range(3):
        radius = 30 + i * 20 + frame * 5
        alpha = int(80 * (3-i) / 3)
        if radius < 150:
            draw.ellipse([center_x-radius, center_y-radius, 
                         center_x+radius, center_y+radius],
                        outline=f'rgba(0,194,204,{alpha})', width=2)
    
    # 搜索图标
    font = get_font(48)
    draw.text((center_x-24, center_y-24), '🔍', font=font)

def draw_device_item(draw, x, y, width, height, name, mac, selected=False):
    """绘制设备列表项"""
    # 背景
    bg_color = COLORS['primary'] if selected else COLORS['white']
    draw.rounded_rectangle([x, y, x+width, y+height], radius=8, fill=bg_color)
    # 边框
    if selected:
        draw.rounded_rectangle([x, y, x+width, y+height], radius=8, 
                              outline=COLORS['primary_dark'], width=2)
    
    # 选择圆圈
    circle_color = COLORS['white'] if selected else COLORS['border']
    draw.ellipse([x+20, y+24, x+44, y+48], fill=COLORS['white'], outline=circle_color)
    if selected:
        draw.ellipse([x+26, y+30, x+38, y+42], fill=COLORS['primary'])
    
    # 设备名称
    font_name = get_font(16)
    draw.text((x+60, y+24), name, fill=COLORS['text_primary'] if not selected else COLORS['white'], font=font_name)
    # MAC 地址
    font_mac = get_font(13)
    mac_color = COLORS['text_tertiary'] if not selected else COLORS['white']
    draw.text((x+60, y+48), f'MAC: {mac}', fill=mac_color, font=font_mac)

def draw_pairing_code(draw, center_x, center_y, code='4 8 2 7 1 5'):
    """绘制配对码"""
    # 配对码框
    draw.rounded_rectangle([center_x-120, center_y-40, center_x+120, center_y+40], 
                          radius=8, fill=COLORS['white'], outline=COLORS['border'])
    font = get_font(28)
    draw.text((center_x-60, center_y-18), code, fill=COLORS['text_primary'], font=font)

def draw_success_icon(draw, center_x, center_y):
    """绘制成功图标"""
    # 绿色圆圈
    draw.ellipse([center_x-40, center_y-40, center_x+40, center_y+40], 
                fill=COLORS['success'])
    # 对勾
    draw.line([(center_x-20, center_y), (center_x-8, center_y+12), (center_x+20, center_y-16)],
             fill=COLORS['white'], width=4)

def draw_button(draw, x, y, width, height, text, enabled=True):
    """绘制按钮"""
    color = COLORS['primary'] if enabled else COLORS['text_tertiary']
    draw.rounded_rectangle([x, y, x+width, y+height], radius=8, fill=color)
    font = get_font(16)
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_color = COLORS['white'] if enabled else COLORS['text_secondary']
    draw.text((x + (width-text_width)/2, y + (height-24)/2), text, fill=text_color, font=font)

# ========== 各个步骤的截图生成函数 ==========

def generate_step1():
    """Step 1: 选择设备类型"""
    img = create_base_image()
    draw = ImageDraw.Draw(img)
    
    draw_navbar(draw, '选择设备')
    draw_progress_bar(draw, 1)
    
    # 标题
    font_title = get_font(20)
    draw.text((24, 100), '请选择设备类型', fill=COLORS['text_primary'], font=font_title)
    
    # 设备卡片
    draw_device_card(draw, 24, 150, WIDTH-48, 110, '血糖仪', '臻准 2000 (BA-2000)', 
                    COLORS['glucose'], '🩸')
    draw_device_card(draw, 24, 280, WIDTH-48, 110, '血压计', 'BA-803', 
                    COLORS['primary'], '💙')
    
    return img

def generate_step2_glucose():
    """Step 2: 血糖仪操作指引"""
    img = create_base_image()
    draw = ImageDraw.Draw(img)
    
    draw_navbar(draw, '操作指引')
    draw_progress_bar(draw, 2)
    
    # 标题
    font_title = get_font(20)
    draw.text((24, 100), '血糖仪绑定指引', fill=COLORS['text_primary'], font=font_title)
    
    # 指引步骤
    guides = [
        (1, '安装试纸', '安装试纸或长按开机键 3 秒开机'),
        (2, '确认蓝牙图标', '确认屏幕显示蓝牙图标（闪烁表示可配对）'),
        (3, '进入蓝牙菜单', '部分型号需进入"设置"→"蓝牙"菜单'),
        (4, '保持距离', '保持设备与手机距离 ≤ 1 米'),
    ]
    
    y = 150
    for step_num, title, desc in guides:
        draw_guide_step(draw, 24, y, step_num, title, desc)
        y += 70
    
    # 底部按钮
    draw_button(draw, 24, HEIGHT-80, WIDTH-48, 48, '已阅读，开始绑定')
    
    return img

def generate_step2_bp():
    """Step 2: 血压计操作指引"""
    img = create_base_image()
    draw = ImageDraw.Draw(img)
    
    draw_navbar(draw, '操作指引')
    draw_progress_bar(draw, 2)
    
    # 标题
    font_title = get_font(20)
    draw.text((24, 100), '血压计绑定指引', fill=COLORS['text_primary'], font=font_title)
    
    # 指引步骤
    guides = [
        (1, '安装电池', '安装 4 节 7 号电池或连接 USB 供电'),
        (2, '缠绕袖带', '正确缠绕袖带于上臂'),
        (3, '开机', '长按电源键 3 秒开机，确认蓝牙图标显示'),
        (4, '进入配对模式', '部分型号需长按"记忆"键 5 秒'),
    ]
    
    y = 150
    for step_num, title, desc in guides:
        draw_guide_step(draw, 24, y, step_num, title, desc)
        y += 70
    
    # 底部按钮
    draw_button(draw, 24, HEIGHT-80, WIDTH-48, 48, '已阅读，开始绑定')
    
    return img

def generate_step3():
    """Step 3: 搜索设备"""
    img = create_base_image()
    draw = ImageDraw.Draw(img)
    
    draw_navbar(draw, '搜索设备')
    draw_progress_bar(draw, 3)
    
    # 搜索动画
    draw_search_animation(draw, WIDTH/2, HEIGHT/2 - 60, frame=2)
    
    # 状态文字
    font_status = get_font(16)
    draw.text((WIDTH/2-60, HEIGHT/2+30), '正在搜索设备...', 
             fill=COLORS['text_primary'], font=font_status)
    
    # 提示文字
    font_hint = get_font(14)
    draw.text((WIDTH/2-100, HEIGHT/2+60), '请确保设备已开启配对模式', 
             fill=COLORS['text_secondary'], font=font_hint)
    
    return img

def generate_step4():
    """Step 4: 选择设备"""
    img = create_base_image()
    draw = ImageDraw.Draw(img)
    
    draw_navbar(draw, '选择设备')
    draw_progress_bar(draw, 4)
    
    # 标题
    font_title = get_font(16)
    draw.text((24, 100), '找到以下设备:', fill=COLORS['text_primary'], font=font_title)
    
    # 设备列表
    draw_device_item(draw, 24, 140, WIDTH-48, 72, 'Sinocare_BA2000_7113', 
                    '00:1A:7D:DA:71:13', selected=True)
    draw_device_item(draw, 24, 224, WIDTH-48, 72, 'Sinocare_BA2000_8254', 
                    '00:1A:7D:DA:82:54', selected=False)
    
    # 底部按钮
    draw_button(draw, 24, HEIGHT-80, WIDTH-48, 48, '连接设备')
    
    return img

def generate_step5():
    """Step 5: 配对确认"""
    img = create_base_image()
    draw = ImageDraw.Draw(img)
    
    draw_navbar(draw, '配对确认')
    draw_progress_bar(draw, 5)
    
    # 标题
    font_title = get_font(16)
    draw.text((24, 100), '请在设备上确认以下配对码:', fill=COLORS['text_primary'], font=font_title)
    
    # 配对码
    draw_pairing_code(draw, WIDTH/2, 180)
    
    # 提示文字
    font_hint = get_font(14)
    draw.text((WIDTH/2-100, 240), '请确认设备屏幕显示的数字一致', 
             fill=COLORS['text_secondary'], font=font_hint)
    
    # 底部按钮
    draw_button(draw, 24, HEIGHT-80, WIDTH-48, 48, '确认配对')
    
    return img

def generate_step6():
    """Step 6: 绑定成功"""
    img = create_base_image()
    draw = ImageDraw.Draw(img)
    
    draw_navbar(draw, '绑定成功', show_back=False)
    draw_progress_bar(draw, 6)
    
    # 成功图标
    draw_success_icon(draw, WIDTH/2, 180)
    
    # 成功文字
    font_success = get_font(24)
    bbox = draw.textbbox((0, 0), '绑定成功!', font=font_success)
    text_width = bbox[2] - bbox[0]
    draw.text(((WIDTH-text_width)/2, 240), '绑定成功!', fill=COLORS['success'], font=font_success)
    
    # 设备信息卡片
    draw.rounded_rectangle([24, 300, WIDTH-24, 390], radius=8, fill=COLORS['white'])
    font_info = get_font(15)
    draw.text((40, 320), '血糖仪 · 臻准 2000', fill=COLORS['text_primary'], font=font_info)
    draw.text((40, 345), 'MAC: 00:1A:7D:DA:71:13', fill=COLORS['text_secondary'], font=font_info)
    draw.text((40, 370), '绑定时间：2026-03-03 15:30', fill=COLORS['text_tertiary'], font=get_font(13))
    
    # 底部按钮
    draw_button(draw, 24, HEIGHT-80, WIDTH-48, 48, '完成')
    
    return img

def main():
    """生成所有截图"""
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    screenshots = [
        ('step1_select_device.png', generate_step1),
        ('step2_guide_glucose.png', generate_step2_glucose),
        ('step2_guide_bp.png', generate_step2_bp),
        ('step3_searching.png', generate_step3),
        ('step4_device_list.png', generate_step4),
        ('step5_pairing.png', generate_step5),
        ('step6_success.png', generate_step6),
    ]
    
    print(f'开始生成截图，保存到：{OUTPUT_DIR}')
    for filename, generator in screenshots:
        filepath = os.path.join(OUTPUT_DIR, filename)
        img = generator()
        img.save(filepath, 'PNG')
        print(f'✓ 生成：{filename}')
    
    print(f'\n完成！共生成 {len(screenshots)} 张截图')
    print(f'截图目录：{OUTPUT_DIR}')

if __name__ == '__main__':
    main()
