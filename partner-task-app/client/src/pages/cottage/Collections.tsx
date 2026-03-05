import { useState, useEffect } from 'react';
import { Card, Row, Col, Progress, Tag, Space, Badge, Button, Modal, message, Empty, Descriptions } from 'antd';
import { BookOutlined, CheckCircleOutlined, GiftOutlined } from '@ant-design/icons';
import api from '@/api/request';

const Collections = () => {
  const [collections, setCollections] = useState<any[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      const res = await api.get('/api/cottage/collections');
      setCollections(res.data.collections);
    } catch (error) {
      message.error('加载图鉴失败');
    } finally {
      setLoading(false);
    }
  };

  const viewCollectionDetail = async (collectionId: number) => {
    try {
      const res = await api.get(`/api/cottage/collections/${collectionId}`);
      setSelectedCollection(res.data);
      setModalVisible(true);
    } catch (error) {
      message.error('加载详情失败');
    }
  };

  const getRarityColor = (rarity: number) => {
    switch (rarity) {
      case 1: return 'default';
      case 2: return 'blue';
      case 3: return 'purple';
      case 4: return 'gold';
      default: return 'default';
    }
  };

  const getRarityText = (rarity: number) => {
    switch (rarity) {
      case 1: return '普通';
      case 2: return '稀有';
      case 3: return '史诗';
      case 4: return '传说';
      default: return '普通';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'PLANT': return '🌸';
      case 'EFFECT': return '✨';
      case 'PET': return '🐱';
      case 'WALL': return '🖼️';
      case 'FLOOR': return '🟫';
      default: return '🪑';
    }
  };

  return (
    <div>
      <Card title={<Space><BookOutlined />装饰图鉴</Space>}>
        <p style={{ marginBottom: 24, color: '#666' }}>
          收集装饰物品完成系列，赢取丰厚奖励！每个系列完成后都会发放特殊奖励。
        </p>

        <Row gutter={16}>
          {collections.map((col: any) => {
            const collectPercent = (col.progress.collectedCount / col.collection.totalItems) * 100;
            const isCompleted = col.progress.isCompleted;

            return (
              <Col span={8} key={col.collection.id}>
                <Card
                  hoverable
                  onClick={() => viewCollectionDetail(col.collection.id)}
                  cover={
                    <div style={styles.collectionCover}>
                      <span style={{ fontSize: 60 }}>📖</span>
                    </div>
                  }
                  actions={[
                    <Button 
                      key="view" 
                      type="primary" 
                      onClick={(e) => {
                        e.stopPropagation();
                        viewCollectionDetail(col.collection.id);
                      }}
                    >
                      查看详情
                    </Button>,
                  ]}
                >
                  <Card.Meta
                    title={
                      <Space>
                        {col.collection.name}
                        {isCompleted && <Tag color="green" icon={<CheckCircleOutlined />}>已完成</Tag>}
                      </Space>
                    }
                    description={
                      <div>
                        <p style={{ margin: '8px 0', color: '#666' }}>
                          {col.collection.description}
                        </p>
                        <Progress
                          percent={collectPercent}
                          status={isCompleted ? 'success' : 'active'}
                          format={() => `${col.progress.collectedCount}/${col.collection.totalItems}`}
                        />
                        {col.collection.bonusReward && (
                          <div style={{ marginTop: 8, fontSize: 12, color: '#faad14' }}>
                            <GiftOutlined /> 完成奖励：{JSON.parse(col.collection.bonusReward).bones && `🦴${JSON.parse(col.collection.bonusReward).bones} `}
                            {JSON.parse(col.collection.bonusReward).fish && `🐟${JSON.parse(col.collection.bonusReward).fish} `}
                            {JSON.parse(col.collection.bonusReward).gems && `💎${JSON.parse(col.collection.bonusReward).gems}`}
                          </div>
                        )}
                      </div>
                    }
                  />
                </Card>
              </Col>
            );
          })}
          {collections.length === 0 && (
            <Col span={24}>
              <Empty description="暂无图鉴" />
            </Col>
          )}
        </Row>
      </Card>

      {/* 图鉴详情弹窗 */}
      <Modal
        title={selectedCollection?.collection.name}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            关闭
          </Button>,
        ]}
      >
        {selectedCollection && (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="收集进度">
                {selectedCollection.progress.collectedCount}/{selectedCollection.collection.totalItems}
                {selectedCollection.progress.isCompleted && (
                  <Tag color="green" style={{ marginLeft: 8 }}>已完成</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="完成奖励">
                {selectedCollection.collection.bonusReward ? (
                  <Space>
                    {JSON.parse(selectedCollection.collection.bonusReward).bones && `🦴${JSON.parse(selectedCollection.collection.bonusReward).bones}`}
                    {JSON.parse(selectedCollection.collection.bonusReward).fish && `🐟${JSON.parse(selectedCollection.collection.bonusReward).fish}`}
                    {JSON.parse(selectedCollection.collection.bonusReward).gems && `💎${JSON.parse(selectedCollection.collection.bonusReward).gems}`}
                  </Space>
                ) : '无'}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 24 }}>
              <h3>系列装饰</h3>
              <Row gutter={16}>
                {selectedCollection.decorations.map((dec: any) => (
                  <Col span={6} key={dec.id}>
                    <Card
                      size="small"
                      cover={
                        <div style={styles.decorationCover}>
                          <span style={{ fontSize: 40 }}>
                            {getCategoryIcon(dec.category)}
                          </span>
                        </div>
                      }
                    >
                      <Card.Meta
                        title={
                          <Space>
                            {dec.name}
                            {dec.isOwned && (
                              <Badge count="已拥有" style={{ backgroundColor: '#52c41a' }} />
                            )}
                          </Space>
                        }
                        description={
                          <div>
                            <Tag color={getRarityColor(dec.rarity)}>
                              {getRarityText(dec.rarity)}
                            </Tag>
                            <div style={{ marginTop: 4 }}>
                              温暖度 +{dec.warmthBonus}
                            </div>
                            <div style={{ fontSize: 12, color: '#999' }}>
                              价格：{dec.priceType === 'BONES' ? '🦴' : dec.priceType === 'FISH' ? '🐟' : '💎'}{dec.price}
                            </div>
                          </div>
                        }
                      />
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  collectionCover: {
    height: 150,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
  },
  decorationCover: {
    height: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f5f5f5',
  },
};

export default Collections;
