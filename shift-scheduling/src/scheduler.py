"""
排班核心算法
使用启发式算法 + 约束满足问题 (CSP) 方法
"""
import random
from typing import List, Dict, Optional, Tuple, Set
from datetime import date, timedelta
from collections import defaultdict

try:
    from .models import (
        Schedule, ShiftAssignment, ShiftType, Employee,
        ShiftCycle, SchedulingConfig, DailyRequirement
    )
    from .constraints import ConstraintEnforcer, ConstraintChecker
except ImportError:
    from models import (
        Schedule, ShiftAssignment, ShiftType, Employee,
        ShiftCycle, SchedulingConfig, DailyRequirement
    )
    from constraints import ConstraintEnforcer, ConstraintChecker


class ShiftScheduler:
    """排班调度器"""
    
    def __init__(self, config: Optional[SchedulingConfig] = None):
        self.config = config or SchedulingConfig()
        self.enforcer = ConstraintEnforcer(config)
        self.checker = ConstraintChecker(config)
    
    def generate_schedule(
        self,
        employees: List[Employee],
        cycle: ShiftCycle,
        daily_requirements: Optional[Dict[date, DailyRequirement]] = None
    ) -> Schedule:
        """
        生成排班
        
        Args:
            employees: 员工列表
            cycle: 排班周期
            daily_requirements: 每日班次需求（可选，不传则按比例计算）
        
        Returns:
            Schedule: 排班结果
        """
        # 初始化排班
        schedule = Schedule(cycle=cycle)
        
        # 初始化每个员工的排班记录
        for emp in employees:
            schedule.assignments[emp.id] = []
        
        # 如果没有指定每日需求，按比例计算
        if daily_requirements is None:
            daily_requirements = self._calculate_daily_requirements(
                employees, cycle
            )
        
        # 按组别分组员工
        employees_by_group = defaultdict(list)
        for emp in employees:
            employees_by_group[emp.group].append(emp)
        
        # 生成日期列表
        dates = []
        current = cycle.start_date
        while current <= cycle.end_date:
            dates.append(current)
            current += timedelta(days=1)
        
        # 第一阶段：为每个员工分配固定休息日
        self._assign_fixed_off_days(employees, schedule, dates, daily_requirements)
        
        # 第二阶段：分配班次
        self._assign_shifts(employees, schedule, dates, daily_requirements, employees_by_group)
        
        # 第三阶段：优化调整
        self._optimize_schedule(schedule, employees, dates, daily_requirements)
        
        return schedule
    
    def _calculate_daily_requirements(
        self,
        employees: List[Employee],
        cycle: ShiftCycle
    ) -> Dict[date, DailyRequirement]:
        """按比例计算每日班次需求"""
        requirements = {}
        total = len(employees)
        ratio = self.config.shift_ratio
        
        current = cycle.start_date
        while current <= cycle.end_date:
            requirements[current] = DailyRequirement(
                date=current,
                g_count=int(total * ratio.get(ShiftType.G, 0)),
                t_count=int(total * ratio.get(ShiftType.T, 0)),
                y_count=int(total * ratio.get(ShiftType.Y, 0))
            )
            current += timedelta(days=1)
        
        return requirements
    
    def _assign_fixed_off_days(
        self,
        employees: List[Employee],
        schedule: Schedule,
        dates: List[date],
        daily_requirements: Dict[date, DailyRequirement]
    ):
        """
        分配固定休息日
        - 考虑员工优先休息日期
        - 均匀分布休息日
        """
        off_days_per_emp = self.config.off_days_per_month
        
        for emp in employees:
            assigned_off = 0
            assigned_dates = set()
            
            # 优先分配指定的休息日期
            for pref_date in emp.preferred_off_dates:
                if pref_date in dates and assigned_off < off_days_per_emp:
                    schedule.assignments[emp.id].append(ShiftAssignment(
                        employee=emp,
                        date=pref_date,
                        shift=ShiftType.OFF
                    ))
                    assigned_dates.add(pref_date)
                    assigned_off += 1
            
            # 剩余休息日均匀分布
            remaining = off_days_per_emp - assigned_off
            if remaining > 0:
                available_dates = [d for d in dates if d not in assigned_dates]
                # 每隔几天安排一个休息日
                interval = len(available_dates) // (remaining + 1)
                for i in range(remaining):
                    idx = (i + 1) * interval
                    if idx < len(available_dates):
                        off_date = available_dates[idx]
                        schedule.assignments[emp.id].append(ShiftAssignment(
                            employee=emp,
                            date=off_date,
                            shift=ShiftType.OFF
                        ))
    
    def _assign_shifts(
        self,
        employees: List[Employee],
        schedule: Schedule,
        dates: List[date],
        daily_requirements: Dict[date, DailyRequirement],
        employees_by_group: Dict[str, List[Employee]]
    ):
        """
        分配班次
        策略：
        1. 同组员工尽量安排相同班次
        2. 满足每日人数要求
        3. 遵守班次顺序约束
        """
        # 按日期处理
        for current_date in dates:
            req = daily_requirements.get(current_date)
            if not req:
                continue
            
            # 获取当天未安排休息的员工
            available_employees = []
            for emp in employees:
                emp_shifts = schedule.assignments[emp.id]
                has_assignment = any(a.date == current_date for a in emp_shifts)
                if not has_assignment:
                    available_employees.append(emp)
            
            # 按组别分配
            remaining_g = req.g_count
            remaining_t = req.t_count
            remaining_y = req.y_count
            
            # 为每个组分配
            for group, group_employees in employees_by_group.items():
                available_in_group = [
                    emp for emp in group_employees 
                    if emp in available_employees
                ]
                
                if not available_in_group:
                    continue
                
                # 计算该组应分配的人数（按比例）
                group_ratio = len(group_employees) / len(employees)
                group_g = max(1, int(req.g_count * group_ratio))
                group_t = max(1, int(req.t_count * group_ratio))
                group_y = max(1, int(req.y_count * group_ratio))
                
                # 分配 G 班
                assigned_g = self._assign_shift_to_group(
                    available_in_group, schedule, current_date,
                    ShiftType.G, min(group_g, remaining_g)
                )
                remaining_g -= assigned_g
                available_employees = [e for e in available_employees 
                                       if e.id not in [a.employee.id for a in assigned_g]]
                
                # 分配 T 班
                available_in_group = [
                    emp for emp in group_employees 
                    if emp in available_employees
                ]
                assigned_t = self._assign_shift_to_group(
                    available_in_group, schedule, current_date,
                    ShiftType.T, min(group_t, remaining_t)
                )
                remaining_t -= assigned_t
                available_employees = [e for e in available_employees 
                                       if e.id not in [a.employee.id for a in assigned_t]]
                
                # 分配 Y 班
                available_in_group = [
                    emp for emp in group_employees 
                    if emp in available_employees
                ]
                assigned_y = self._assign_shift_to_group(
                    available_in_group, schedule, current_date,
                    ShiftType.Y, min(group_y, remaining_y)
                )
                remaining_y -= assigned_y
                available_employees = [e for e in available_employees 
                                       if e.id not in [a.employee.id for a in assigned_y]]
    
    def _assign_shift_to_group(
        self,
        employees: List[Employee],
        schedule: Schedule,
        target_date: date,
        shift: ShiftType,
        count: int
    ) -> List[ShiftAssignment]:
        """给一组员工分配指定班次"""
        assigned = []
        
        # 按优先级排序员工
        # 1. 前一天班次符合约束的优先
        # 2. 连续上班天数少的优先
        def employee_priority(emp):
            emp_shifts = schedule.assignments[emp.id]
            prev_date = target_date - timedelta(days=1)
            prev_shift = None
            for a in emp_shifts:
                if a.date == prev_date:
                    prev_shift = a.shift
                    break
            
            # 计算连续上班天数
            consecutive = 0
            check_date = target_date - timedelta(days=1)
            while check_date >= schedule.cycle.start_date:
                found = False
                for a in emp_shifts:
                    if a.date == check_date and a.shift != ShiftType.OFF:
                        consecutive += 1
                        found = True
                        break
                if not found:
                    break
                check_date -= timedelta(days=1)
            
            # 优先级：符合约束 > 连续天数少
            can_assign, _ = self.enforcer.can_assign_shift(emp_shifts, target_date, shift)
            return (0 if can_assign else 1, consecutive)
        
        sorted_employees = sorted(employees, key=employee_priority)
        
        for emp in sorted_employees:
            if len(assigned) >= count:
                break
            
            emp_shifts = schedule.assignments[emp.id]
            can_assign, reason = self.enforcer.can_assign_shift(
                emp_shifts, target_date, shift
            )
            
            if can_assign:
                assignment = ShiftAssignment(
                    employee=emp,
                    date=target_date,
                    shift=shift
                )
                schedule.assignments[emp.id].append(assignment)
                assigned.append(assignment)
        
        return assigned
    
    def _optimize_schedule(
        self,
        schedule: Schedule,
        employees: List[Employee],
        dates: List[date],
        daily_requirements: Dict[date, DailyRequirement]
    ):
        """
        优化排班
        - 修复约束违反
        - 平衡工作量
        """
        max_iterations = 100
        
        for iteration in range(max_iterations):
            errors = self.checker.validate_schedule(schedule)
            if not errors:
                break
            
            # 尝试修复第一个错误
            self._fix_constraint_violation(schedule, employees, dates, errors[0])
    
    def _fix_constraint_violation(
        self,
        schedule: Schedule,
        employees: List[Employee],
        dates: List[date],
        error: str
    ):
        """尝试修复约束违反"""
        # 简单的修复策略：交换班次
        # 实际应用中需要更智能的修复逻辑
        pass


def create_sample_employees(count: int = 200, groups: int = 10) -> List[Employee]:
    """创建示例员工数据"""
    employees = []
    
    for i in range(count):
        group = f"组{(i % groups) + 1:02d}"
        emp = Employee(
            id=f"EMP{i+1:04d}",
            name=f"员工{i+1}",
            group=group,
            fixed_off_days=8
        )
        employees.append(emp)
    
    return employees
