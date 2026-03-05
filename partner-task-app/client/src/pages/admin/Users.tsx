import { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Tag, Switch, Modal, message, Input } from 'antd';
import { UserOutlined, PlusOutlined, SafetyOutlined } from '@ant-design/icons';
import api from '@/api/request';

const { Search } = Input;

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await api.get('/api/admin/users');
      setUsers(response.data.users);
      setTotal(response.data.total);
    } catch (error) {
      message.error('加载用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId: number, newStatus: number) => {
    try {
      await api.put(`/api/users/${userId}/status`, { status: newStatus });
      message.success('用户状态已更新');
      loadUsers();
    } catch (error: any) {
      message.error(error.response?.data?.message || '更新失败');
    }
  };

  const handleDelete = async (userId: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除此用户吗？此操作不可恢复。',
      onOk: async () => {
        try {
          await api.delete(`/api/users/${userId}`);
          message.success('用户已删除');
          loadUsers();
        } catch (error: any) {
          message.error(error.response?.data?.message || '删除失败');
        }
      },
    });
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '昵称',
      dataIndex: 'nickname',
      key: 'nickname',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const roleMap: Record<string, { color: string; text: string }> = {
          ADMIN: { color: 'red', text: '管理员' },
          GUIDE: { color: 'blue', text: '引导者' },
          GROWER: { color: 'green', text: '成长者' },
        };
        const config = roleMap[role] || { color: 'default', text: role };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: number, record: any) => (
        <Switch
          checked={status === 1}
          onChange={(checked) => handleStatusChange(record.id, checked ? 1 : 0)}
          checkedChildren="正常"
          unCheckedChildren="禁用"
        />
      ),
    },
    {
      title: '年龄验证',
      dataIndex: 'ageVerified',
      key: 'ageVerified',
      render: (verified: boolean) => verified ? '✅' : '❌',
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small">查看</Button>
          <Button
            type="link"
            size="small"
            danger
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={<Space><UserOutlined />用户管理</Space>}
      extra={
        <Space>
          <Button icon={<SafetyOutlined />}>敏感词管理</Button>
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 20,
          total: total,
          showTotal: (total) => `共 ${total} 条`,
        }}
      />
    </Card>
  );
};

export default AdminUsers;
