import { useState, useEffect } from 'react';
import { Card, Table, Tag, Space, Avatar, Row, Col, Statistic, TrophyOutlined } from 'antd';
import { HomeOutlined, RiseOutlined } from '@ant-design/icons';
import api from '@/api/request';

const Ranking = () => {
  const [rankings, setRankings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRankings();
  }, []);

  const loadRankings = async () => {
    try {
      const res = await api.get('/api/cottage/warmth-ranking');
      setRankings(res.data.rankings);
    } catch (error) {
      console.error('加载排行榜失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const columns = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      width: 80,
      render: (rank: number) => (
        <span style={{ fontSize: 20 }}>{getRankBadge(rank)}</span>
      ),
    },
    {
      title: '用户',
      dataIndex: ['grower', 'nickname'],
      key: 'grower',
      render: (nickname: string, record: any) => (
        <Space>
          <Avatar 
            src={record.grower.avatarUrl} 
            style={{ backgroundColor: '#1890ff' }}
          >
            {nickname?.[0]?.toUpperCase() || 'U'}
          </Avatar>
          {nickname || '匿名用户'}
        </Space>
      ),
    },
    {
      title: '小屋等级',
      dataIndex: ['cottage', 'level'],
      key: 'level',
      width: 100,
      render: (level: number) => (
        <Tag color="blue">Lv.{level}</Tag>
      ),
    },
    {
      title: '温暖度',
      dataIndex: ['cottage', 'warmth'],
      key: 'warmth',
      width: 120,
      sorter: (a: any, b: any) => a.cottage.warmth - b.cottage.warmth,
      render: (warmth: number) => (
        <span style={{ color: '#faad14', fontWeight: 'bold', fontSize: 16 }}>
          🔥 {warmth}
        </span>
      ),
    },
    {
      title: '小屋主题',
      dataIndex: ['cottage', 'theme'],
      key: 'theme',
      render: (theme: string) => theme || '默认主题',
    },
  ];

  return (
    <div>
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="参与人数"
              value={rankings.length}
              prefix={<HomeOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="最高温暖度"
              value={rankings.length > 0 ? rankings[0].cottage.warmth : 0}
              prefix="🔥"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均温暖度"
              value={
                rankings.length > 0
                  ? Math.round(rankings.reduce((sum, r) => sum + r.cottage.warmth, 0) / rankings.length)
                  : 0
              }
              prefix="✨"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="小屋等级"
              value={
                rankings.length > 0
                  ? Math.round(rankings.reduce((sum, r) => sum + r.cottage.level, 0) / rankings.length)
                  : 0
              }
              prefix={<RiseOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card 
        title={<Space><TrophyOutlined />温暖度排行榜</Space>}
        style={{ marginTop: 16 }}
      >
        <Table
          columns={columns}
          dataSource={rankings}
          rowKey={(record: any) => record.rank}
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 人`,
          }}
          scroll={{ x: 800 }}
        />

        {rankings.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
            <p>暂无排行榜数据</p>
            <p>快来装饰你的小屋，成为最温暖的仔！</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Ranking;
