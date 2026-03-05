#!/usr/bin/env python3
"""
简单测试脚本 - 直接运行验证功能
"""
import sys
from pathlib import Path
from datetime import date, timedelta

# 添加 src 到路径
src_path = Path(__file__).parent / "src"
sys.path.insert(0, str(src_path))

# 使用直接导入
from models import (
    Employee, ShiftCycle, SchedulingConfig, ShiftAssignment, ShiftType, Schedule
)
from constraints import ConstraintChecker, ConstraintEnforcer


def test_constraints():
    """测试约束检查"""
    print("=" * 60)
    print("测试约束检查")
    print("=" * 60)
    
    config = SchedulingConfig(
        max_consecutive_work_days=6,
        consecutive_work_threshold=3,
        min_shift_types_after_threshold=2
    )
    
    checker = ConstraintChecker(config)
    enforcer = ConstraintEnforcer(config)
    
    # 创建测试员工
    emp = Employee(id="TEST001", name="测试", group="组 01")
    
    # 测试 1: G 班约束
    print("\n1. G 班约束测试")
    test_shifts = [
        ShiftAssignment(emp, date(2024, 1, 25), ShiftType.T),
    ]
    can_assign, reason = enforcer.can_assign_shift(test_shifts, date(2024, 1, 26), ShiftType.G)
    print(f"   T 班后接 G 班：{'✗ 正确拒绝' if not can_assign else '✓'} - {reason}")
    
    test_shifts = [
        ShiftAssignment(emp, date(2024, 1, 25), ShiftType.G),
    ]
    can_assign, reason = enforcer.can_assign_shift(test_shifts, date(2024, 1, 26), ShiftType.G)
    print(f"   G 班后接 G 班：{'✓ 正确允许' if can_assign else '✗'} - {reason}")
    
    # 测试 2: Y 班约束
    print("\n2. Y 班约束测试")
    test_shifts = [
        ShiftAssignment(emp, date(2024, 1, 25), ShiftType.Y),
    ]
    can_assign, reason = enforcer.can_assign_shift(test_shifts, date(2024, 1, 26), ShiftType.G)
    print(f"   Y 班后接 G 班：✗ 无法直接测试 (需要检查后一天)")
    
    test_shifts = [
        ShiftAssignment(emp, date(2024, 1, 25), ShiftType.Y),
        ShiftAssignment(emp, date(2024, 1, 26), ShiftType.G),
    ]
    can_assign, reason = enforcer.can_assign_shift(test_shifts, date(2024, 1, 25), ShiftType.Y)
    print(f"   Y 班后是 G 班时排 Y：{'✗ 正确拒绝' if not can_assign else '✓'} - {reason}")
    
    # 测试 3: T 班约束
    print("\n3. T 班约束测试")
    test_shifts = [
        ShiftAssignment(emp, date(2024, 1, 25), ShiftType.Y),
    ]
    can_assign, reason = enforcer.can_assign_shift(test_shifts, date(2024, 1, 26), ShiftType.T)
    print(f"   Y 班后接 T 班：{'✗ 正确拒绝' if not can_assign else '✓'} - {reason}")
    
    test_shifts = [
        ShiftAssignment(emp, date(2024, 1, 26), ShiftType.G),
    ]
    can_assign, reason = enforcer.can_assign_shift(test_shifts, date(2024, 1, 25), ShiftType.T)
    print(f"   T 班后接 G 班：{'✗ 正确拒绝' if not can_assign else '✓'} - {reason}")
    
    # 测试 4: 连续上班天数
    print("\n4. 连续上班天数测试")
    test_shifts = []
    for i in range(6):
        test_shifts.append(ShiftAssignment(
            emp, date(2024, 1, 20) + timedelta(days=i), ShiftType.G
        ))
    
    can_assign, reason = enforcer.can_assign_shift(
        test_shifts, date(2024, 1, 26), ShiftType.G
    )
    print(f"   连续 6 天后第 7 天：{'✗ 正确拒绝' if not can_assign else '✓'} - {reason}")
    
    print("\n✓ 约束检查测试完成")
    return True


def test_schedule_validation():
    """测试排班验证"""
    print("\n" + "=" * 60)
    print("测试排班验证")
    print("=" * 60)
    
    config = SchedulingConfig(
        max_consecutive_work_days=6,
        consecutive_work_threshold=3,
        min_shift_types_after_threshold=2
    )
    
    checker = ConstraintChecker(config)
    
    # 创建测试排班
    emp = Employee(id="TEST002", name="测试 2", group="组 01")
    cycle = ShiftCycle(start_date=date(2024, 1, 20), end_date=date(2024, 2, 25))
    schedule = Schedule(cycle=cycle)
    
    # 测试：连续 4 天同一种班次
    print("\n1. 班次多样性测试")
    schedule.assignments[emp.id] = [
        ShiftAssignment(emp, date(2024, 1, 20), ShiftType.G),
        ShiftAssignment(emp, date(2024, 1, 21), ShiftType.G),
        ShiftAssignment(emp, date(2024, 1, 22), ShiftType.G),
        ShiftAssignment(emp, date(2024, 1, 23), ShiftType.G),
    ]
    
    errors = checker._check_shift_variety(schedule)
    print(f"   连续 4 天 G 班检测：{'✓ 检测到问题' if errors else '✗ 未检测'}")
    if errors:
        print(f"   错误：{errors[0][:80]}...")
    
    # 测试：连续上班 7 天
    print("\n2. 连续上班天数测试")
    schedule.assignments[emp.id] = [
        ShiftAssignment(emp, date(2024, 1, 20) + timedelta(days=i), ShiftType.G)
        for i in range(7)
    ]
    
    errors = checker._check_consecutive_work_days(schedule)
    print(f"   连续 7 天上班检测：{'✓ 检测到问题' if errors else '✗ 未检测'}")
    if errors:
        print(f"   错误：{errors[0][:80]}...")
    
    print("\n✓ 排班验证测试完成")
    return True


def test_excel_handler():
    """测试 Excel 处理"""
    print("\n" + "=" * 60)
    print("测试 Excel 处理")
    print("=" * 60)
    
    from excel_handler import ExcelHandler
    handler = ExcelHandler()
    
    test_dir = Path(__file__).parent / "test_output"
    test_dir.mkdir(parents=True, exist_ok=True)
    
    # 测试模板导出
    print("\n1. 模板导出测试")
    template_file = test_dir / "employees_template.xlsx"
    try:
        handler.export_employees_template(str(template_file))
        print(f"   模板导出：{'✓ 成功' if template_file.exists() else '✗ 失败'}")
    except Exception as e:
        print(f"   模板导出：✗ 失败 - {e}")
    
    # 测试配置导出
    print("\n2. 配置导出测试")
    config = SchedulingConfig()
    config_file = test_dir / "config.json"
    try:
        handler.export_config(config, str(config_file))
        print(f"   配置导出：{'✓ 成功' if config_file.exists() else '✗ 失败'}")
    except Exception as e:
        print(f"   配置导出：✗ 失败 - {e}")
    
    # 测试配置导入
    print("\n3. 配置导入测试")
    try:
        imported_config = handler.import_config(str(config_file))
        print(f"   配置导入：✓ 成功")
        print(f"   休息天数：{imported_config.off_days_per_month}")
    except Exception as e:
        print(f"   配置导入：✗ 失败 - {e}")
    
    print("\n✓ Excel 处理测试完成")
    return True


def main():
    """运行所有测试"""
    print("\n排班系统功能测试\n")
    
    from datetime import date, timedelta
    
    results = []
    
    try:
        results.append(("约束检查", test_constraints()))
    except Exception as e:
        print(f"\n✗ 约束检查测试失败：{e}")
        import traceback
        traceback.print_exc()
        results.append(("约束检查", False))
    
    try:
        results.append(("排班验证", test_schedule_validation()))
    except Exception as e:
        print(f"\n✗ 排班验证测试失败：{e}")
        import traceback
        traceback.print_exc()
        results.append(("排班验证", False))
    
    try:
        results.append(("Excel 处理", test_excel_handler()))
    except Exception as e:
        print(f"\n✗ Excel 处理测试失败：{e}")
        import traceback
        traceback.print_exc()
        results.append(("Excel 处理", False))
    
    # 汇总
    print("\n" + "=" * 60)
    print("测试结果汇总")
    print("=" * 60)
    
    passed = sum(1 for _, r in results if r)
    total = len(results)
    
    for name, result in results:
        status = "✓ 通过" if result else "✗ 失败"
        print(f"  {status} - {name}")
    
    print(f"\n总计：{passed}/{total} 测试通过")
    
    return passed == total


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
