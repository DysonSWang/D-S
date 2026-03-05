import { useState, useEffect } from 'react';
import { Card, Table, Tag, Row, Col, Statistic, Space } from 'antd';
import { TrophyOutlined } from '@ant-design/icons';
import api from '@/api/request';

const Rewards = () => {
  const [reward, setReward] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [rewardRes, transactionsRes] = await Promise.all([
        api.get('/api/rewards/my'),
        api.get('/api/rewards/transactions'),
      ]);
      setReward(rewardRes.data.reward);
      setTransactions(transactionsRes.data.transactions);
    } catch (error) {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const map: Record<string, { color: string; text: string }> = {
          EARN: { color: 'green', text: '获得' },
          SPEND: { color: 'red', text: '花费' },
          GIFT: { color: 'blue', text: '赠送' },
          REVOKE: { color: 'default', text: '撤销' },
        };
        const config = map[type] || { color: 'default', text: type };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '数量',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number, record: any) => (
        <span style={{ color: record.type === 'EARN' || record.type === 'GIFT' ? '#52c41a' : '#ff4d4f' }}>
          {record.type === 'EARN' || record.type === 'GIFT' ? '+' : '-'}{amount}
        </span>
      ),
    },
    {
      title: '余额',
      dataIndex: 'balance',
      key: 'balance',
    },
    {
      title: '原因',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
  ];

  if (!reward) return null;

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={4}>
          <Card>
            <Statistic
              title="骨头"
              value={reward.bones}
              prefix="🦴"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="小鱼"
              value={reward.fish}
              prefix="🐟"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="宝石"
              value={reward.gems}
              prefix="💎"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="爱心"
              value={reward.hearts}
              prefix="❤️"
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="星星"
              value={reward.stars}
              prefix="⭐"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title={<Space><TrophyOutlined />奖励流水</Space>}>
        <Table
          columns={columns}
          dataSource={transactions}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
        />
      </Card>
    </div>
  );
};

export default Rewards;
