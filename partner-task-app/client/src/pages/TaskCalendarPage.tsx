/**
 * 任务日历页面
 * 查看每月任务分布、完成情况统计
 */

import { useState, useEffect } from 'react';
import {
  Card, Calendar, Badge, Tag, Row, Col, Statistic,
  Select, Button, Modal, List, Empty, Tooltip,
} from 'antd';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons';

const { Option } = Select;

interface Task {
  id: number;
  name: string;
  status: string;
  type: string | null;
  difficulty: number;
  completedAt: string | null;
}

interface DayData {
  date: string;
  day: number;
  dayOfWeek: number;
  isToday: boolean;
  tasks: Task[];
  hasTasks: boolean;
  completedCount: number;
}

interface CalendarData {
  year: number;
  month: number;
  days: DayData[];
  stats: {
    total: number;
    completed: number;
    pending: number;
    inProgress: number;
  };
}

const TaskCalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [dayModal, setDayModal] = useState(false);

  useEffect(() => {
    fetchCalendarData();
  }, [currentDate]);

  const fetchCalendarData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;

      const res = await fetch(`/api/calendar/tasks?year=${year}&month=${month}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setCalendarData(data.data);
      }
    } catch (error) {
      console.error('获取日历数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMonthChange = (month: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(month);
    setCurrentDate(newDate);
  };

  const handleYearChange = (year: number) => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(year);
    setCurrentDate(newDate);
  };

  const prevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const nextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const onDateClick = (date: string) => {
    const day = calendarData?.days.find(d => d.date === date);
    if (day) {
      setSelectedDay(day);
      setDayModal(true);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      COMPLETED: 'green',
      PENDING: 'default',
      IN_PROGRESS: 'blue',
      FAILED: 'red',
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      COMPLETED: '已完成',
      PENDING: '待开始',
      IN_PROGRESS: '进行中',
      FAILED: '失败',
    };
    return texts[status] || status;
  };

  const getDifficultyColor = (level: number) => {
    const colors = ['default', 'green', 'blue', 'orange', 'red', 'purple'];
    return colors[level] || 'default';
  };

  const dateCellRender = (value: any) => {
    const dateStr = value.format('YYYY-MM-DD');
    const day = calendarData?.days.find(d => d.date === dateStr);

    if (!day || !day.hasTasks) {
      return null;
    }

    return (
      <div style={{ marginTop: 4 }}>
        <Badge
          count={day.completedCount}
          total={day.tasks.length}
          style={{
            background: day.completedCount === day.tasks.length ? '#52c41a' : '#1890ff',
          }}
        />
        <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
          {day.tasks.length} 个任务
        </div>
      </div>
    );
  };

  if (!calendarData) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <Card>
          <Empty description="暂无任务数据" />
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalendarOutlined style={{ color: '#1890ff', fontSize: 24 }} />
            <span>任务日历</span>
          </div>
        }
        extra={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Button icon={<LeftOutlined />} onClick={prevMonth} />
            <Select
              value={currentDate.getMonth()}
              onChange={handleMonthChange}
              style={{ width: 100 }}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <Option key={i} value={i}>
                  {i + 1}月
                </Option>
              ))}
            </Select>
            <Select
              value={currentDate.getFullYear()}
              onChange={handleYearChange}
              style={{ width: 100 }}
            >
              {Array.from({ length: 5 }, (_, i) => {
                const year = currentDate.getFullYear() - 2 + i;
                return (
                  <Option key={year} value={year}>
                    {year}年
                  </Option>
                );
              })}
            </Select>
            <Button icon={<RightOutlined />} onClick={nextMonth} />
          </div>
        }
      >
        {/* 统计面板 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Statistic
              title="总任务数"
              value={calendarData.stats.total}
              prefix={<CalendarOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="已完成"
              value={calendarData.stats.completed}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="进行中"
              value={calendarData.stats.inProgress}
              valueStyle={{ color: '#1890ff' }}
              prefix={<ClockCircleOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="待开始"
              value={calendarData.stats.pending}
              valueStyle={{ color: '#d9d9d9' }}
              prefix={<ThunderboltOutlined />}
            />
          </Col>
        </Row>

        {/* 日历 */}
        <Calendar
          value={currentDate}
          onChange={setCurrentDate}
          dateCellRender={dateCellRender}
          onDateClick={onDateClick}
        />

        {/* 图例 */}
        <div style={{ marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>图例说明</div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Badge count={5} total={5} style={{ background: '#52c41a' }} />
              <span>全部完成</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Badge count={3} total={5} style={{ background: '#1890ff' }} />
              <span>部分完成</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Tag color="green">已完成</Tag>
              <Tag color="blue">进行中</Tag>
              <Tag color="default">待开始</Tag>
            </div>
          </div>
        </div>
      </Card>

      {/* 日期详情弹窗 */}
      <Modal
        title={`${selectedDay?.date || ''} 的任务`}
        open={dayModal}
        onCancel={() => setDayModal(false)}
        footer={null}
        width={600}
      >
        {selectedDay && selectedDay.tasks.length > 0 ? (
          <List
            dataSource={selectedDay.tasks}
            renderItem={(task) => (
              <List.Item>
                <div style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>{task.name}</strong>
                    <Tag color={getStatusColor(task.status)}>
                      {getStatusText(task.status)}
                    </Tag>
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <Tag color={getDifficultyColor(task.difficulty)}>
                      难度 {task.difficulty}
                    </Tag>
                    {task.type && (
                      <Tag style={{ marginLeft: 4 }}>{task.type}</Tag>
                    )}
                  </div>
                  {task.completedAt && (
                    <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                      完成时间：{new Date(task.completedAt).toLocaleString('zh-CN')}
                    </div>
                  )}
                </div>
              </List.Item>
            )}
          />
        ) : (
          <Empty description="当天没有任务" />
        )}
      </Modal>
    </div>
  );
};

export default TaskCalendarPage;
