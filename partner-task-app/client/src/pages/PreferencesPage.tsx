/**
 * 偏好设置页面
 * 用户可配置任务偏好、奖励偏好、建议方式等
 */

import { useState, useEffect } from 'react';
import { Form, Input, Select, Slider, Switch, Button, Card, message, Divider, Tag } from 'antd';
import { SettingOutlined, SaveOutlined } from '@ant-design/icons';

const { Option } = Select;

interface Preferences {
  taskPreferences: {
    communication: number;
    action: number;
    reflection: number;
    social: number;
    creative: number;
  };
  rewardPreferences: {
    preferred: string;
  };
  suggestionStyle: string;
  availableTimeSlots: any[];
  boundaries: any[];
}

const PreferencesPage = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/users/preferences', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        form.setFieldsValue(data.data);
      }
    } catch (error) {
      console.error('获取偏好设置失败:', error);
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/users/preferences', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (data.success) {
        message.success('偏好设置已保存');
      } else {
        message.error(data.error || '保存失败');
      }
    } catch (error) {
      console.error('保存偏好设置失败:', error);
      message.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
      <Card title={<><SettingOutlined /> 偏好设置</>}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            suggestionStyle: 'gentle',
            rewardPreferences: { preferred: 'bones' },
          }}
        >
          <Divider orientation="left">任务类型偏好</Divider>
          <p style={{ color: '#666', fontSize: 14 }}>
            为不同类型的任务设置偏好程度（1-5 星），系统会优先推荐高偏好类型的任务
          </p>

          <Form.Item label="沟通类任务" name={['taskPreferences', 'communication']}>
            <Slider min={0} max={5} marks={{ 0: '无感', 3: '一般', 5: '喜欢' }} />
          </Form.Item>

          <Form.Item label="行动类任务" name={['taskPreferences', 'action']}>
            <Slider min={0} max={5} marks={{ 0: '无感', 3: '一般', 5: '喜欢' }} />
          </Form.Item>

          <Form.Item label="反思类任务" name={['taskPreferences', 'reflection']}>
            <Slider min={0} max={5} marks={{ 0: '无感', 3: '一般', 5: '喜欢' }} />
          </Form.Item>

          <Form.Item label="社交类任务" name={['taskPreferences', 'social']}>
            <Slider min={0} max={5} marks={{ 0: '无感', 3: '一般', 5: '喜欢' }} />
          </Form.Item>

          <Form.Item label="创意类任务" name={['taskPreferences', 'creative']}>
            <Slider min={0} max={5} marks={{ 0: '无感', 3: '一般', 5: '喜欢' }} />
          </Form.Item>

          <Divider orientation="left">奖励偏好</Divider>
          <Form.Item label="偏好奖励类型" name={['rewardPreferences', 'preferred']}>
            <Select>
              <Option value="bones">🦴 骨头</Option>
              <Option value="fish">🐟 鱼</Option>
              <Option value="gems">💎 宝石</Option>
              <Option value="hearts">❤️ 爱心</Option>
              <Option value="stars">⭐ 星星</Option>
            </Select>
          </Form.Item>

          <Divider orientation="left">建议方式</Divider>
          <Form.Item label="引导者建议风格" name="suggestionStyle">
            <Select>
              <Option value="gentle">🌸 温柔鼓励型</Option>
              <Option value="direct">📋 直接明确型</Option>
              <Option value="humorous">😄 幽默风趣型</Option>
            </Select>
          </Form.Item>

          <Divider orientation="left">边界事项</Divider>
          <Form.Item
            label="不希望被建议的话题或活动"
            name={['boundaries', 'topics']}
            tooltip="可以填写不想涉及的话题，引导者会避免相关内容"
          >
            <Input.TextArea
              rows={3}
              placeholder="例如：不想讨论工作压力、不想进行户外运动等"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
              保存设置
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default PreferencesPage;
