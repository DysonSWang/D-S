import { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Button, Space, Tag, message, Modal } from 'antd';
import { ShopOutlined } from '@ant-design/icons';
import api from '@/api/request';

const Shop = () => {
  const [decorations, setDecorations] = useState([]);
  const [reward, setReward] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [decorationsRes, rewardsRes] = await Promise.all([
        api.get('/api/rewards/decorations'),
        api.get('/api/rewards/my'),
      ]);
      setDecorations(decorationsRes.data.decorations);
      setReward(rewardsRes.data.reward);
    } catch (error) {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (decoration: any) => {
    try {
      await api.post('/api/rewards/redeem', {
        decorationId: decoration.id,
        quantity: 1,
      });
      message.success(`购买成功：${decoration.name}`);
      loadData();
    } catch (error: any) {
      message.error(error.response?.data?.message || '购买失败');
    }
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => {
        const map: Record<string, string> = {
          HOUSE: '房屋',
          FURNITURE: '家具',
          WALL: '墙面',
          PLANT: '植物',
          EFFECT: '特效',
          PET: '宠物',
        };
        return map[category] || category;
      },
    },
    {
      title: '稀有度',
      dataIndex: 'rarity',
      key: 'rarity',
      render: (rarity: number) => {
        const colors = ['', 'default', 'blue', 'purple', 'gold'];
        const texts = ['', '普通', '稀有', '史诗', '传说'];
        return <Tag color={colors[rarity]}>{texts[rarity]}</Tag>;
      },
    },
    {
      title: '价格',
      key: 'price',
      render: (_: any, record: any) => {
        const icons: Record<string, string> = {
          BONES: '🦴',
          FISH: '🐟',
          GEMS: '💎',
        };
        return `${icons[record.priceType] || ''} ${record.price}`;
      },
    },
    {
      title: '温暖度',
      dataIndex: 'warmthBonus',
      key: 'warmthBonus',
      render: (bonus: number) => `+${bonus}`,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Button
          type="primary"
          size="small"
          onClick={() => handleRedeem(record)}
        >
          购买
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={16}>
        <Col span={6}>
          <Card title="我的资产">
            <div style={{ fontSize: 24, marginBottom: 16 }}>
              <span>🦴</span> {reward?.bones || 0}
            </div>
            <div style={{ fontSize: 24, marginBottom: 16 }}>
              <span>🐟</span> {reward?.fish || 0}
            </div>
            <div style={{ fontSize: 24 }}>
              <span>💎</span> {reward?.gems || 0}
            </div>
          </Card>
        </Col>
        <Col span={18}>
          <Card title={<Space><ShopOutlined />装饰商店</Space>}>
            <Table
              columns={columns}
              dataSource={decorations}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Shop;
