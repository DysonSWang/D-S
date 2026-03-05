import { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Tag, Modal, Form, Input, Select, message } from 'antd';
import { SafetyOutlined, PlusOutlined } from '@ant-design/icons';
import api from '@/api/request';

const { TextArea } = Input;
const { Option } = Select;

const AdminContent = () => {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadWords();
  }, []);

  const loadWords = async () => {
    try {
      const response = await api.get('/api/admin/sensitive-words');
      setWords(response.data.words);
    } catch (error) {
      message.error('加载敏感词列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (values: any) => {
    try {
      await api.post('/api/admin/sensitive-words', values);
      message.success('敏感词添加成功');
      setModalVisible(false);
      form.resetFields();
      loadWords();
    } catch (error: any) {
      message.error(error.response?.data?.message || '添加失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/admin/sensitive-words/${id}`);
      message.success('敏感词已删除');
      loadWords();
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除失败');
    }
  };

  const columns = [
    {
      title: '敏感词',
      dataIndex: 'word',
      key: 'word',
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => {
        const map: Record<string, string> = {
          violence: '暴力',
          gambling: '赌博',
          drugs: '毒品',
          politics: '政治',
          pornography: '色情',
          other: '其他',
        };
        return map[category] || category;
      },
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      render: (level: number) => {
        const levelMap: Record<number, { color: string; text: string }> = {
          1: { color: 'default', text: '警告' },
          2: { color: 'orange', text: '屏蔽' },
          3: { color: 'red', text: '封禁' },
        };
        const config = levelMap[level] || { color: 'default', text: `L${level}` };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Button
          type="link"
          size="small"
          danger
          onClick={() => handleDelete(record.id)}
        >
          删除
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Card
        title={<Space><SafetyOutlined />内容审核 - 敏感词管理</Space>}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalVisible(true)}
          >
            添加敏感词
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={words}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
        />
      </Card>

      <Modal
        title="添加敏感词"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleAdd}>
          <Form.Item
            name="word"
            label="敏感词"
            rules={[{ required: true, message: '请输入敏感词' }]}
          >
            <Input placeholder="请输入敏感词" />
          </Form.Item>

          <Form.Item
            name="category"
            label="类别"
            rules={[{ required: true, message: '请选择类别' }]}
          >
            <Select placeholder="请选择类别">
              <Option value="violence">暴力</Option>
              <Option value="gambling">赌博</Option>
              <Option value="drugs">毒品</Option>
              <Option value="politics">政治</Option>
              <Option value="pornography">色情</Option>
              <Option value="other">其他</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="level"
            label="级别"
            initialValue={2}
            rules={[{ required: true }]}
          >
            <Select>
              <Option value={1}>L1 - 警告</Option>
              <Option value={2}>L2 - 屏蔽</Option>
              <Option value={3}>L3 - 封禁</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                添加
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminContent;
