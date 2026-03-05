import { useState, useEffect } from 'react';
import { Table, Tag, Button, Space, Modal, Form, Input, Select, message, Card } from 'antd';
import { TaskOutlined, PlusOutlined } from '@ant-design/icons';
import api from '@/api/request';

const { TextArea } = Input;
const { Option } = Select;

const GuideTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tasksRes, relationshipsRes] = await Promise.all([
        api.get('/api/tasks/my'),
        api.get('/api/relationships/my?status=ACTIVE'),
      ]);
      setTasks(tasksRes.data.tasks);
      setRelationships(relationshipsRes.data.relationships);
    } catch (error) {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values: any) => {
    try {
      await api.post('/api/tasks', values);
      message.success('任务创建成功');
      setCreateModalVisible(false);
      form.resetFields();
      loadData();
    } catch (error: any) {
      message.error(error.response?.data?.message || '创建失败');
    }
  };

  const columns = [
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '成长者',
      dataIndex: ['grower', 'nickname'],
      key: 'grower',
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      key: 'difficulty',
      render: (difficulty: number) => '★'.repeat(difficulty),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          PENDING: { color: 'default', text: '待开始' },
          IN_PROGRESS: { color: 'processing', text: '进行中' },
          PENDING_REVIEW: { color: 'warning', text: '待审核' },
          COMPLETED: { color: 'success', text: '已完成' },
        };
        const config = statusMap[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small">查看</Button>
          {record.status === 'PENDING_REVIEW' && (
            <Button type="link" size="small">审核</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title={<Space><TaskOutlined />任务管理</Space>}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
            发布任务
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={tasks}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="发布任务"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="relationshipId"
            label="选择伙伴"
            rules={[{ required: true, message: '请选择伙伴' }]}
          >
            <Select placeholder="请选择伙伴">
              {relationships.map((r: any) => (
                <Option key={r.id} value={r.id}>
                  {r.grower?.nickname || r.grower?.username}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="name"
            label="任务名称"
            rules={[{ required: true, message: '请输入任务名称' }]}
          >
            <Input placeholder="请输入任务名称" />
          </Form.Item>

          <Form.Item
            name="description"
            label="任务描述"
            rules={[{ required: true, message: '请输入任务描述' }]}
          >
            <TextArea rows={4} placeholder="请描述任务内容" />
          </Form.Item>

          <Form.Item
            name="difficulty"
            label="难度等级"
            initialValue={1}
            rules={[{ required: true }]}
          >
            <Select>
              <Option value={1}>★ 简单</Option>
              <Option value={2}>★★ 普通</Option>
              <Option value={3}>★★★ 中等</Option>
              <Option value={4}>★★★★ 困难</Option>
              <Option value={5}>★★★★★ 极难</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="proofType"
            label="打卡方式"
            initialValue="TEXT"
            rules={[{ required: true }]}
          >
            <Select>
              <Option value="TEXT">文字描述</Option>
              <Option value="IMAGE">图片上传</Option>
              <Option value="VIDEO">视频上传</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                发布
              </Button>
              <Button onClick={() => setCreateModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default GuideTasks;
