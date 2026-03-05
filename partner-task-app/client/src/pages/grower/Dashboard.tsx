import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Button, Progress } from 'antd';
import {
  TaskOutlined,
  TrophyOutlined,
  HomeOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import api from '@/api/request';

const GrowerDashboard = () => {
  const [stats, setStats] = useState({
    activeTasks: 0,
    completedTasks: 0,
    pendingReview: 0,
    bones: 0,
    fish: 0,
    gems: 0,
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tasksRes, rewardsRes] = await Promise.all([
        api.get('/api/tasks/my'),
        api.get('/api/rewards/my'),
      ]);

      const tasks = tasksRes.data.tasks;
      const reward = rewardsRes.data.reward;

      setStats({
        activeTasks: tasks.filter((t: any) => t.status === 'IN_PROGRESS').length,
        completedTasks: tasks.filter((t: any) => t.status === 'COMPLETED').length,
        pendingReview: tasks.filter((t: any) => t.status === 'PENDING_REVIEW').length,
        bones: reward?.bones || 0,
        fish: reward?.fish || 0,
        gems: reward?.gems || 0,
      });

      setRecentTasks(tasks.slice(0, 5));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const taskColumns = [
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          PENDING: { color: 'default', text: '待开始' },
          IN_PROGRESS: { color: 'processing', text: '进行中' },
          PENDING_REVIEW: { color: 'warning', text: '待审核' },
          COMPLETED: { color: 'success', text: '已完成' },
        };
        const config = statusMap[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '截止时间',
      dataIndex: 'deadline',
      key: 'deadline',
      render: (date: string) => date ? new Date(date).toLocaleDateString() : '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
  ];

  return (
    <div>
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="进行中任务"
              value={stats.activeTasks}
              prefix={<TaskOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待审核"
              value={stats.pendingReview}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已完成"
              value={stats.completedTasks}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="骨头"
              value={stats.bones}
              prefix="🦴"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={8}>
          <Card title="奖励资产">
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>🐟 小鱼</span>
                <strong>{stats.fish}</strong>
              </div>
              <Progress percent={Math.min(100, (stats.fish / 100) * 100)} showInfo={false} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>💎 宝石</span>
                <strong>{stats.gems}</strong>
              </div>
              <Progress percent={Math.min(100, (stats.gems / 50) * 100)} showInfo={false} />
            </div>
          </Card>
        </Col>
        <Col span={16}>
          <Card title="最近任务">
            <Table
              columns={taskColumns}
              dataSource={recentTasks}
              rowKey="id"
              loading={loading}
              pagination={false}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default GrowerDashboard;
