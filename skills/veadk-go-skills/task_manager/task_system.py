#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
任务申请与审批系统 + 里程碑记录 - 真人主奴关系使用
功能：
- 奴可以申请任务（自定义或随机抽取）
- 主人审批任务
- 任务有期限，超期失败
- 可申请延期一次
- 里程碑记录（在一起时间、重要节点）
"""

import json
import os
import random
import sys
from datetime import datetime, timedelta
from pathlib import Path

# 数据文件路径
DATA_FILE = Path.home() / ".task_manager" / "tasks.json"
MILESTONE_FILE = Path.home() / ".task_manager" / "milestones.json"

# 随机任务池
RANDOM_TASKS = [
    {"title": "学习新技能", "description": "学习并掌握一项新技能，如编程、绘画、乐器等"},
    {"title": "健身挑战", "description": "完成一周的健身计划，包括有氧和力量训练"},
    {"title": "阅读任务", "description": "阅读一本指定书籍并写读后感"},
    {"title": "整理房间", "description": "彻底整理和清洁房间，保持整洁一周"},
    {"title": "创意写作", "description": "写一篇短篇小说或诗歌"},
    {"title": "烹饪挑战", "description": "学习并制作一道新菜品"},
    {"title": "志愿服务", "description": "参与一次社区志愿服务活动"},
    {"title": "技能提升", "description": "完成一个在线课程或培训"},
    {"title": "早起挑战", "description": "连续 7 天早上 6 点前起床"},
    {"title": "断舍离", "description": "清理并丢弃/捐赠 10 件不需要的物品"},
    {"title": "冥想练习", "description": "每天冥想 15 分钟，持续一周"},
    {"title": "记账任务", "description": "详细记录一周的所有开支"},
]

# 任务状态
STATUS_PENDING = "待审批"
STATUS_APPROVED = "已批准"
STATUS_REJECTED = "已拒绝"
STATUS_COMPLETED = "已完成"
STATUS_FAILED = "已失败"
STATUS_EXTENDED = "已延期"

# 里程碑节点（天数）
MILESTONE_DAYS = [1, 7, 14, 30, 50, 100, 200, 300, 365, 500, 666, 888, 1000, 1500, 2000]


def ensure_data_file():
    """确保数据文件存在"""
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    if not DATA_FILE.exists():
        save_tasks([])
    if not MILESTONE_FILE.exists():
        with open(MILESTONE_FILE, "w", encoding="utf-8") as f:
            json.dump({"start_date": None, "milestones": []}, f, ensure_ascii=False, indent=2)


def load_tasks():
    """加载任务列表"""
    ensure_data_file()
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        return []


def save_tasks(tasks):
    """保存任务列表"""
    ensure_data_file()
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(tasks, f, ensure_ascii=False, indent=2)


def load_milestones():
    """加载里程碑数据"""
    ensure_data_file()
    try:
        with open(MILESTONE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return {"start_date": None, "milestones": []}


def save_milestones(data):
    """保存里程碑数据"""
    ensure_data_file()
    with open(MILESTONE_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def generate_task_id(tasks):
    """生成任务 ID"""
    if not tasks:
        return "TASK-0001"
    max_id = max(int(t["id"].split("-")[1]) for t in tasks)
    return f"TASK-{max_id + 1:04d}"


def get_together_days(start_date_str):
    """计算在一起的天数"""
    if not start_date_str:
        return None
    start = datetime.strptime(start_date_str, "%Y-%m-%d")
    delta = datetime.now() - start
    return delta.days


def get_next_milestone(current_days):
    """获取下一个里程碑"""
    for day in MILESTONE_DAYS:
        if day > current_days:
            return day
    return None


def show_together_time():
    """显示在一起时间"""
    ms = load_milestones()
    days = get_together_days(ms.get("start_date"))
    if days:
        next_ms = get_next_milestone(days)
        if next_ms:
            print(f"\n💕 在一起第 {days} 天（下一个里程碑：{next_ms} 天）")
        else:
            print(f"\n💕 在一起第 {days} 天")


def apply_task(title, description, days=7):
    """申请任务（自定义）"""
    tasks = load_tasks()
    task_id = generate_task_id(tasks)
    now = datetime.now()
    deadline = now + timedelta(days=days)

    task = {
        "id": task_id,
        "title": title,
        "description": description,
        "applicant": "奴",
        "created_at": now.isoformat(),
        "deadline": deadline.isoformat(),
        "extended_at": None,
        "new_deadline": None,
        "status": STATUS_PENDING,
        "is_random": False,
        "approval_note": "",
        "completed_at": None,
        "result": "",
    }

    tasks.append(task)
    save_tasks(tasks)

    show_together_time()
    print(f"\n✅ 任务申请成功！")
    print(f"   任务 ID: {task_id}")
    print(f"   标题：{title}")
    print(f"   期限：{deadline.strftime('%Y-%m-%d %H:%M')} 前")
    print(f"   状态：{STATUS_PENDING}（等待主人审批）")
    return task_id


def apply_random_task(days=7):
    """随机抽取任务"""
    tasks = load_tasks()
    task_id = generate_task_id(tasks)
    now = datetime.now()
    deadline = now + timedelta(days=days)

    random_task = random.choice(RANDOM_TASKS)

    task = {
        "id": task_id,
        "title": random_task["title"],
        "description": random_task["description"],
        "applicant": "奴",
        "created_at": now.isoformat(),
        "deadline": deadline.isoformat(),
        "extended_at": None,
        "new_deadline": None,
        "status": STATUS_PENDING,
        "is_random": True,
        "approval_note": "",
        "completed_at": None,
        "result": "",
    }

    tasks.append(task)
    save_tasks(tasks)

    show_together_time()
    print(f"\n🎲 随机任务抽取成功！")
    print(f"   任务 ID: {task_id}")
    print(f"   标题：{random_task['title']}")
    print(f"   描述：{random_task['description']}")
    print(f"   期限：{deadline.strftime('%Y-%m-%d %H:%M')} 前")
    print(f"   状态：{STATUS_PENDING}（等待主人审批）")
    return task_id


def approve_task(task_id, approve, note=""):
    """审批任务"""
    tasks = load_tasks()
    task = None
    task_idx = -1

    for i, t in enumerate(tasks):
        if t["id"] == task_id:
            task = t
            task_idx = i
            break

    if not task:
        print(f"\n❌ 任务 {task_id} 不存在")
        return False

    if task["status"] != STATUS_PENDING:
        print(f"\n❌ 任务 {task_id} 状态为 {task['status']}，无法审批（只有待审批状态可以审批）")
        return False

    if approve:
        tasks[task_idx]["status"] = STATUS_APPROVED
        tasks[task_idx]["approval_note"] = note
        save_tasks(tasks)
        show_together_time()
        print(f"\n✅ 任务 {task_id} 已批准！")
        if note:
            print(f"   备注：{note}")
    else:
        tasks[task_idx]["status"] = STATUS_REJECTED
        tasks[task_idx]["approval_note"] = note
        save_tasks(tasks)
        show_together_time()
        print(f"\n❌ 任务 {task_id} 已拒绝")
        if note:
            print(f"   原因：{note}")

    return True


def complete_task(task_id, result=""):
    """完成任务"""
    tasks = load_tasks()
    task = None
    task_idx = -1

    for i, t in enumerate(tasks):
        if t["id"] == task_id:
            task = t
            task_idx = i
            break

    if not task:
        print(f"\n❌ 任务 {task_id} 不存在")
        return False

    if task["status"] not in [STATUS_APPROVED, STATUS_EXTENDED]:
        print(f"\n❌ 任务 {task_id} 状态为 {task['status']}，无法完成（只有已批准/已延期的任务可以完成）")
        return False

    # 检查是否超期
    deadline = datetime.fromisoformat(task["new_deadline"]) if task["new_deadline"] else datetime.fromisoformat(task["deadline"])
    if datetime.now() > deadline:
        tasks[task_idx]["status"] = STATUS_FAILED
        save_tasks(tasks)
        print(f"\n❌ 任务 {task_id} 已超期，无法完成（已标记为失败）")
        return False

    tasks[task_idx]["status"] = STATUS_COMPLETED
    tasks[task_idx]["completed_at"] = datetime.now().isoformat()
    tasks[task_idx]["result"] = result
    save_tasks(tasks)

    show_together_time()
    print(f"\n✅ 任务 {task_id} 已完成！")
    if result:
        print(f"   结果：{result}")
    return True


def extend_task(task_id, days, reason=""):
    """延期任务"""
    tasks = load_tasks()
    task = None
    task_idx = -1

    for i, t in enumerate(tasks):
        if t["id"] == task_id:
            task = t
            task_idx = i
            break

    if not task:
        print(f"\n❌ 任务 {task_id} 不存在")
        return False

    if task["status"] not in [STATUS_APPROVED, STATUS_EXTENDED]:
        print(f"\n❌ 任务 {task_id} 状态为 {task['status']}，无法延期")
        return False

    if task["extended_at"] is not None:
        print(f"\n❌ 任务 {task_id} 已经延期过，无法再次延期（每个任务只能延期一次）")
        return False

    # 检查是否已超期
    deadline = datetime.fromisoformat(task["deadline"])
    if datetime.now() > deadline:
        tasks[task_idx]["status"] = STATUS_FAILED
        save_tasks(tasks)
        print(f"\n❌ 任务 {task_id} 已超期失败，无法延期")
        return False

    new_deadline = deadline + timedelta(days=days)
    tasks[task_idx]["extended_at"] = datetime.now().isoformat()
    tasks[task_idx]["new_deadline"] = new_deadline.isoformat()
    tasks[task_idx]["status"] = STATUS_EXTENDED
    save_tasks(tasks)

    show_together_time()
    print(f"\n✅ 任务 {task_id} 延期成功！")
    print(f"   原期限：{deadline.strftime('%Y-%m-%d %H:%M')}")
    print(f"   新期限：{new_deadline.strftime('%Y-%m-%d %H:%M')}")
    if reason:
        print(f"   原因：{reason}")
    return True


def query_task(task_id=None, status_filter=None):
    """查询任务"""
    tasks = load_tasks()

    show_together_time()

    if task_id:
        for t in tasks:
            if t["id"] == task_id:
                print_task_detail(t)
                return
        print(f"\n❌ 任务 {task_id} 不存在")
        return

    # 按状态筛选
    if status_filter:
        tasks = [t for t in tasks if t["status"] == status_filter]

    if not tasks:
        print("\n📭 暂无任务")
        return

    print(f"\n📋 任务列表（共 {len(tasks)} 个）")
    print("-" * 80)
    for t in tasks:
        deadline = datetime.fromisoformat(t["new_deadline"]) if t["new_deadline"] else datetime.fromisoformat(t["deadline"])
        days_left = (deadline - datetime.now()).days
        days_str = f"剩余{days_left}天" if days_left > 0 else "已超期"
        print(f"{t['id']} | {t['title'][:20]:<20} | {t['status']:<8} | {deadline.strftime('%Y-%m-%d')} | {days_str}")
    print("-" * 80)


def print_task_detail(task):
    """打印任务详情"""
    deadline = datetime.fromisoformat(task["new_deadline"]) if task["new_deadline"] else datetime.fromisoformat(task["deadline"])
    days_left = (deadline - datetime.now()).days

    print(f"\n📋 任务详情")
    print(f"   ID: {task['id']}")
    print(f"   标题：{task['title']}")
    print(f"   描述：{task['description']}")
    print(f"   申请人：{task['applicant']}")
    print(f"   创建时间：{datetime.fromisoformat(task['created_at']).strftime('%Y-%m-%d %H:%M')}")
    print(f"   期限：{deadline.strftime('%Y-%m-%d %H:%M')} ({'剩余' + str(days_left) + '天' if days_left > 0 else '已超期'})")
    print(f"   状态：{task['status']}")
    print(f"   类型：{'随机抽取' if task['is_random'] else '自定义'}")
    if task["approval_note"]:
        print(f"   审批备注：{task['approval_note']}")
    if task["result"]:
        print(f"   完成结果：{task['result']}")
    if task["completed_at"]:
        print(f"   完成时间：{datetime.fromisoformat(task['completed_at']).strftime('%Y-%m-%d %H:%M')}")


def check_expired():
    """检查并标记超期任务"""
    tasks = load_tasks()
    changed = False

    for i, t in enumerate(tasks):
        if t["status"] in [STATUS_APPROVED, STATUS_EXTENDED]:
            deadline = datetime.fromisoformat(t["new_deadline"]) if t["new_deadline"] else datetime.fromisoformat(t["deadline"])
            if datetime.now() > deadline:
                tasks[i]["status"] = STATUS_FAILED
                changed = True

    if changed:
        save_tasks(tasks)
        print("\n⚠️  已更新超期任务状态")


# ============== 里程碑功能 ==============

def milestone_init(date_str):
    """初始化在一起日期"""
    try:
        datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        print(f"❌ 日期格式错误，请使用 YYYY-MM-DD 格式，如：2024-01-15")
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


def milestone_show():
    """显示在一起时间和里程碑"""
    ms = load_milestones()

    if not ms.get("start_date"):
        print("📭 尚未设置在一起日期")
        print("   在菜单中选择【9. 设置在一起日期】")
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


def milestone_add(name, description=""):
    """添加自定义里程碑"""
    ms = load_milestones()

    if not ms.get("start_date"):
        print("❌ 请先设置在一起日期")
        return

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
    """获取已达成的里程碑"""
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


def milestone_list():
    """列出所有里程碑"""
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


def print_menu():
    """打印菜单"""
    print("\n" + "=" * 60)
    print("           任务申请与审批系统 + 里程碑")
    print("=" * 60)
    print("【奴的功能】")
    print("  1. 申请任务（自定义）")
    print("  2. 随机抽取任务")
    print("  3. 查询任务")
    print("  4. 申请延期")
    print("  5. 完成任务")
    print("【主人的功能】")
    print("  6. 审批任务")
    print("  7. 查看所有任务")
    print("  8. 查看待审批任务")
    print("【里程碑】")
    print("  9. 显示在一起时间")
    print(" 10. 设置在一起日期")
    print(" 11. 添加里程碑记录")
    print("【其他】")
    print(" 12. 检查超期任务")
    print("  0. 退出")
    print("=" * 60)


def main():
    """主函数"""
    print("\n👋 欢迎使用任务申请与审批系统 + 里程碑记录")

    # 显示在一起时间
    show_together_time()

    while True:
        print_menu()
        choice = input("\n请选择功能 (0-12): ").strip()

        if choice == "1":
            title = input("任务标题：").strip()
            description = input("任务描述：").strip()
            days = input("期限天数（默认 7）: ").strip()
            days = int(days) if days.isdigit() else 7
            apply_task(title, description, days)

        elif choice == "2":
            days = input("期限天数（默认 7）: ").strip()
            days = int(days) if days.isdigit() else 7
            apply_random_task(days)

        elif choice == "3":
            task_id = input("任务 ID（留空查询全部）: ").strip()
            status = input("状态筛选（留空不过滤）: ").strip()
            query_task(task_id if task_id else None, status if status else None)

        elif choice == "4":
            task_id = input("任务 ID: ").strip()
            days = input("延期天数：").strip()
            reason = input("延期原因：").strip()
            extend_task(task_id, int(days), reason)

        elif choice == "5":
            task_id = input("任务 ID: ").strip()
            result = input("完成结果描述：").strip()
            complete_task(task_id, result)

        elif choice == "6":
            task_id = input("任务 ID: ").strip()
            approve = input("是否批准？(y/n): ").strip().lower() == "y"
            note = input("审批备注：").strip()
            approve_task(task_id, approve, note)

        elif choice == "7":
            query_task()

        elif choice == "8":
            query_task(status_filter=STATUS_PENDING)

        elif choice == "9":
            milestone_show()

        elif choice == "10":
            date_str = input("在一起日期（YYYY-MM-DD）: ").strip()
            milestone_init(date_str)

        elif choice == "11":
            name = input("里程碑名称：").strip()
            description = input("描述（可选）: ").strip()
            milestone_add(name, description)

        elif choice == "12":
            check_expired()

        elif choice == "0":
            print("\n👋 再见！")
            break

        else:
            print("\n❌ 无效选择，请重新输入")

        input("\n按回车键继续...")


if __name__ == "__main__":
    main()
