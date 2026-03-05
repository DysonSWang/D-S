import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Button, Space } from 'antd';
import {
  TeamOutlined,
  TaskOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import api from '@/api/request';

const GuideDashboard = () => {
  const [stats, setStats] = useState({
    partners: 0,
    totalTasks: 0,
    pendingReview: 0,
    completedTasks: 0,
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [relationshipsRes, tasksRes] = await Promise.all([
        api.get('/api/relationships/my'),
        api.get('/api/tasks/my'),
      ]);

      setStats({
        partners: relationshipsRes.data.relationships.length,
        totalTasks: tasksRes.data.tasks.length,
        pendingReview: tasksRes.data.tasks.filter((t: any) => t.status === 'PENDING_REVIEW').length,
        completedTasks: tasksRes.data.tasks.filter((t: any) => t.status === 'COMPLETED').length,
      });

      setRecentTasks(tasksRes.data.tasks.slice(0, 5));
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
      title: '成长者',
      dataIndex: ['grower', 'nickname'],
      key: 'grower',
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
          FAILED: { color: 'error', text: '已失败' },
        };
        const config = statusMap[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
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
              title="伙伴数量"
              value={stats.partners}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="任务总数"
              value={stats.totalTasks}
              prefix={<TaskOutlined />}
              valueStyle={{ color: '#722ed1' }}
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
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="最近任务" style={{ marginTop: 24 }}>
        <Table
          columns={taskColumns}
          dataSource={recentTasks}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>
    </div>
  );
};

export default GuideDashboard;
