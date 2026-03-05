#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
任务申请与审批系统 + 里程碑 + 故事集 + 商城积分 + 小屋装扮 - 命令行快捷版本

【任务命令】
    python task_cli.py apply <标题> <描述> [天数]
    python task_cli.py random [天数]
    python task_cli.py approve <ID> yes|no [备注]
    python task_cli.py complete <ID> [结果]
    python task_cli.py extend <ID> <天数> [原因]
    python task_cli.py query [ID]
    python task_cli.py list [--status 状态]

【里程碑命令】
    python task_cli.py milestone init <YYYY-MM-DD>
    python task_cli.py milestone show
    python task_cli.py milestone add <名称> [描述]
    python task_cli.py milestone list

【故事集命令】
    python task_cli.py story add <标题> <内容> [图片路径]
    python task_cli.py story list [页数]
    python task_cli.py story view <ID>
    python task_cli.py story search <关键词>
    python task_cli.py story tag <ID> <标签>
    python task_cli.py story timeline [YYYY-MM]

【商城命令】
    python task_cli.py shop                   浏览商城
    python task_cli.py shop balance           查看积分余额
    python task_cli.py shop recharge <积分>   充值积分
    python task_cli.py shop redeem <商品 ID>  兑换商品
    python task_cli.py shop orders            查看兑换记录
    python task_cli.py shop add <名称> <积分> [描述]  添加商品（主人）

【小屋命令】
    python task_cli.py room                   查看我的小屋
    python task_cli.py room decorate          装饰小屋
    python task_cli.py room items             查看拥有的物品
"""

import json
import os
import random
import sys
import shutil
from datetime import datetime, timedelta
from pathlib import Path

DATA_FILE = Path.home() / ".task_manager" / "tasks.json"
MILESTONE_FILE = Path.home() / ".task_manager" / "milestones.json"
STORY_FILE = Path.home() / ".task_manager" / "stories.json"
SHOP_FILE = Path.home() / ".task_manager" / "shop.json"
ROOM_FILE = Path.home() / ".task_manager" / "room.json"
STORY_IMAGES_DIR = Path.home() / ".task_manager" / "images"

RANDOM_TASKS = [
    {"title": "学习新技能", "description": "学习并掌握一项新技能", "points": 50},
    {"title": "健身挑战", "description": "完成一周健身计划", "points": 80},
    {"title": "阅读任务", "description": "阅读一本书并写读后感", "points": 60},
    {"title": "整理房间", "description": "彻底整理清洁房间", "points": 40},
    {"title": "创意写作", "description": "写一篇短篇小说或诗歌", "points": 70},
    {"title": "烹饪挑战", "description": "学习制作一道新菜", "points": 50},
    {"title": "志愿服务", "description": "参与社区志愿活动", "points": 100},
    {"title": "技能提升", "description": "完成一个在线课程", "points": 150},
    {"title": "早起挑战", "description": "连续 7 天 6 点前起床", "points": 80},
    {"title": "断舍离", "description": "清理 10 件不需要的物品", "points": 40},
    {"title": "冥想练习", "description": "每天冥想 15 分钟", "points": 50},
    {"title": "记账任务", "description": "记录一周所有开支", "points": 30},
]

STATUS_PENDING = "待审批"
STATUS_APPROVED = "已批准"
STATUS_REJECTED = "已拒绝"
STATUS_COMPLETED = "已完成"
STATUS_FAILED = "已失败"
STATUS_EXTENDED = "已延期"

MILESTONE_DAYS = [1, 7, 14, 30, 50, 100, 200, 300, 365, 500, 666, 888, 1000, 1500, 2000]

# 默认商城商品 - 虚拟装饰 + 精美礼物
DEFAULT_SHOP_ITEMS = [
    # ===== 虚拟装饰物品（装扮小屋）=====
    {"id": "DECOR-001", "name": "温馨台灯", "points": 80, "description": "柔和的暖光台灯，为小屋增添温馨", "type": "decor", "icon": "🏮", "category": "灯具"},
    {"id": "DECOR-002", "name": "毛绒地毯", "points": 120, "description": "柔软舒适的毛绒地毯，踩上去暖暖的", "type": "decor", "icon": "🧶", "category": "家具"},
    {"id": "DECOR-003", "name": "星空投影灯", "points": 200, "description": "投影出浪漫星空，夜晚不再孤单", "type": "decor", "icon": "🌌", "category": "灯具"},
    {"id": "DECOR-004", "name": "绿植盆栽", "points": 60, "description": "生机勃勃的小绿植，为房间增添活力", "type": "decor", "icon": "🪴", "category": "植物"},
    {"id": "DECOR-005", "name": "香薰蜡烛", "points": 100, "description": "淡淡花香，营造浪漫氛围", "type": "decor", "icon": "🕯️", "category": "香氛"},
    {"id": "DECOR-006", "name": "照片墙", "points": 150, "description": "挂满美好回忆的照片墙", "type": "decor", "icon": "🖼️", "category": "装饰"},
    {"id": "DECOR-007", "name": "懒人沙发", "points": 300, "description": "超舒适的懒人沙发，躺下就不想起来", "type": "decor", "icon": "🛋️", "category": "家具"},
    {"id": "DECOR-008", "name": "小夜灯", "points": 50, "description": "温柔的夜灯，陪伴每一个夜晚", "type": "decor", "icon": "💡", "category": "灯具"},
    {"id": "DECOR-009", "name": "挂画装饰", "points": 180, "description": "艺术感满满的装饰画", "type": "decor", "icon": "🎨", "category": "装饰"},
    {"id": "DECOR-010", "name": "窗帘", "points": 250, "description": "遮光又美观的窗帘", "type": "decor", "icon": "🪟", "category": "家具"},
    {"id": "DECOR-011", "name": "小摆件", "points": 80, "description": "可爱的桌面小摆件", "type": "decor", "icon": "🧸", "category": "装饰"},
    {"id": "DECOR-012", "name": "书架", "points": 350, "description": "摆放书籍和装饰品的书架", "type": "decor", "icon": "📚", "category": "家具"},
    {"id": "DECOR-013", "name": "鲜花束", "points": 120, "description": "新鲜的鲜花，让心情变好", "type": "decor", "icon": "💐", "category": "植物"},
    {"id": "DECOR-014", "name": "抱枕", "points": 90, "description": "柔软舒适的抱枕", "type": "decor", "icon": "🫘", "category": "家具"},
    {"id": "DECOR-015", "name": "风铃", "points": 70, "description": "风吹过会发出悦耳声音的风铃", "type": "decor", "icon": "🎐", "category": "装饰"},
    
    # ===== 精美实物礼物 =====
    {"id": "GIFT-001", "name": "巧克力礼盒", "points": 200, "description": "精美包装的巧克力礼盒，甜蜜满满", "type": "gift", "icon": "🍫", "category": "食品"},
    {"id": "GIFT-002", "name": "香水小样", "points": 300, "description": "精致香水小样，清新淡雅", "type": "gift", "icon": "🧴", "category": "美妆"},
    {"id": "GIFT-003", "name": "口红", "points": 500, "description": "品牌口红，提升气色", "type": "gift", "icon": "💄", "category": "美妆"},
    {"id": "GIFT-004", "name": "手链", "points": 600, "description": "精致手链，日常百搭", "type": "gift", "icon": "📿", "category": "饰品"},
    {"id": "GIFT-005", "name": "项链", "points": 800, "description": "优雅项链，点亮颈部线条", "type": "gift", "icon": "🧿", "category": "饰品"},
    {"id": "GIFT-006", "name": "手表", "points": 1200, "description": "精美手表，记录每一刻", "type": "gift", "icon": "⌚", "category": "饰品"},
    {"id": "GIFT-007", "name": "钱包", "points": 400, "description": "实用又好看的钱包", "type": "gift", "icon": "👛", "category": "配饰"},
    {"id": "GIFT-008", "name": "围巾", "points": 250, "description": "温暖柔软的围巾", "type": "gift", "icon": "🧣", "category": "服饰"},
    {"id": "GIFT-009", "name": "毛绒玩具", "points": 180, "description": "可爱的毛绒玩具，陪伴入眠", "type": "gift", "icon": "🧸", "category": "玩具"},
    {"id": "GIFT-010", "name": "书籍", "points": 150, "description": "精心挑选的好书", "type": "gift", "icon": "📖", "category": "文化"},
    {"id": "GIFT-011", "name": "花束", "points": 300, "description": "精美包装的鲜花花束", "type": "gift", "icon": "💐", "category": "鲜花"},
    {"id": "GIFT-012", "name": "蛋糕", "points": 250, "description": "甜蜜的生日蛋糕", "type": "gift", "icon": "🎂", "category": "食品"},
    {"id": "GIFT-013", "name": "耳机", "points": 600, "description": "高颜值耳机，音质出色", "type": "gift", "icon": "🎧", "category": "数码"},
    {"id": "GIFT-014", "name": "杯子", "points": 120, "description": "精致的马克杯或保温杯", "type": "gift", "icon": "☕", "category": "生活用品"},
    {"id": "GIFT-015", "name": "笔记本", "points": 100, "description": "精美的笔记本，记录生活", "type": "gift", "icon": "📔", "category": "文具"},
    
    # ===== 特权卡券 =====
    {"id": "CARD-001", "name": "免做卡（小）", "points": 100, "description": "免除一次小型任务的惩罚", "type": "card", "icon": "🎫", "category": "特权"},
    {"id": "CARD-002", "name": "免做卡（大）", "points": 300, "description": "免除一次大型任务的惩罚", "type": "card", "icon": "🎫", "category": "特权"},
    {"id": "CARD-003", "name": "延期卡", "points": 150, "description": "任务期限延长 3 天", "type": "card", "icon": "⏰", "category": "特权"},
    {"id": "CARD-004", "name": "撒娇卡", "points": 50, "description": "获得一次向主人撒娇的权利", "type": "card", "icon": "🥺", "category": "特权"},
    {"id": "CARD-005", "name": "愿望券", "points": 1000, "description": "实现一个合理的小愿望", "type": "card", "icon": "✨", "category": "特权"},
    
    # ===== 体验券 =====
    {"id": "EXP-001", "name": "按摩券", "points": 200, "description": "获得主人 15 分钟按摩服务", "type": "exp", "icon": "💆", "category": "体验"},
    {"id": "EXP-002", "name": "拥抱券", "points": 80, "description": "获得主人一个温暖的拥抱", "type": "exp", "icon": "🤗", "category": "体验"},
    {"id": "EXP-003", "name": "亲亲券", "points": 100, "description": "获得主人一个亲亲", "type": "exp", "icon": "💋", "category": "体验"},
    {"id": "EXP-004", "name": "约会券", "points": 800, "description": "主人安排一次约会", "type": "exp", "icon": "💕", "category": "体验"},
    {"id": "EXP-005", "name": "电影之夜", "points": 400, "description": "一起看电影 + 爆米花", "type": "exp", "icon": "🎬", "category": "体验"},
    {"id": "EXP-006", "name": "零食大礼包", "points": 300, "description": "主人购买的零食大礼包", "type": "exp", "icon": "🍬", "category": "体验"},
]


def ensure_data():
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    STORY_IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    
    if not DATA_FILE.exists():
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump([], f, ensure_ascii=False, indent=2)
    if not MILESTONE_FILE.exists():
        with open(MILESTONE_FILE, "w", encoding="utf-8") as f:
            json.dump({"start_date": None, "milestones": []}, f, ensure_ascii=False, indent=2)
    if not STORY_FILE.exists():
        with open(STORY_FILE, "w", encoding="utf-8") as f:
            json.dump({"stories": []}, f, ensure_ascii=False, indent=2)
    if not SHOP_FILE.exists():
        with open(SHOP_FILE, "w", encoding="utf-8") as f:
            json.dump({
                "balance": 0,
                "recharge_history": [],
                "shop_items": DEFAULT_SHOP_ITEMS.copy(),
                "orders": []
            }, f, ensure_ascii=False, indent=2)
    if not ROOM_FILE.exists():
        with open(ROOM_FILE, "w", encoding="utf-8") as f:
            json.dump({
                "items": [],
                "decorations": []
            }, f, ensure_ascii=False, indent=2)


def load():
    ensure_data()
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return []


def save(tasks):
    ensure_data()
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(tasks, f, ensure_ascii=False, indent=2)


def load_milestones():
    ensure_data()
    try:
        with open(MILESTONE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return {"start_date": None, "milestones": []}


def save_milestones(data):
    ensure_data()
    with open(MILESTONE_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def load_stories():
    ensure_data()
    try:
        with open(STORY_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return {"stories": []}


def save_stories(data):
    ensure_data()
    with open(STORY_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def load_shop():
    ensure_data()
    try:
        with open(SHOP_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return {
            "balance": 0,
            "recharge_history": [],
            "shop_items": DEFAULT_SHOP_ITEMS.copy(),
            "orders": []
        }


def save_shop(data):
    ensure_data()
    with open(SHOP_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def load_room():
    ensure_data()
    try:
        with open(ROOM_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return {"items": [], "decorations": []}


def save_room(data):
    ensure_data()
    with open(ROOM_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def gen_id(tasks):
    if not tasks:
        return "TASK-0001"
    return f"TASK-{max(int(t['id'].split('-')[1]) for t in tasks) + 1:04d}"


def gen_story_id(stories):
    if not stories:
        return "STORY-0001"
    return f"STORY-{max(int(s['id'].split('-')[1]) for s in stories) + 1:04d}"


def gen_order_id(orders):
    if not orders:
        return "ORDER-0001"
    return f"ORDER-{max(int(o['id'].split('-')[1]) for o in orders) + 1:04d}"


def get_together_days(start_date_str):
    if not start_date_str:
        return None
    start = datetime.strptime(start_date_str, "%Y-%m-%d")
    delta = datetime.now() - start
    return delta.days


def get_next_milestone(current_days):
    for day in MILESTONE_DAYS:
        if day > current_days:
            return day
    return None


def copy_image_to_storage(image_path):
    if not image_path:
        return None
    
    src = Path(image_path)
    if not src.exists():
        print(f"⚠️  图片不存在：{image_path}")
        return None
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    ext = src.suffix.lower()
    if ext not in ['.jpg', '.jpeg', '.png', '.gif', '.webp']:
        print(f"⚠️  不支持的图片格式：{ext}")
        return None
    
    new_name = f"{timestamp}{ext}"
    dst = STORY_IMAGES_DIR / new_name
    
    shutil.copy2(src, dst)
    return str(dst)


def show_together_time():
    ms = load_milestones()
    days = get_together_days(ms.get("start_date"))
    if days:
        next_ms = get_next_milestone(days)
        if next_ms:
            print(f"\n💕 在一起第 {days} 天（下一个里程碑：{next_ms} 天）")
        else:
            print(f"\n💕 在一起第 {days} 天")


def show_balance():
    """显示积分余额"""
    shop = load_shop()
    print(f"💰 积分余额：{shop['balance']} 分")
    return shop['balance']


# ============== 任务命令 ==============

def cmd_apply(args):
    if len(args) < 2:
        print("用法：task_cli.py apply <标题> <描述> [天数]")
        return
    title = args[0]
    desc = args[1]
    days = int(args[2]) if len(args) > 2 and args[2].isdigit() else 7

    tasks = load()
    tid = gen_id(tasks)
    now = datetime.now()
    deadline = now + timedelta(days=days)

    tasks.append({
        "id": tid, "title": title, "description": desc,
        "applicant": "奴", "created_at": now.isoformat(),
        "deadline": deadline.isoformat(), "extended_at": None,
        "new_deadline": None, "status": STATUS_PENDING,
        "is_random": False, "approval_note": "", "completed_at": None, "result": "",
        "points": 0
    })
    save(tasks)

    show_together_time()
    show_balance()
    print(f"\n✅ 任务申请成功！")
    print(f"   ID: {tid} | 标题：{title}")
    print(f"   期限：{deadline.strftime('%Y-%m-%d %H:%M')} 前")
    print(f"   状态：{STATUS_PENDING}（等待主人审批）")


def cmd_random(args):
    days = int(args[0]) if args and args[0].isdigit() else 7

    tasks = load()
    tid = gen_id(tasks)
    now = datetime.now()
    deadline = now + timedelta(days=days)
    rt = random.choice(RANDOM_TASKS)

    tasks.append({
        "id": tid, "title": rt["title"], "description": rt["description"],
        "applicant": "奴", "created_at": now.isoformat(),
        "deadline": deadline.isoformat(), "extended_at": None,
        "new_deadline": None, "status": STATUS_PENDING,
        "is_random": True, "approval_note": "", "completed_at": None, "result": "",
        "points": rt.get("points", 50)
    })
    save(tasks)

    show_together_time()
    show_balance()
    print(f"\n🎲 随机任务抽取成功！")
    print(f"   ID: {tid} | 标题：{rt['title']}")
    print(f"   描述：{rt['description']}")
    print(f"   奖励：{rt.get('points', 50)} 积分")
    print(f"   期限：{deadline.strftime('%Y-%m-%d %H:%M')} 前")
    print(f"   状态：{STATUS_PENDING}（等待主人审批）")


def cmd_approve(args):
    if len(args) < 2:
        print("用法：task_cli.py approve <任务 ID> yes|no [备注]")
        return
    tid, approve = args[0], args[1].lower() == "yes" or args[1].lower() == "y"
    note = args[2] if len(args) > 2 else ""

    tasks = load()
    for i, t in enumerate(tasks):
        if t["id"] == tid:
            if t["status"] != STATUS_PENDING:
                print(f"❌ 任务 {tid} 状态为 {t['status']}，无法审批")
                return
            tasks[i]["status"] = STATUS_APPROVED if approve else STATUS_REJECTED
            tasks[i]["approval_note"] = note
            save(tasks)
            
            show_together_time()
            show_balance()
            print(f"\n✅ 任务 {tid} 已{'批准' if approve else '拒绝'}" + (f" - {note}" if note else ""))
            return
    print(f"❌ 任务 {tid} 不存在")


def cmd_complete(args):
    if len(args) < 1:
        print("用法：task_cli.py complete <任务 ID> [结果]")
        return
    tid = args[0]
    result = args[1] if len(args) > 1 else ""

    tasks = load()
    for i, t in enumerate(tasks):
        if t["id"] == tid:
            if t["status"] not in [STATUS_APPROVED, STATUS_EXTENDED]:
                print(f"❌ 任务 {tid} 状态为 {t['status']}，无法完成")
                return
            deadline = datetime.fromisoformat(t["new_deadline"] or t["deadline"])
            if datetime.now() > deadline:
                tasks[i]["status"] = STATUS_FAILED
                save(tasks)
                print(f"❌ 任务 {tid} 已超期，无法完成")
                return
            
            points = t.get("points", 50)
            if not points:
                points = 50
            
            tasks[i]["status"] = STATUS_COMPLETED
            tasks[i]["completed_at"] = datetime.now().isoformat()
            tasks[i]["result"] = result
            tasks[i]["points"] = points
            save(tasks)
            
            shop = load_shop()
            shop["balance"] += points
            shop["recharge_history"].append({
                "type": "task_reward",
                "points": points,
                "task_id": tid,
                "date": datetime.now().isoformat(),
                "note": f"完成任务 {tid}"
            })
            save_shop(shop)
            
            show_together_time()
            print(f"\n✅ 任务 {tid} 已完成！")
            print(f"   结果：{result}")
            print(f"   🎉 获得积分：+{points} 分")
            print(f"   💰 当前余额：{shop['balance']} 分")
            return
    print(f"❌ 任务 {tid} 不存在")


def cmd_extend(args):
    if len(args) < 2:
        print("用法：task_cli.py extend <任务 ID> <天数> [原因]")
        return
    tid, days = args[0], int(args[1])
    reason = args[2] if len(args) > 2 else ""

    tasks = load()
    for i, t in enumerate(tasks):
        if t["id"] == tid:
            if t["status"] not in [STATUS_APPROVED, STATUS_EXTENDED]:
                print(f"❌ 任务 {tid} 状态为 {t['status']}，无法延期")
                return
            if t["extended_at"]:
                print(f"❌ 任务 {tid} 已经延期过，无法再次延期")
                return
            deadline = datetime.fromisoformat(t["deadline"])
            if datetime.now() > deadline:
                tasks[i]["status"] = STATUS_FAILED
                save(tasks)
                print(f"❌ 任务 {tid} 已超期失败，无法延期")
                return
            new_dl = deadline + timedelta(days=days)
            tasks[i]["extended_at"] = datetime.now().isoformat()
            tasks[i]["new_deadline"] = new_dl.isoformat()
            tasks[i]["status"] = STATUS_EXTENDED
            save(tasks)
            
            show_together_time()
            show_balance()
            print(f"\n✅ 任务 {tid} 延期成功！")
            print(f"   原期限：{deadline.strftime('%Y-%m-%d')}")
            print(f"   新期限：{new_dl.strftime('%Y-%m-%d')}")
            if reason:
                print(f"   原因：{reason}")
            return
    print(f"❌ 任务 {tid} 不存在")


def cmd_query(args):
    tasks = load()
    
    show_together_time()
    show_balance()
    
    if args:
        for t in tasks:
            if t["id"] == args[0]:
                dl = datetime.fromisoformat(t["new_deadline"] or t["deadline"])
                days_left = (dl - datetime.now()).days
                print(f"\n📋 任务详情")
                print(f"   ID: {t['id']}")
                print(f"   标题：{t['title']}")
                print(f"   描述：{t['description']}")
                print(f"   状态：{t['status']}")
                print(f"   期限：{dl.strftime('%Y-%m-%d %H:%M')} ({'剩余' + str(days_left) + '天' if days_left > 0 else '已超期'})")
                if t.get("points"):
                    print(f"   积分奖励：{t['points']} 分")
                if t["approval_note"]: print(f"   备注：{t['approval_note']}")
                if t["result"]: print(f"   结果：{t['result']}")
                return
        print(f"❌ 任务 {args[0]} 不存在")
    else:
        if not tasks:
            print("📭 暂无任务")
            return
        print(f"\n📋 任务列表（共 {len(tasks)} 个）")
        print("-" * 70)
        for t in tasks:
            dl = datetime.fromisoformat(t["new_deadline"] or t["deadline"])
            days_left = (dl - datetime.now()).days
            points_str = f" [{t.get('points', 0)}分]" if t.get('points') else ""
            print(f"{t['id']} | {t['title'][:18]:<18} | {t['status']:<8} | {dl.strftime('%Y-%m-%d')} | {'剩余' + str(days_left) + '天' if days_left > 0 else '已超期'}{points_str}")
        print("-" * 70)


def cmd_list(args):
    tasks = load()
    status_filter = None
    for a in args:
        if a.startswith("--status="):
            status_filter = a.split("=")[1]

    show_together_time()
    show_balance()

    if status_filter:
        tasks = [t for t in tasks if t["status"] == status_filter]

    if not tasks:
        print("📭 暂无任务")
        return

    print(f"\n📋 任务列表（共 {len(tasks)} 个）")
    print("-" * 70)
    for t in tasks:
        dl = datetime.fromisoformat(t["new_deadline"] or t["deadline"])
        days_left = (dl - datetime.now()).days
        points_str = f" [{t.get('points', 0)}分]" if t.get('points') else ""
        print(f"{t['id']} | {t['title'][:18]:<18} | {t['status']:<8} | {dl.strftime('%Y-%m-%d')} | {'剩余' + str(days_left) + '天' if days_left > 0 else '已超期'}{points_str}")
    print("-" * 70)


def cmd_check(args):
    tasks = load()
    changed = False
    for i, t in enumerate(tasks):
        if t["status"] in [STATUS_APPROVED, STATUS_EXTENDED]:
            dl = datetime.fromisoformat(t["new_deadline"] or t["deadline"])
            if datetime.now() > dl:
                tasks[i]["status"] = STATUS_FAILED
                changed = True
    if changed:
        save(tasks)
        print("⚠️  已更新超期任务状态")
    else:
        print("✅ 无超期任务")


# ============== 里程碑命令 ==============

def cmd_milestone_init(args):
    if len(args) < 1:
        print("用法：task_cli.py milestone init <YYYY-MM-DD>")
        return
    
    date_str = args[0]
    try:
        datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        print(f"❌ 日期格式错误，请使用 YYYY-MM-DD 格式")
        return
    
    ms = load_milestones()
    if ms.get("start_date"):
        print(f"⚠️  已存在在一起日期：{ms['start_date']}")
        overwrite = input("是否覆盖？(y/n): ").strip().lower()
        if overwrite != "y":
            print("已取消")
            return
    
    ms["start_date"] = date_str
    save_milestones(ms)
    
    days = get_together_days(date_str)
    achieved = get_achieved_milestones(date_str, ms.get("milestones", []))
    
    print(f"\n💕 在一起日期已设置：{date_str}")
    print(f"   至今：{days} 天")
    
    if achieved:
        print(f"\n🎯 已达成的里程碑：")
        for m in achieved:
            custom_note = ""
            if m["custom"] and m["custom"].get("note"):
                custom_note = f" - {m['custom']['note']}"
            print(f"   ✅ {m['days']} 天 ({m['date']}){custom_note}")
    
    next_ms = get_next_milestone(days)
    if next_ms:
        next_date = (datetime.strptime(date_str, "%Y-%m-%d") + timedelta(days=next_ms)).strftime("%Y-%m-%d")
        print(f"\n🎯 下一个里程碑：{next_ms} 天 ({next_date})")


def cmd_milestone_show(args):
    ms = load_milestones()
    
    if not ms.get("start_date"):
        print("📭 尚未设置在一起日期")
        return
    
    start_date = ms["start_date"]
    days = get_together_days(start_date)
    start = datetime.strptime(start_date, "%Y-%m-%d")
    
    weeks = days // 7
    months = days // 30
    years = days // 365
    
    print(f"\n💕 在一起时间")
    print(f"   开始日期：{start_date}")
    print(f"   至今：{days} 天")
    if years > 0:
        print(f"   约：{years} 年 {months % 12} 个月 {days % 30} 天")
    elif months > 0:
        print(f"   约：{months} 个月 {days % 30} 天")
    else:
        print(f"   约：{weeks} 周 {days % 7} 天")
    
    achieved = get_achieved_milestones(start_date, ms.get("milestones", []))
    if achieved:
        print(f"\n🎯 已达成的里程碑")
        print("   " + "-" * 50)
        for m in achieved:
            custom_note = ""
            if m["custom"] and m["custom"].get("note"):
                custom_note = f" - {m['custom']['note']}"
            elif m["custom"] and m["custom"].get("description"):
                custom_note = f" - {m['custom']['description']}"
            print(f"   ✅ {m['days']:>5} 天  {m['date']}{custom_note}")
        print("   " + "-" * 50)
    
    next_ms = get_next_milestone(days)
    if next_ms:
        next_date = (start + timedelta(days=next_ms)).strftime("%Y-%m-%d")
        days_to_go = next_ms - days
        print(f"\n🎯 下一个里程碑：{next_ms} 天")
        print(f"   日期：{next_date}")
        print(f"   还有：{days_to_go} 天")


def cmd_milestone_add(args):
    if len(args) < 1:
        print("用法：task_cli.py milestone add <名称> [描述]")
        return
    
    ms = load_milestones()
    
    if not ms.get("start_date"):
        print("❌ 请先设置在一起日期")
        return
    
    name = args[0]
    description = " ".join(args[1:]) if len(args) > 1 else ""
    
    days = get_together_days(ms["start_date"])
    
    milestone = {
        "name": name,
        "description": description,
        "days": days,
        "date": datetime.now().strftime("%Y-%m-%d"),
        "created_at": datetime.now().isoformat()
    }
    
    if "milestones" not in ms:
        ms["milestones"] = []
    ms["milestones"].append(milestone)
    save_milestones(ms)
    
    print(f"\n📌 里程碑已添加！")
    print(f"   名称：{name}")
    print(f"   在一起第：{days} 天")
    print(f"   日期：{milestone['date']}")
    if description:
        print(f"   描述：{description}")


def get_achieved_milestones(start_date_str, milestones_list):
    if not start_date_str:
        return []
    start = datetime.strptime(start_date_str, "%Y-%m-%d")
    today = datetime.now()
    total_days = (today - start).days
    
    achieved = []
    for day in MILESTONE_DAYS:
        if day <= total_days:
            milestone_date = start + timedelta(days=day)
            custom = next((m for m in milestones_list if m.get("days") == day), None)
            achieved.append({
                "days": day,
                "date": milestone_date.strftime("%Y-%m-%d"),
                "custom": custom
            })
    return achieved


def cmd_milestone_list(args):
    ms = load_milestones()
    
    if not ms.get("start_date"):
        print("📭 尚未设置在一起日期")
        return
    
    start_date = ms["start_date"]
    days = get_together_days(start_date)
    
    print(f"\n💕 在一起第 {days} 天（始于 {start_date}）")
    print("\n🎯 预设里程碑")
    print("-" * 60)
    
    achieved = get_achieved_milestones(start_date, ms.get("milestones", []))
    for m in achieved:
        custom_note = ""
        if m["custom"] and m["custom"].get("note"):
            custom_note = f" - {m['custom']['note']}"
        elif m["custom"] and m["custom"].get("description"):
            custom_note = f" - {m['custom']['description']}"
        print(f"  ✅ {m['days']:>5} 天  {m['date']}{custom_note}")
    
    next_ms = get_next_milestone(days)
    if next_ms:
        next_date = (datetime.strptime(start_date, "%Y-%m-%d") + timedelta(days=next_ms)).strftime("%Y-%m-%d")
        print(f"  ⏳ {next_ms:>5} 天  {next_date} （下一个）")
        for d in MILESTONE_DAYS:
            if d > next_ms:
                future_date = (datetime.strptime(start_date, "%Y-%m-%d") + timedelta(days=d)).strftime("%Y-%m-%d")
                print(f"  ⏳ {d:>5} 天  {future_date}")
                if d >= next_ms + 300:
                    break
    
    print("-" * 60)


# ============== 故事集命令 ==============

def cmd_story_add(args):
    if len(args) < 2:
        print("用法：task_cli.py story add <标题> <内容> [图片路径]")
        return
    
    title = args[0]
    content = " ".join(args[1:-1]) if len(args) > 2 and args[-1].endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')) else " ".join(args[1:])
    image_path = args[-1] if len(args) > 2 and args[-1].endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')) else None
    
    stories_data = load_stories()
    stories = stories_data.get("stories", [])
    
    story_id = gen_story_id(stories)
    now = datetime.now()
    
    image_storage_path = None
    if image_path:
        image_storage_path = copy_image_to_storage(image_path)
    
    ms = load_milestones()
    together_days = get_together_days(ms.get("start_date"))
    
    story = {
        "id": story_id,
        "title": title,
        "content": content,
        "author": "双方",
        "created_at": now.isoformat(),
        "date": now.strftime("%Y-%m-%d"),
        "together_days": together_days,
        "image": image_storage_path,
        "tags": [],
        "likes": 0
    }
    
    stories.append(story)
    stories_data["stories"] = stories
    save_stories(stories_data)
    
    show_together_time()
    show_balance()
    print(f"\n📖 故事已添加！")
    print(f"   ID: {story_id}")
    print(f"   标题：{title}")
    print(f"   在一起第：{together_days if together_days else '未知'} 天")
    print(f"   日期：{story['date']}")
    if image_storage_path:
        print(f"   图片：{image_storage_path}")


def cmd_story_list(args):
    page = int(args[0]) if args and args[0].isdigit() else 1
    per_page = 10
    
    stories_data = load_stories()
    stories = stories_data.get("stories", [])
    
    if not stories:
        print("📭 暂无故事记录")
        return
    
    stories.sort(key=lambda x: x["created_at"], reverse=True)
    
    total_pages = (len(stories) + per_page - 1) // per_page
    start_idx = (page - 1) * per_page
    end_idx = min(start_idx + per_page, len(stories))
    
    show_together_time()
    show_balance()
    print(f"\n📚 故事集（第 {page}/{total_pages} 页，共 {len(stories)} 条）")
    print("=" * 70)
    
    for i, s in enumerate(stories[start_idx:end_idx], start_idx + 1):
        tags_str = f" [{', '.join(s.get('tags', []))}]" if s.get("tags") else ""
        image_str = " 📷" if s.get("image") else ""
        print(f"\n{i}. {s['id']} | {s['title']}{tags_str}{image_str}")
        print(f"   📅 {s['date']} | 在一起第 {s.get('together_days', '?')} 天")
        content_preview = s["content"][:50] + "..." if len(s["content"]) > 50 else s["content"]
        print(f"   📝 {content_preview}")
    
    print("\n" + "=" * 70)
    if page < total_pages:
        print(f"💡 查看下一页：task_cli.py story list {page + 1}")
    print(f"💡 查看详情：task_cli.py story view <ID>")


def cmd_story_view(args):
    if len(args) < 1:
        print("用法：task_cli.py story view <故事 ID>")
        return
    
    story_id = args[0]
    stories_data = load_stories()
    stories = stories_data.get("stories", [])
    
    for s in stories:
        if s["id"] == story_id:
            show_together_time()
            show_balance()
            print(f"\n📖 {s['title']}")
            print("=" * 70)
            print(f"📅 日期：{s['date']}")
            print(f"💕 在一起第：{s.get('together_days', '?')} 天")
            print(f"👤 记录者：{s.get('author', '双方')}")
            if s.get("tags"):
                print(f"🏷️  标签：{', '.join(s['tags'])}")
            print(f"\n📝 内容：\n{s['content']}")
            
            if s.get("image"):
                print(f"\n📷 图片：{s['image']}")
                print(f"\n![{s['title']}]({s['image']})")
            
            print("=" * 70)
            return
    
    print(f"❌ 故事 {story_id} 不存在")


def cmd_story_search(args):
    if len(args) < 1:
        print("用法：task_cli.py story search <关键词>")
        return
    
    keyword = " ".join(args)
    stories_data = load_stories()
    stories = stories_data.get("stories", [])
    
    results = []
    for s in stories:
        if (keyword.lower() in s["title"].lower() or 
            keyword.lower() in s["content"].lower() or
            any(keyword.lower() in tag.lower() for tag in s.get("tags", []))):
            results.append(s)
    
    show_together_time()
    show_balance()
    
    if not results:
        print(f"\n🔍 未找到包含 '{keyword}' 的故事")
        return
    
    print(f"\n🔍 搜索结果：'{keyword}'（共 {len(results)} 条）")
    print("=" * 70)
    
    for s in results:
        tags_str = f" [{', '.join(s.get('tags', []))}]" if s.get("tags") else ""
        image_str = " 📷" if s.get("image") else ""
        print(f"\n{s['id']} | {s['title']}{tags_str}{image_str}")
        print(f"📅 {s['date']} | 在一起第 {s.get('together_days', '?')} 天")
        content_preview = s["content"][:80] + "..." if len(s["content"]) > 80 else s["content"]
        print(f"📝 {content_preview}")
    
    print("\n" + "=" * 70)


def cmd_story_tag(args):
    if len(args) < 2:
        print("用法：task_cli.py story tag <故事 ID> <标签>")
        return
    
    story_id = args[0]
    tag = args[1]
    
    stories_data = load_stories()
    stories = stories_data.get("stories", [])
    
    for i, s in enumerate(stories):
        if s["id"] == story_id:
            if "tags" not in s:
                s["tags"] = []
            if tag not in s["tags"]:
                s["tags"].append(tag)
            stories_data["stories"] = stories
            save_stories(stories_data)
            print(f"✅ 已为 {story_id} 添加标签：{tag}")
            return
    
    print(f"❌ 故事 {story_id} 不存在")


def cmd_story_timeline(args):
    month_filter = args[0] if args else None
    
    stories_data = load_stories()
    stories = stories_data.get("stories", [])
    
    if not stories:
        print("📭 暂无故事记录")
        return
    
    stories.sort(key=lambda x: x["date"])
    
    if month_filter:
        stories = [s for s in stories if s["date"].startswith(month_filter)]
    
    show_together_time()
    show_balance()
    print(f"\n📅 故事时间线" + (f" - {month_filter}" if month_filter else ""))
    print("=" * 70)
    
    current_month = None
    for s in stories:
        month = s["date"][:7]
        if month != current_month:
            current_month = month
            print(f"\n🗓️  {month}")
            print("-" * 50)
        
        image_str = " 📷" if s.get("image") else ""
        tags_str = f" [{', '.join(s.get('tags', []))}]" if s.get("tags") else ""
        print(f"  {s['date']} | {s['id']} | {s['title']}{image_str}{tags_str}")
    
    print("\n" + "=" * 70)


# ============== 商城命令 ==============

def cmd_shop_browse(args):
    """浏览商城"""
    shop = load_shop()
    items = shop.get("shop_items", DEFAULT_SHOP_ITEMS)
    
    show_together_time()
    show_balance()
    
    # 按类型分组显示
    categories = {
        "decor": {"name": "🏠 虚拟装饰", "items": []},
        "gift": {"name": "🎁 精美礼物", "items": []},
        "card": {"name": "🎫 特权卡券", "items": []},
        "exp": {"name": "💕 体验券", "items": []},
    }
    
    for item in items:
        item_type = item.get("type", "decor")
        if item_type in categories:
            categories[item_type]["items"].append(item)
    
    print(f"\n🏪 商城商品列表")
    print("=" * 70)
    
    for cat_key, cat_data in categories.items():
        if not cat_data["items"]:
            continue
        
        print(f"\n{cat_data['name']}")
        print("-" * 50)
        
        for item in cat_data["items"]:
            icon = item.get("icon", "🎁")
            category = item.get("category", "")
            stock_str = f" (库存:{item.get('stock', 999)})" if item.get('stock', 999) < 999 else ""
            print(f"  {icon} {item['id']} | {item['name']} - {item['points']} 分 {stock_str}")
            if len(args) > 0 and args[0] == "detail":
                print(f"     📝 {item.get('description', '无描述')}")
    
    print("\n" + "=" * 70)
    print("💡 查看详情：task_cli.py shop detail")
    print("💡 兑换商品：task_cli.py shop redeem <商品 ID>")
    print("💡 充值积分：task_cli.py shop recharge <积分>")
    print("💡 查看订单：task_cli.py shop orders")
    print("💡 查看小屋：task_cli.py room")


def cmd_shop_detail(args):
    """商城详情"""
    cmd_shop_browse(["detail"])


def cmd_shop_balance(args):
    """查看积分余额"""
    shop = load_shop()
    
    show_together_time()
    show_balance()
    
    print(f"\n📊 积分明细")
    print("-" * 50)
    
    history = shop.get("recharge_history", [])[-10:]
    if history:
        for h in history:
            date = datetime.fromisoformat(h["date"]).strftime("%Y-%m-%d %H:%M")
            points_str = f"+{h['points']}" if h.get("points", 0) > 0 else str(h["points"])
            note = h.get("note", "")
            print(f"  {date} | {points_str:>6}分 | {note}")
    else:
        print("  暂无积分记录")
    
    print("-" * 50)


def cmd_shop_recharge(args):
    """充值积分"""
    if len(args) < 1:
        print("用法：task_cli.py shop recharge <积分>")
        return
    
    points = int(args[0])
    if points <= 0:
        print("❌ 充值积分必须大于 0")
        return
    
    shop = load_shop()
    shop["balance"] += points
    shop["recharge_history"].append({
        "type": "recharge",
        "points": points,
        "date": datetime.now().isoformat(),
        "note": f"充值 {points} 积分"
    })
    save_shop(shop)
    
    show_together_time()
    print(f"\n✅ 充值成功！")
    print(f"   充值金额：+{points} 积分")
    print(f"   💰 当前余额：{shop['balance']} 积分")


def cmd_shop_redeem(args):
    """兑换商品"""
    if len(args) < 1:
        print("用法：task_cli.py shop redeem <商品 ID>")
        return
    
    item_id = args[0]
    shop = load_shop()
    items = shop.get("shop_items", DEFAULT_SHOP_ITEMS)
    
    item = None
    item_idx = -1
    for i, it in enumerate(items):
        if it["id"] == item_id:
            item = it
            item_idx = i
            break
    
    if not item:
        print(f"❌ 商品 {item_id} 不存在")
        return
    
    if item.get("stock", 999) <= 0:
        print(f"❌ 商品 {item['name']} 已售罄")
        return
    
    if shop["balance"] < item["points"]:
        print(f"❌ 积分不足！需要 {item['points']} 分，当前 {shop['balance']} 分")
        print(f"💡 充值：task_cli.py shop recharge <积分>")
        return
    
    shop["balance"] -= item["points"]
    if item.get("stock", 999) < 999:
        items[item_idx]["stock"] -= 1
    
    orders = shop.get("orders", [])
    order_id = gen_order_id(orders)
    order = {
        "id": order_id,
        "item_id": item["id"],
        "item_name": item["name"],
        "item_type": item.get("type", "unknown"),
        "points": item["points"],
        "date": datetime.now().isoformat(),
        "status": "已完成"
    }
    orders.append(order)
    
    # 如果是装饰物品，添加到小屋物品列表
    if item.get("type") == "decor":
        room = load_room()
        room["items"].append({
            "order_id": order_id,
            "item_id": item["id"],
            "name": item["name"],
            "icon": item.get("icon", "🎁"),
            "date": datetime.now().isoformat()
        })
        save_room(room)
        print(f"\n🏠 装饰物品已添加到小屋！")
    
    shop["shop_items"] = items
    shop["orders"] = orders
    save_shop(shop)
    
    show_together_time()
    print(f"\n🎉 兑换成功！")
    print(f"   商品：{item['name']}")
    print(f"   类型：{item.get('type', 'unknown')}")
    print(f"   花费：{item['points']} 积分")
    print(f"   订单：{order_id}")
    print(f"   💰 剩余积分：{shop['balance']} 分")
    
    if item.get("type") == "decor":
        print(f"💡 查看小屋：task_cli.py room")


def cmd_shop_orders(args):
    """查看兑换记录"""
    shop = load_shop()
    orders = shop.get("orders", [])
    
    show_together_time()
    show_balance()
    
    if not orders:
        print("\n📭 暂无兑换记录")
        return
    
    orders.sort(key=lambda x: x["date"], reverse=True)
    
    # 按类型分组
    by_type = {}
    for o in orders:
        t = o.get("item_type", "unknown")
        if t not in by_type:
            by_type[t] = []
        by_type[t].append(o)
    
    print(f"\n📦 兑换记录（共 {len(orders)} 条）")
    print("=" * 70)
    
    type_names = {
        "decor": "🏠 虚拟装饰",
        "gift": "🎁 精美礼物",
        "card": "🎫 特权卡券",
        "exp": "💕 体验券"
    }
    
    for t, type_orders in by_type.items():
        type_name = type_names.get(t, t)
        print(f"\n{type_name}")
        print("-" * 50)
        for o in type_orders:
            date = datetime.fromisoformat(o["date"]).strftime("%Y-%m-%d %H:%M")
            print(f"  {o['id']} | {o['item_name']} | {o['points']}分 | {date}")
    
    print("\n" + "=" * 70)


def cmd_shop_add(args):
    """添加商品（主人专用）"""
    if len(args) < 2:
        print("用法：task_cli.py shop add <商品名称> <积分> [描述]")
        return
    
    name = args[0]
    points = int(args[1])
    description = " ".join(args[2:]) if len(args) > 2 else "自定义商品"
    
    shop = load_shop()
    items = shop.get("shop_items", DEFAULT_SHOP_ITEMS.copy())
    
    max_id = 0
    for item in items:
        try:
            num = int(item["id"].split("-")[1])
            if num > max_id:
                max_id = num
        except:
            pass
    
    new_item = {
        "id": f"CUSTOM-{max_id + 1:03d}",
        "name": name,
        "points": points,
        "description": description,
        "stock": 999,
        "icon": "🎁",
        "type": "gift",
        "custom": True
    }
    
    items.append(new_item)
    shop["shop_items"] = items
    save_shop(shop)
    
    print(f"\n✅ 商品已添加！")
    print(f"   ID: {new_item['id']}")
    print(f"   名称：{name}")
    print(f"   价格：{points} 积分")
    print(f"   描述：{description}")


# ============== 小屋命令 ==============

def cmd_room_view(args):
    """查看我的小屋"""
    room = load_room()
    items = room.get("items", [])
    
    show_together_time()
    
    print(f"\n🏠 我的小屋")
    print("=" * 70)
    
    if not items:
        print("\n📭 小屋还是空的呢～")
        print("\n💡 去商城兑换装饰物品来装扮小屋吧！")
        print("   task_cli.py shop")
    else:
        # 按类型分组
        by_category = {}
        for item in items:
            # 从默认商品列表中查找 category
            category = "其他"
            for default_item in DEFAULT_SHOP_ITEMS:
                if default_item["id"] == item["item_id"]:
                    category = default_item.get("category", "其他")
                    break
            
            if category not in by_category:
                by_category[category] = []
            by_category[category].append(item)
        
        print(f"\n📦 已拥有 {len(items)} 件物品")
        
        for category, cat_items in by_category.items():
            print(f"\n{category}")
            print("-" * 50)
            for item in cat_items:
                date = datetime.fromisoformat(item["date"]).strftime("%Y-%m-%d")
                print(f"  {item['icon']} {item['name']} ({date})")
    
    print("\n" + "=" * 70)
    print("💡 浏览商城：task_cli.py shop")
    print("💡 查看物品：task_cli.py room items")


def cmd_room_items(args):
    """查看拥有的物品"""
    room = load_room()
    items = room.get("items", [])
    
    show_together_time()
    
    if not items:
        print("\n📭 暂无装饰物品")
        print("💡 去商城兑换吧：task_cli.py shop")
        return
    
    print(f"\n🎒 我的物品（共 {len(items)} 件）")
    print("=" * 70)
    
    for i, item in enumerate(items, 1):
        date = datetime.fromisoformat(item["date"]).strftime("%Y-%m-%d")
        print(f"{i}. {item['icon']} {item['name']}")
        print(f"   ID: {item['item_id']} | 获得：{date}")
    
    print("=" * 70)


def cmd_room_decorate(args):
    """装饰小屋"""
    room = load_room()
    items = room.get("items", [])
    
    show_together_time()
    
    if not items:
        print("\n📭 小屋还是空的，先去商城兑换装饰物品吧！")
        print("💡 task_cli.py shop")
        return
    
    print(f"\n🏠 装饰小屋")
    print("=" * 70)
    print("\n你拥有的装饰物品：")
    
    for i, item in enumerate(items, 1):
        print(f"  {i}. {item['icon']} {item['name']}")
    
    print("\n" + "=" * 70)
    print("💡 小屋装饰功能开发中...")
    print("   未来可以摆放、调整物品位置")


def print_help():
    print("""
任务申请与审批系统 + 里程碑 + 故事集 + 商城积分 + 小屋装扮 - 命令行快捷版

【任务命令】
  apply <标题> <描述> [天数]           申请任务
  random [天数]                        随机抽取任务（有积分奖励）
  approve <ID> yes|no [备注]           审批任务
  complete <ID> [结果]                 完成任务（获得积分）
  extend <ID> <天数> [原因]            延期任务
  query [ID]                           查询任务
  list [--status=状态]                 任务列表
  check                                检查超期

【里程碑命令】
  milestone init <YYYY-MM-DD>          设置在一起日期
  milestone show                       显示在一起时间和里程碑
  milestone add <名称> [描述]          添加里程碑节点
  milestone list                       列出所有里程碑

【故事集命令】
  story add <标题> <内容> [图片路径]   添加故事/日志
  story list [页数]                    列出故事列表
  story view <ID>                      查看故事详情
  story search <关键词>                搜索故事
  story tag <ID> <标签>                添加标签
  story timeline [YYYY-MM]             时间线视图

【商城命令】
  shop                                 浏览商城商品
  shop detail                          商城详情
  shop balance                         查看积分余额和明细
  shop recharge <积分>                 充值积分
  shop redeem <商品 ID>                兑换商品
  shop orders                          查看兑换记录
  shop add <名称> <积分> [描述]        添加商品（主人）

【小屋命令】
  room                                 查看我的小屋
  room items                           查看拥有的物品
  room decorate                        装饰小屋

  help                                 显示帮助

【积分获取】
  ✅ 完成任务获得积分（30-150 分不等）
  💰 充值积分（主人可用）

【商城分类】
  🏠 虚拟装饰 - 装扮小屋（台灯、地毯、绿植、挂画等）
  🎁 精美礼物 - 实物礼品（口红、手链、香水、手表等）
  🎫 特权卡券 - 功能卡片（免做卡、延期卡、愿望券等）
  💕 体验券 - 体验服务（按摩、拥抱、约会等）
""")


def main():
    if len(sys.argv) < 2:
        print_help()
        return

    cmd = sys.argv[1]
    args = sys.argv[2:]

    # 里程碑子命令
    if cmd == "milestone":
        if len(args) < 1:
            print("用法：task_cli.py milestone <子命令> [参数]")
            print("子命令：init, show, add, list")
            return
        sub_cmd = args[0]
        sub_args = args[1:]
        milestone_cmds = {
            "init": cmd_milestone_init,
            "show": cmd_milestone_show,
            "add": cmd_milestone_add,
            "list": cmd_milestone_list,
        }
        if sub_cmd in milestone_cmds:
            milestone_cmds[sub_cmd](sub_args)
        else:
            print(f"❌ 未知子命令：{sub_cmd}")
        return

    # 故事集子命令
    if cmd == "story":
        if len(args) < 1:
            print("用法：task_cli.py story <子命令> [参数]")
            print("子命令：add, list, view, search, tag, timeline")
            return
        sub_cmd = args[0]
        sub_args = args[1:]
        story_cmds = {
            "add": cmd_story_add,
            "list": cmd_story_list,
            "view": cmd_story_view,
            "search": cmd_story_search,
            "tag": cmd_story_tag,
            "timeline": cmd_story_timeline,
        }
        if sub_cmd in story_cmds:
            story_cmds[sub_cmd](sub_args)
        else:
            print(f"❌ 未知子命令：{sub_cmd}")
        return

    # 商城子命令
    if cmd == "shop":
        if len(args) < 1:
            cmd_shop_browse([])
            return
        sub_cmd = args[0]
        sub_args = args[1:]
        shop_cmds = {
            "detail": cmd_shop_detail,
            "balance": cmd_shop_balance,
            "recharge": cmd_shop_recharge,
            "redeem": cmd_shop_redeem,
            "orders": cmd_shop_orders,
            "add": cmd_shop_add,
        }
        if sub_cmd in shop_cmds:
            shop_cmds[sub_cmd](sub_args)
        else:
            cmd_shop_browse(args)
        return

    # 小屋子命令
    if cmd == "room":
        if len(args) < 1:
            cmd_room_view([])
            return
        sub_cmd = args[0]
        sub_args = args[1:]
        room_cmds = {
            "items": cmd_room_items,
            "decorate": cmd_room_decorate,
        }
        if sub_cmd in room_cmds:
            room_cmds[sub_cmd](sub_args)
        else:
            cmd_room_view(args)
        return

    commands = {
        "apply": cmd_apply,
        "random": cmd_random,
        "approve": cmd_approve,
        "complete": cmd_complete,
        "extend": cmd_extend,
        "query": cmd_query,
        "list": cmd_list,
        "check": cmd_check,
        "help": lambda _: print_help(),
    }

    if cmd in commands:
        commands[cmd](args)
    else:
        print(f"❌ 未知命令：{cmd}")
        print_help()


if __name__ == "__main__":
    main()
