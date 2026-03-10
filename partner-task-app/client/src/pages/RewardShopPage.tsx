/**
 * 奖励商店页面
 * 浏览商品、兑换、查看订单
 */

import { useState, useEffect } from 'react';
import {
  Card, Row, Col, Button, Tag, message, Tabs, Avatar,
  Modal, Empty, Spin,
} from 'antd';
import {
  ShopOutlined, ShoppingCartOutlined, HistoryOutlined,
  ThunderboltOutlined, HomeOutlined, StarOutlined,
  GiftOutlined, TrophyOutlined,
} from '@ant-design/icons';

const { TabPane } = Tabs;

interface ShopItem {
  id: number;
  name: string;
  description: string;
  imageUrl: string | null;
  category: string;
  priceType: string;
  price: number;
  stock: number;
  limitPerUser: number;
  itemType: string;
  isActive: boolean;
}

interface Order {
  id: number;
  itemId: number;
  quantity: number;
  totalPrice: number;
  priceType: string;
  status: string;
  createdAt: string;
  item: {
    name: string;
    imageUrl: string | null;
    category: string;
  };
}

const RewardShopPage = () => {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ShopItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState('items');
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [purchaseModal, setPurchaseModal] = useState(false);

  useEffect(() => {
    fetchItems();
    if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [activeTab]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/shop/items', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setItems(data.data.items);
      }
    } catch (error) {
      console.error('获取商品失败:', error);
      message.error('加载商品失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/shop/orders', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setOrders(data.data.orders);
      }
    } catch (error) {
      console.error('获取订单失败:', error);
    }
  };

  const handlePurchase = (item: ShopItem) => {
    setSelectedItem(item);
    setPurchaseModal(true);
  };

  const confirmPurchase = async () => {
    if (!selectedItem) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/shop/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId: selectedItem.id,
          quantity: 1,
        }),
      });
      const data = await res.json();
      if (data.success) {
        message.success('兑换成功！');
        setPurchaseModal(false);
        fetchItems();
      } else {
        message.error(data.error || '兑换失败');
      }
    } catch (error) {
      console.error('兑换失败:', error);
      message.error('兑换失败');
    }
  };

  const getPriceIcon = (priceType: string) => {
    const icons: Record<string, any> = {
      BONES: <ThunderboltOutlined />,
      FISH: <HomeOutlined />,
      GEMS: <StarOutlined />,
      HEARTS: <GiftOutlined />,
      STARS: <TrophyOutlined />,
    };
    return icons[priceType] || <ThunderboltOutlined />;
  };

  const getPriceColor = (priceType: string) => {
    const colors: Record<string, string> = {
      BONES: 'gold',
      FISH: 'blue',
      GEMS: 'purple',
      HEARTS: 'red',
      STARS: 'orange',
    };
    return colors[priceType] || 'default';
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      DECORATION: <HomeOutlined />,
      EFFECT: <ThunderboltOutlined />,
      PRIVILEGE: <TrophyOutlined />,
      PHYSICAL: <GiftOutlined />,
    };
    return icons[category] || <ShopOutlined />;
  };

  const renderShopItems = () => (
    <Row gutter={[16, 16]}>
      {items.map((item) => (
        <Col xs={24} sm={12} md={8} lg={6} key={item.id}>
          <Card
            hoverable
            cover={
              <div style={{ height: 200, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} style={{ maxWidth: '100%', maxHeight: '100%' }} />
                ) : (
                  <ShopOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />
                )}
              </div>
            }
            actions={[
              <Button
                type="primary"
                icon={<ShoppingCartOutlined />}
                onClick={() => handlePurchase(item)}
                disabled={!item.isActive || (item.stock === 0)}
              >
                {item.stock === 0 ? '售罄' : '兑换'}
              </Button>,
            ]}
          >
            <Card.Meta
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{item.name}</span>
                  {item.stock !== -1 && item.stock < 10 && (
                    <Tag color="red">余{item.stock}</Tag>
                  )}
                </div>
              }
              description={
                <div>
                  <div style={{ marginBottom: 8 }}>
                    <Tag icon={getCategoryIcon(item.category)}>{item.category}</Tag>
                  </div>
                  <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
                    {item.description}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Tag color={getPriceColor(item.priceType)} style={{ fontSize: 16 }}>
                      {getPriceIcon(item.priceType)} {item.price} {item.priceType}
                    </Tag>
                  </div>
                  {item.limitPerUser > 0 && item.limitPerUser < 999 && (
                    <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                      每人限购 {item.limitPerUser} 件
                    </div>
                  )}
                </div>
              }
            />
          </Card>
        </Col>
      ))}
    </Row>
  );

  const renderOrders = () => (
    <div>
      {orders.length === 0 ? (
        <Empty description="暂无订单记录" />
      ) : (
        <Row gutter={[16, 16]}>
          {orders.map((order) => (
            <Col xs={24} key={order.id}>
              <Card>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <Avatar
                    size={64}
                    src={order.item.imageUrl}
                    icon={<ShopOutlined />}
                    style={{ background: '#f5f5f5' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0 }}>{order.item.name}</h3>
                      <Tag color={order.status === 'COMPLETED' ? 'green' : 'default'}>
                        {order.status}
                      </Tag>
                    </div>
                    <div style={{ color: '#666', margin: '8px 0' }}>
                      数量：x{order.quantity} | 
                      实付：
                      <Tag color={getPriceColor(order.priceType)} style={{ marginLeft: 4 }}>
                        {getPriceIcon(order.priceType)} {order.totalPrice} {order.priceType}
                      </Tag>
                    </div>
                    <div style={{ fontSize: 12, color: '#999' }}>
                      下单时间：{new Date(order.createdAt).toLocaleString('zh-CN')}
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShopOutlined style={{ color: '#faad14', fontSize: 24 }} />
            <span>奖励商店</span>
          </div>
        }
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane
            tab={
              <span>
                <ShopOutlined /> 商品列表
              </span>
            }
            key="items"
          >
            {loading ? <Spin /> : renderShopItems()}
          </TabPane>
          <TabPane
            tab={
              <span>
                <HistoryOutlined /> 订单记录
              </span>
            }
            key="orders"
          >
            {renderOrders()}
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title="确认兑换"
        open={purchaseModal}
        onOk={confirmPurchase}
        onCancel={() => setPurchaseModal(false)}
        okText="确认兑换"
        cancelText="取消"
      >
        {selectedItem && (
          <div>
            <h3>{selectedItem.name}</h3>
            <p style={{ color: '#666' }}>{selectedItem.description}</p>
            <div style={{ margin: '20px 0' }}>
              <Tag color={getPriceColor(selectedItem.priceType)} style={{ fontSize: 18 }}>
                {getPriceIcon(selectedItem.priceType)} {selectedItem.price} {selectedItem.priceType}
              </Tag>
            </div>
            {selectedItem.stock !== -1 && (
              <p>库存：{selectedItem.stock} 件</p>
            )}
            {selectedItem.limitPerUser > 0 && (
              <p>每人限购：{selectedItem.limitPerUser} 件</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RewardShopPage;
