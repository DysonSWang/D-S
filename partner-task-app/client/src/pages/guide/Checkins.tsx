import { useState, useEffect } from 'react';
import { Table, Tag, Button, Space, Modal, Form, Input, message, Card, Rate } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import api from '@/api/request';

const { TextArea } = Input;

const GuideCheckins = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const response = await api.get('/api/tasks/my?status=PENDING_REVIEW');
      setTasks(response.data.tasks);
    } catch (error) {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (values: any) => {
    try {
      if (values.approved) {
        await api.post(`/api/tasks/${currentTask.id}/approve`, {
          auditComment: values.comment,
          rewardOverride: values.reward,
        });
        message.success('任务已通过');
      } else {
        await api.post(`/api/tasks/${currentTask.id}/reject`, {
          auditComment: values.comment,
        });
        message.success('任务已拒绝');
      }
      setReviewModalVisible(false);
      form.resetFields();
      loadTasks();
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
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
      title: '打卡内容',
      dataIndex: 'proofContent',
      key: 'proofContent',
      ellipsis: true,
    },
    {
      title: '提交时间',
      dataIndex: 'completedAt',
      key: 'completedAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Button
          type="primary"
          size="small"
          onClick={() => {
            setCurrentTask(record);
            setReviewModalVisible(true);
          }}
        >
          审核
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Card title={<Space><CheckCircleOutlined />打卡审核</Space>}>
        <Table
          columns={columns}
          dataSource={tasks}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="审核任务"
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        footer={null}
      >
        {currentTask && (
          <div>
            <h4>{currentTask.name}</h4>
            <p><strong>打卡内容:</strong></p>
            <p>{currentTask.proofContent || '无'}</p>

            <Form form={form} layout="vertical" onFinish={handleReview}>
              <Form.Item
                name="comment"
                label="审核意见"
                rules={[{ required: true, message: '请输入审核意见' }]}
              >
                <TextArea rows={3} placeholder="请输入审核意见" />
              </Form.Item>

              <Form.Item
                name="reward"
                label="奖励配置 (可选，覆盖默认)"
              >
                <Input placeholder='{"bones": 20, "fish": 2}' />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    onClick={() => form.setFieldsValue({ approved: true })}
                  >
                    通过
                  </Button>
                  <Button
                    danger
                    htmlType="submit"
                    onClick={() => form.setFieldsValue({ approved: false })}
                  >
                    拒绝
                  </Button>
                  <Button onClick={() => setReviewModalVisible(false)}>
                    取消
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default GuideCheckins;
