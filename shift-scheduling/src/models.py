"""
数据模型定义
"""
from dataclasses import dataclass, field
from typing import List, Optional, Dict, Set
from enum import Enum
from datetime import date


class ShiftType(Enum):
    """班次类型"""
    G = "G"  # 早班
    T = "T"  # 中班
    Y = "Y"  # 夜班
    OFF = "OFF"  # 休息


@dataclass
class Employee:
    """员工信息"""
    id: str  # 员工 ID
    name: str  # 姓名
    group: str  # 组别
    preferred_off_dates: Set[date] = field(default_factory=set)  # 优先休息日期
    fixed_off_days: int = 8  # 每月固定休息天数
    
    def __hash__(self):
        return hash(self.id)


@dataclass
class ShiftCycle:
    """排班周期"""
    start_date: date  # 开始日期（每月 26 日）
    end_date: date  # 结束日期（次月 25 日）
    
    @property
    def total_days(self) -> int:
        """周期总天数"""
        return (self.end_date - self.start_date).days + 1
    
    @classmethod
    def from_month(cls, year: int, month: int) -> 'ShiftCycle':
        """从年月创建排班周期"""
        from datetime import date
        import calendar
        
        start_date = date(year, month, 26)
        
        # 计算次月 25 日
        if month == 12:
            end_date = date(year + 1, 1, 25)
        else:
            # 获取下个月的天数
            _, days_in_next_month = calendar.monthrange(year, month + 1)
            end_date = date(year, month + 1, 25)
        
        return cls(start_date=start_date, end_date=end_date)


@dataclass
class DailyRequirement:
    """每日班次需求"""
    date: date
    g_count: int  # G 班人数
    t_count: int  # T 班人数
    y_count: int  # Y 班人数
    
    @property
    def total_required(self) -> int:
        return self.g_count + self.t_count + self.y_count


@dataclass
class ShiftAssignment:
    """班次分配"""
    employee: Employee
    date: date
    shift: ShiftType


@dataclass
class Schedule:
    """排班结果"""
    cycle: ShiftCycle
    assignments: Dict[str, List[ShiftAssignment]] = field(default_factory=dict)  # employee_id -> assignments
    
    def get_employee_shifts(self, employee_id: str) -> List[ShiftAssignment]:
        """获取员工的排班"""
        return self.assignments.get(employee_id, [])
    
    def get_daily_shifts(self, target_date: date) -> List[ShiftAssignment]:
        """获取某日的所有排班"""
        result = []
        for emp_id, assignments in self.assignments.items():
            for assignment in assignments:
                if assignment.date == target_date:
                    result.append(assignment)
        return result
    
    def validate(self) -> List[str]:
        """验证排班是否满足所有约束"""
        from .constraints import ConstraintChecker
        checker = ConstraintChecker()
        return checker.validate_schedule(self)


@dataclass
class SchedulingConfig:
    """排班配置"""
    # 班次比例 (G:T:Y)
    shift_ratio: Dict[ShiftType, float] = field(default_factory=lambda: {
        ShiftType.G: 0.4,
        ShiftType.T: 0.35,
        ShiftType.Y: 0.25
    })
    
    # 每人每月休息天数
    off_days_per_month: int = 8
    
    # 最大连续上班天数
    max_consecutive_work_days: int = 6
    
    # 连续上班超过 X 天需要的班次种类数
    consecutive_work_threshold: int = 3
    min_shift_types_after_threshold: int = 2
    
    # 总人数
    total_employees: int = 200
