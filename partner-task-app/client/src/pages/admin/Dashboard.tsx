import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Space } from 'antd';
import {
  UserOutlined,
  SafetyCertificateOutlined,
  BlockOutlined,
  TeamOutlined,
  TaskOutlined,
} from '@ant-design/icons';
import api from '@/api/request';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentRelationships, setRecentRelationships] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, relationshipsRes] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/admin/relationships?limit=5'),
      ]);
      setStats(statsRes.data.stats);
      setRecentRelationships(relationshipsRes.data.relationships);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!stats) return null;

  const relationshipColumns = [
    {
      title: '引导者',
      dataIndex: ['guide', 'nickname'],
      key: 'guide',
    },
    {
      title: '成长者',
      dataIndex: ['grower', 'nickname'],
      key: 'grower',
    },
    {
      title: '模式',
      dataIndex: 'mode',
      key: 'mode',
      render: (mode: string) => mode === 'PARTNER' ? '成长伙伴' : '引导成长',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          PENDING: { color: 'default', text: '待确认' },
          ACTIVE: { color: 'success', text: '有效' },
          DISSOLVING: { color: 'warning', text: '冷静期' },
          DISSOLVED: { color: 'error', text: '已解除' },
        };
        const config = statusMap[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
  ];

  return (
    <div>
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总用户数"
              value={stats.users.total}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="引导者"
              value={stats.users.guides}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="成长者"
              value={stats.users.growers}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="伙伴关系"
              value={stats.relationships.total}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title={<Space><TaskOutlined />任务统计</Space>}>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="总任务数"
                  value={stats.tasks.total}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="待审核"
                  value={stats.tasks.pendingReview}
                  valueStyle={{ color: '#faad14' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col span={12}>
          <Card title={<Space><BlockOutlined />内容审核</Space>}>
            <Statistic
              title="敏感词数量"
              value={stats.moderation.sensitiveWords}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="最近关系" style={{ marginTop: 16 }}>
        <Table
          columns={relationshipColumns}
          dataSource={recentRelationships}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>
    </div>
  );
};

export default AdminDashboard;
