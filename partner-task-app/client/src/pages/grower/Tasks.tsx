import { useState, useEffect } from 'react';
import { Table, Tag, Button, Space, Modal, message, Card, Input } from 'antd';
import { PlayCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import api from '@/api/request';

const { TextArea } = Input;

const GrowerTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitModalVisible, setSubmitModalVisible] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const response = await api.get('/api/tasks/my');
      setTasks(response.data.tasks.filter((t: any) => t.myRole === 'grower'));
    } catch (error) {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async (task: any) => {
    try {
      await api.post(`/api/tasks/${task.id}/start`);
      message.success('任务已开始');
      loadTasks();
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      await api.post(`/api/tasks/${currentTask.id}/submit`, values);
      message.success('打卡已提交，等待审核');
      setSubmitModalVisible(false);
      form.resetFields();
      loadTasks();
    } catch (error: any) {
      message.error(error.response?.data?.message || '提交失败');
    }
  };

  const columns = [
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
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
      title: '截止时间',
      dataIndex: 'deadline',
      key: 'deadline',
      render: (date: string) => date ? new Date(date).toLocaleDateString() : '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          {record.status === 'PENDING' && (
            <Button
              type="primary"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => handleStart(record)}
            >
              开始
            </Button>
          )}
          {record.status === 'IN_PROGRESS' && (
            <Button
              type="primary"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => {
                setCurrentTask(record);
                setSubmitModalVisible(true);
              }}
            >
              打卡
            </Button>
          )}
          <Button type="link" size="small">查看</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card title="我的任务">
        <Table
          columns={columns}
          dataSource={tasks}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="提交打卡"
        open={submitModalVisible}
        onCancel={() => setSubmitModalVisible(false)}
        footer={null}
      >
        {currentTask && (
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <h4>{currentTask.name}</h4>
              <p>{currentTask.description}</p>
            </div>

            <Form.Item
              name="proofContent"
              label="打卡内容"
              rules={[{ required: true, message: '请输入打卡内容' }]}
            >
              <TextArea
                rows={6}
                placeholder="请描述你的完成情况和心得"
              />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  提交
                </Button>
                <Button onClick={() => setSubmitModalVisible(false)}>
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default GrowerTasks;
