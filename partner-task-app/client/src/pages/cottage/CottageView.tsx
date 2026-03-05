import { useState, useEffect } from 'react';
import { Card, Row, Col, Progress, Button, message, Statistic, Space } from 'antd';
import { HomeOutlined, RiseOutlined } from '@ant-design/icons';
import api from '@/api/request';

const Cottage = () => {
  const [cottage, setCottage] = useState(null);
  const [decorations, setDecorations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [cottageRes, decorationsRes] = await Promise.all([
        api.get('/api/cottage/my'),
        api.get('/api/cottage/decorations'),
      ]);
      setCottage(cottageRes.data.cottage);
      setDecorations(decorationsRes.data.decorations);
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

  if (!cottage) return null;

  const expNeeded = cottage.level * 100;
  const expPercent = Math.min(100, (cottage.experience / expNeeded) * 100);

  return (
    <div>
      <Row gutter={16}>
        <Col span={16}>
          <Card
            title={<Space><HomeOutlined />我的小屋</Space>}
            extra={
              <Button type="primary" onClick={handleUpgrade}>
                升级小屋
              </Button>
            }
          >
            <div style={styles.cottageDisplay}>
              <div style={styles.cottageIcon}>🏠</div>
              <h2>等级 {cottage.level}</h2>
              <p>温暖度：{cottage.warmth}</p>
              <Progress
                percent={expPercent}
                title={`经验 ${cottage.experience}/${expNeeded}`}
              />
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
              <p><strong>经验:</strong> {cottage.experience} / {expNeeded}</p>
              <p><strong>已装备装饰:</strong> {decorations.filter(d => d.isEquipped).length} 个</p>
            </div>
          </Card>
        </Col>
      </Row>

      <Card title="我的装饰" style={{ marginTop: 16 }}>
        <Row gutter={16}>
          {decorations.map((item: any) => (
            <Col span={6} key={item.id}>
              <Card
                hoverable
                cover={<div style={styles.decorationCover}>{item.decoration.name}</div>}
              >
                <Card.Meta
                  title={item.decoration.name}
                  description={`温暖度 +${item.decoration.warmthBonus}`}
                />
              </Card>
            </Col>
          ))}
          {decorations.length === 0 && (
            <Col span={24}>
              <p style={{ textAlign: 'center', color: '#999' }}>暂无装饰，去商店购买吧！</p>
            </Col>
          )}
        </Row>
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

export default Cottage;
