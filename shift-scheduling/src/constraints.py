"""
排班约束规则
"""
from typing import List, Dict, Optional, Tuple
from datetime import date, timedelta
from collections import defaultdict

try:
    from .models import (
        Schedule, ShiftAssignment, ShiftType, Employee, 
        ShiftCycle, SchedulingConfig
    )
except ImportError:
    from models import (
        Schedule, ShiftAssignment, ShiftType, Employee, 
        ShiftCycle, SchedulingConfig
    )


class ConstraintChecker:
    """约束检查器"""
    
    def __init__(self, config: Optional[SchedulingConfig] = None):
        self.config = config or SchedulingConfig()
    
    def validate_schedule(self, schedule: Schedule) -> List[str]:
        """验证排班是否满足所有约束，返回错误列表"""
        errors = []
        
        # 1. 检查班次顺序约束
        errors.extend(self._check_shift_sequence_constraints(schedule))
        
        # 2. 检查连续上班天数
        errors.extend(self._check_consecutive_work_days(schedule))
        
        # 3. 检查连续上班班次多样性
        errors.extend(self._check_shift_variety(schedule))
        
        # 4. 检查每日人数比例
        errors.extend(self._check_daily_requirements(schedule))
        
        # 5. 检查休息天数
        errors.extend(self._check_off_days(schedule))
        
        return errors
    
    def _check_shift_sequence_constraints(self, schedule: Schedule) -> List[str]:
        """
        检查班次顺序约束：
        - G：前一天只能是休息或 G
        - Y：后一天只能是 Y 或休息
        - T：前不能是 Y，后不能是 G
        """
        errors = []
        
        for emp_id, assignments in schedule.assignments.items():
            # 按日期排序
            sorted_assignments = sorted(assignments, key=lambda x: x.date)
            shift_map = {a.date: a.shift for a in sorted_assignments}
            
            for i, assignment in enumerate(sorted_assignments):
                current_date = assignment.date
                current_shift = assignment.shift
                
                # 检查 G 班约束
                if current_shift == ShiftType.G:
                    prev_date = current_date - timedelta(days=1)
                    if prev_date in shift_map:
                        prev_shift = shift_map[prev_date]
                        if prev_shift not in [ShiftType.OFF, ShiftType.G]:
                            errors.append(
                                f"员工{emp_id}在{current_date}上 G 班，"
                                f"但前一天({prev_date})是{prev_shift.value}班（应为 OFF 或 G）"
                            )
                
                # 检查 Y 班约束
                if current_shift == ShiftType.Y:
                    next_date = current_date + timedelta(days=1)
                    if next_date in shift_map:
                        next_shift = shift_map[next_date]
                        if next_shift not in [ShiftType.OFF, ShiftType.Y]:
                            errors.append(
                                f"员工{emp_id}在{current_date}上 Y 班，"
                                f"但后一天({next_date})是{next_shift.value}班（应为 OFF 或 Y）"
                            )
                
                # 检查 T 班约束
                if current_shift == ShiftType.T:
                    # 前一天不能是 Y
                    prev_date = current_date - timedelta(days=1)
                    if prev_date in shift_map:
                        prev_shift = shift_map[prev_date]
                        if prev_shift == ShiftType.Y:
                            errors.append(
                                f"员工{emp_id}在{current_date}上 T 班，"
                                f"但前一天({prev_date})是 Y 班（T 班前不能是 Y）"
                            )
                    
                    # 后一天不能是 G
                    next_date = current_date + timedelta(days=1)
                    if next_date in shift_map:
                        next_shift = shift_map[next_date]
                        if next_shift == ShiftType.G:
                            errors.append(
                                f"员工{emp_id}在{current_date}上 T 班，"
                                f"但后一天({next_date})是 G 班（T 班后不能是 G）"
                            )
        
        return errors
    
    def _check_consecutive_work_days(self, schedule: Schedule) -> List[str]:
        """检查连续上班天数不超过最大值"""
        errors = []
        max_consecutive = self.config.max_consecutive_work_days
        
        for emp_id, assignments in schedule.assignments.items():
            sorted_assignments = sorted(assignments, key=lambda x: x.date)
            
            consecutive_count = 0
            consecutive_start = None
            
            for assignment in sorted_assignments:
                if assignment.shift != ShiftType.OFF:
                    if consecutive_count == 0:
                        consecutive_start = assignment.date
                    consecutive_count += 1
                else:
                    if consecutive_count > max_consecutive:
                        errors.append(
                            f"员工{emp_id}从{consecutive_start}开始连续上班{consecutive_count}天，"
                            f"超过最大限制{max_consecutive}天"
                        )
                    consecutive_count = 0
                    consecutive_start = None
            
            # 检查最后一段
            if consecutive_count > max_consecutive:
                errors.append(
                    f"员工{emp_id}从{consecutive_start}开始连续上班{consecutive_count}天，"
                    f"超过最大限制{max_consecutive}天"
                )
        
        return errors
    
    def _check_shift_variety(self, schedule: Schedule) -> List[str]:
        """
        检查连续上班超过阈值时，是否包含足够的班次种类
        """
        errors = []
        threshold = self.config.consecutive_work_threshold
        min_types = self.config.min_shift_types_after_threshold
        
        for emp_id, assignments in schedule.assignments.items():
            sorted_assignments = sorted(assignments, key=lambda x: x.date)
            
            consecutive_works = []
            
            for assignment in sorted_assignments:
                if assignment.shift != ShiftType.OFF:
                    consecutive_works.append(assignment)
                else:
                    # 检查这一段连续上班
                    if len(consecutive_works) > threshold:
                        shift_types = set(w.shift for w in consecutive_works)
                        if len(shift_types) < min_types:
                            dates = [str(w.date) for w in consecutive_works]
                            errors.append(
                                f"员工{emp_id}连续上班{len(consecutive_works)}天（{dates[0]}至{dates[-1]}），"
                                f"但只有{len(shift_types)}种班次（需要至少{min_types}种）"
                            )
                    consecutive_works = []
            
            # 检查最后一段
            if len(consecutive_works) > threshold:
                shift_types = set(w.shift for w in consecutive_works)
                if len(shift_types) < min_types:
                    dates = [str(w.date) for w in consecutive_works]
                    errors.append(
                        f"员工{emp_id}连续上班{len(consecutive_works)}天（{dates[0]}至{dates[-1]}），"
                        f"但只有{len(shift_types)}种班次（需要至少{min_types}种）"
                    )
        
        return errors
    
    def _check_daily_requirements(self, schedule: Schedule) -> List[str]:
        """检查每日各班次人数是否符合要求"""
        errors = []
        
        # 按日期统计
        daily_counts = defaultdict(lambda: {ShiftType.G: 0, ShiftType.T: 0, ShiftType.Y: 0})
        
        for emp_id, assignments in schedule.assignments.items():
            for assignment in assignments:
                if assignment.shift in [ShiftType.G, ShiftType.T, ShiftType.Y]:
                    daily_counts[assignment.date][assignment.shift] += 1
        
        # 计算期望人数
        total_employees = len(schedule.assignments)
        ratio = self.config.shift_ratio
        
        for check_date in daily_counts.keys():
            counts = daily_counts[check_date]
            for shift_type in [ShiftType.G, ShiftType.T, ShiftType.Y]:
                expected = int(total_employees * ratio.get(shift_type, 0))
                actual = counts[shift_type]
                # 允许 5% 的误差
                tolerance = max(1, int(expected * 0.05))
                if abs(actual - expected) > tolerance:
                    errors.append(
                        f"{check_date}的{shift_type.value}班：实际{actual}人，期望{expected}人（误差{abs(actual - expected)}）"
                    )
        
        return errors
    
    def _check_off_days(self, schedule: Schedule) -> List[str]:
        """检查每人休息天数是否符合要求"""
        errors = []
        required_off_days = self.config.off_days_per_month
        
        for emp_id, assignments in schedule.assignments.items():
            off_count = sum(1 for a in assignments if a.shift == ShiftType.OFF)
            if off_count < required_off_days:
                errors.append(
                    f"员工{emp_id}本月休息{off_count}天，少于要求的{required_off_days}天"
                )
        
        return errors


class ConstraintEnforcer:
    """约束执行器 - 用于排班过程中实时检查"""
    
    def __init__(self, config: Optional[SchedulingConfig] = None):
        self.config = config or SchedulingConfig()
    
    def can_assign_shift(
        self, 
        employee_shifts: List[ShiftAssignment], 
        target_date: date, 
        shift: ShiftType
    ) -> Tuple[bool, str]:
        """
        检查是否可以在指定日期给员工分配指定班次
        返回 (是否可行，原因)
        """
        # 创建临时排班用于检查
        temp_shifts = employee_shifts.copy()
        temp_shifts.append(ShiftAssignment(
            employee=employee_shifts[0].employee if employee_shifts else None,
            date=target_date,
            shift=shift
        ))
        
        # 1. 检查班次顺序约束
        valid, reason = self._check_sequence_constraint(employee_shifts, target_date, shift)
        if not valid:
            return False, reason
        
        # 2. 检查连续上班天数
        valid, reason = self._check_consecutive_work(employee_shifts, target_date, shift)
        if not valid:
            return False, reason
        
        return True, "OK"
    
    def _check_sequence_constraint(
        self, 
        employee_shifts: List[ShiftAssignment],
        target_date: date,
        shift: ShiftType
    ) -> Tuple[bool, str]:
        """检查班次顺序约束"""
        shift_map = {a.date: a.shift for a in employee_shifts}
        
        # G 班：前一天只能是休息或 G
        if shift == ShiftType.G:
            prev_date = target_date - timedelta(days=1)
            if prev_date in shift_map:
                prev_shift = shift_map[prev_date]
                if prev_shift not in [ShiftType.OFF, ShiftType.G]:
                    return False, f"G 班前一天必须是 OFF 或 G，当前是{prev_shift.value}"
        
        # Y 班：后一天只能是 Y 或休息（如果有后一天）
        if shift == ShiftType.Y:
            next_date = target_date + timedelta(days=1)
            if next_date in shift_map:
                next_shift = shift_map[next_date]
                if next_shift not in [ShiftType.OFF, ShiftType.Y]:
                    return False, f"Y 班后一天必须是 OFF 或 Y，当前是{next_shift.value}"
        
        # T 班：前不能是 Y，后不能是 G
        if shift == ShiftType.T:
            prev_date = target_date - timedelta(days=1)
            if prev_date in shift_map:
                prev_shift = shift_map[prev_date]
                if prev_shift == ShiftType.Y:
                    return False, "T 班前一天不能是 Y"
            
            next_date = target_date + timedelta(days=1)
            if next_date in shift_map:
                next_shift = shift_map[next_date]
                if next_shift == ShiftType.G:
                    return False, "T 班后一天不能是 G"
        
        return True, "OK"
    
    def _check_consecutive_work(
        self,
        employee_shifts: List[ShiftAssignment],
        target_date: date,
        shift: ShiftType
    ) -> Tuple[bool, str]:
        """检查连续上班天数"""
        if shift == ShiftType.OFF:
            return True, "OK"
        
        # 计算包含目标日期的连续上班天数
        shift_map = {a.date: a.shift for a in employee_shifts}
        shift_map[target_date] = shift
        
        # 向前计算
        consecutive = 1
        check_date = target_date - timedelta(days=1)
        while check_date in shift_map and shift_map[check_date] != ShiftType.OFF:
            consecutive += 1
            check_date -= timedelta(days=1)
        
        # 向后计算
        check_date = target_date + timedelta(days=1)
        while check_date in shift_map and shift_map[check_date] != ShiftType.OFF:
            consecutive += 1
            check_date += timedelta(days=1)
        
        if consecutive > self.config.max_consecutive_work_days:
            return False, f"连续上班{consecutive}天，超过限制{self.config.max_consecutive_work_days}天"
        
        return True, "OK"
