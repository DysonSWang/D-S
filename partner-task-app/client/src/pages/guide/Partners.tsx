import { useState, useEffect } from 'react';
import { Table, Tag, Button, Space, Modal, message, Card } from 'antd';
import { TeamOutlined } from '@ant-design/icons';
import api from '@/api/request';

const GuidePartners = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    try {
      const response = await api.get('/api/relationships/my');
      setPartners(response.data.relationships);
    } catch (error) {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '成长者',
      dataIndex: 'grower',
      key: 'grower',
      render: (grower: any) => (
        <Space>
          <span>{grower?.nickname || grower?.username}</span>
        </Space>
      ),
    },
    {
      title: '模式',
      dataIndex: 'mode',
      key: 'mode',
      render: (mode: string) => {
        const map: Record<string, string> = {
          PARTNER: '成长伙伴',
          GUIDE_GROWER: '引导成长',
        };
        return map[mode] || mode;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          PENDING: { color: 'default', text: '待确认' },
          ACTIVE: { color: 'success', text: '有效' },
          DISSOLVING: { color: 'warning', text: '冷静期中' },
          DISSOLVED: { color: 'error', text: '已解除' },
        };
        const config = statusMap[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '开始日期',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (date: string) => date ? new Date(date).toLocaleDateString() : '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small">查看</Button>
          {record.status === 'ACTIVE' && (
            <Button type="link" size="small" danger>
              解除关系
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card title={<Space><TeamOutlined />伙伴列表</Space>}>
        <Table
          columns={columns}
          dataSource={partners}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default GuidePartners;
