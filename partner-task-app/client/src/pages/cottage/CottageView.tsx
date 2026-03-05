import { useState, useEffect } from 'react';
import { Card, Row, Col, Progress, Button, message, Statistic, Space, Tag, Tabs, Empty, Badge } from 'antd';
import { HomeOutlined, RiseOutlined, GiftOutlined, TrophyOutlined, BookOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '@/api/request';

const CottageView = () => {
  const navigate = useNavigate();
  const [cottage, setCottage] = useState<any>(null);
  const [decorations, setDecorations] = useState([]);
  const [levelConfig, setLevelConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await api.get('/api/cottage/my');
      setCottage(res.data.cottage);
      setDecorations(res.data.decorations);
      setLevelConfig(res.data.levelConfig);
    } catch (error) {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      await api.post('/api/cottage/upgrade');
      message.success('小屋升级成功！');
      loadData();
    } catch (error: any) {
      message.error(error.response?.data?.message || '升级失败');
    }
  };

  const handleEquip = async (userDecorationId: number, slotPosition?: number) => {
    try {
      await api.post('/api/cottage/decorate', {
        userDecorationId,
        slotPosition,
        isEquipped: true,
      });
      message.success('装备成功！');
      loadData();
    } catch (error: any) {
      message.error(error.response?.data?.message || '装备失败');
    }
  };

  const handleUnequip = async (userDecorationId: number) => {
    try {
      await api.post('/api/cottage/decorate', {
        userDecorationId,
        isEquipped: false,
      });
      message.success('卸下成功！');
      loadData();
    } catch (error: any) {
      message.error(error.response?.data?.message || '卸下失败');
    }
  };

  if (!cottage || loading) return null;

  const expNeeded = cottage.level * 100;
  const expPercent = Math.min(100, (cottage.experience / expNeeded) * 100);
  const usedSlots = cottage.usedSlots || decorations.length;
  const availableSlots = cottage.maxSlots - usedSlots;

  const items = [
    {
      key: 'decorations',
      label: '我的装饰',
      children: (
        <Row gutter={16}>
          {decorations.map((item: any) => (
            <Col span={6} key={item.id}>
              <Card
                hoverable
                cover={
                  <div style={styles.decorationCover}>
                    <span style={{ fontSize: 40 }}>
                      {item.decoration.category === 'PLANT' ? '🌸' : 
                       item.decoration.category === 'EFFECT' ? '✨' :
                       item.decoration.category === 'PET' ? '🐱' : '🪑'}
                    </span>
                  </div>
                }
                actions={[
                  item.isEquipped ? (
                    <Button key="unequip" size="small" onClick={() => handleUnequip(item.id)}>
                      卸下
                    </Button>
                  ) : (
                    <Button key="equip" type="primary" size="small" onClick={() => handleEquip(item.id)}>
                      装备
                    </Button>
                  ),
                ]}
              >
                <Card.Meta
                  title={
                    <Space>
                      {item.decoration.name}
                      {item.isEquipped && <Tag color="green">装备中</Tag>}
                    </Space>
                  }
                  description={
                    <div>
                      <div>温暖度 +{item.decoration.warmthBonus}</div>
                      <div>槽位：{item.slotPosition || '未指定'}</div>
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
          {decorations.length === 0 && (
            <Col span={24}>
              <Empty description="暂无装饰，去商店购买吧！" />
            </Col>
          )}
        </Row>
      ),
    },
    {
      key: 'collections',
      label: (
        <Space>
          <BookOutlined />
          装饰图鉴
        </Space>
      ),
      children: (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Button type="primary" size="large" onClick={() => navigate('/collections')}>
            <BookOutlined /> 查看图鉴
          </Button>
          <p style={{ marginTop: 16, color: '#666' }}>
            收集装饰完成系列，赢取丰厚奖励！
          </p>
        </div>
      ),
    },
    {
      key: 'ranking',
      label: (
        <Space>
          <TrophyOutlined />
          温暖榜
        </Space>
      ),
      children: (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Button type="primary" size="large" onClick={() => navigate('/cottage/ranking')}>
            <TrophyOutlined /> 查看排行榜
          </Button>
          <p style={{ marginTop: 16, color: '#666' }}>
            看看谁的小屋最温暖！
          </p>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={16}>
        <Col span={16}>
          <Card
            title={<Space><HomeOutlined />我的小屋</Space>}
            extra={
              <Space>
                <Button onClick={() => navigate('/shop')}>
                  <GiftOutlined /> 去商店
                </Button>
                <Button type="primary" onClick={handleUpgrade} disabled={cottage.experience < expNeeded}>
                  升级小屋
                </Button>
              </Space>
            }
          >
            <div style={styles.cottageDisplay}>
              <div style={styles.cottageIcon}>🏠</div>
              <h2>等级 {cottage.level}</h2>
              <p>温暖度：<span style={{ color: '#faad14', fontSize: 24 }}>{cottage.warmth}</span></p>
              <Progress
                percent={expPercent}
                title={`经验 ${cottage.experience}/${expNeeded}`}
                status={cottage.experience >= expNeeded ? 'success' : 'active'}
              />
              {cottage.nextLevel && (
                <div style={{ marginTop: 16, padding: 12, background: '#f0f5ff', borderRadius: 8 }}>
                  <p style={{ margin: 0 }}>
                    <strong>下一级奖励:</strong> 解锁 {cottage.nextLevel.maxSlots} 个装饰槽位
                    <br />
                    <small>还需 {cottage.nextLevel.expNeeded - cottage.experience} 经验</small>
                  </p>
                </div>
              )}
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="小屋属性">
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="等级"
                  value={cottage.level}
                  prefix={<RiseOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="温暖度"
                  value={cottage.warmth}
                  valueStyle={{ color: '#faad14' }}
                />
              </Col>
            </Row>
            <div style={{ marginTop: 24 }}>
              <p><strong>装饰槽位:</strong> {usedSlots} / {cottage.maxSlots}</p>
              <Progress
                percent={(usedSlots / cottage.maxSlots) * 100}
                size="small"
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
                format={() => `${availableSlots} 个可用`}
              />
              <p style={{ marginTop: 12 }}><strong>已装备:</strong> {usedSlots} 个装饰</p>
            </div>
          </Card>

          <Card title="快速操作" style={{ marginTop: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button block onClick={() => navigate('/collections')}>
                <BookOutlined /> 查看收集进度
              </Button>
              <Button block onClick={() => navigate('/cottage/ranking')}>
                <TrophyOutlined /> 温暖度排行榜
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card title="装饰管理" style={{ marginTop: 16 }}>
        <Tabs items={items} />
      </Card>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  cottageDisplay: {
    textAlign: 'center',
    padding: '40px 0',
  },
  cottageIcon: {
    fontSize: 80,
    marginBottom: 16,
  },
  decorationCover: {
    height: 120,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f5f5f5',
    fontSize: 24,
  },
};

export default CottageView;
