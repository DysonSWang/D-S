/**
 * 随机挑战页面
 * 抽取并接受随机任务
 */

import { useState } from 'react';
import { Card, Button, Tag, message, Spin, Result, Divider } from 'antd';
import { ThunderboltOutlined, CheckOutlined, CloseOutlined, ReloadOutlined } from '@ant-design/icons';

interface RandomTask {
  name: string;
  description: string;
  difficulty: number;
  category: string;
  reward: Record<string, number>;
}

const RandomChallengePage = () => {
  const [loading, setLoading] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [currentTask, setCurrentTask] = useState<RandomTask | null>(null);

  const drawTask = async () => {
    setDrawing(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/tasks/random/draw', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setCurrentTask(data.data.task);
      } else {
        message.error(data.error || '抽取失败');
      }
    } catch (error) {
      console.error('抽取任务失败:', error);
      message.error('抽取失败');
    } finally {
      setDrawing(false);
    }
  };

  const acceptTask = async () => {
    if (!currentTask) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/tasks/random/accept', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ task: currentTask }),
      });
      const data = await res.json();
      if (data.success) {
        message.success('已接受任务！前往"我的任务"查看');
        setCurrentTask(null);
      } else {
        message.error(data.error || '接受失败');
      }
    } catch (error) {
      console.error('接受任务失败:', error);
      message.error('接受失败');
    } finally {
      setLoading(false);
    }
  };

  const declineTask = () => {
    setCurrentTask(null);
    message.info('已放弃本次任务，可以重新抽取');
  };

  const getDifficultyColor = (level: number) => {
    const colors = ['default', 'green', 'blue', 'orange', 'red', 'purple'];
    return colors[level] || 'default';
  };

  const getDifficultyText = (level: number) => {
    const texts = ['未知', '简单', '普通', '困难', '挑战', '地狱'];
    return texts[level] || '未知';
  };

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ThunderboltOutlined style={{ color: '#faad14', fontSize: 24 }} />
            <span>随机挑战</span>
          </div>
        }
        extra={
          <Button icon={<ReloadOutlined />} onClick={drawTask} loading={drawing}>
            重新抽取
          </Button>
        }
      >
        {!currentTask ? (
          <Result
            icon={<ThunderboltOutlined />}
            title="准备好了吗？"
            subTitle='点击"重新抽取"获取你的随机挑战任务！'
            extra={
              <Button type="primary" size="large" onClick={drawTask} loading={drawing}>
                开始抽取
              </Button>
            }
          />
        ) : (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 24, marginBottom: 8 }}>{currentTask.name}</h2>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                <Tag color={getDifficultyColor(currentTask.difficulty)}>
                  难度：{getDifficultyText(currentTask.difficulty)}
                </Tag>
                <Tag color="blue">{currentTask.category}</Tag>
              </div>
            </div>

            <Divider />

            <div style={{ marginBottom: 20 }}>
              <h4>任务描述：</h4>
              <p style={{ fontSize: 16, lineHeight: 1.8 }}>{currentTask.description}</p>
            </div>

            <div style={{ marginBottom: 30 }}>
              <h4>任务奖励：</h4>
              <div style={{ display: 'flex', gap: 16 }}>
                {Object.entries(currentTask.reward).map(([type, amount]) => (
                  <Tag key={type} color="gold" style={{ fontSize: 14 }}>
                    {type === 'bones' && '🦴'}
                    {type === 'fish' && '🐟'}
                    {type === 'gems' && '💎'}
                    {type === 'hearts' && '❤️'}
                    {type === 'stars' && '⭐'}
                    {' '}{amount} {type}
                  </Tag>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              <Button
                type="primary"
                size="large"
                icon={<CheckOutlined />}
                onClick={acceptTask}
                loading={loading}
              >
                接受挑战
              </Button>
              <Button
                size="large"
                icon={<CloseOutlined />}
                onClick={declineTask}
                loading={loading}
              >
                放弃
              </Button>
            </div>
          </div>
        )}
      </Card>

      <div style={{ marginTop: 20, padding: 16, background: '#f5f5f5', borderRadius: 4 }}>
        <h4>💡 什么是随机挑战？</h4>
        <p style={{ color: '#666' }}>
          随机挑战是系统为你精心准备的特别任务，涵盖沟通、行动、反思、社交、创意等多个维度。
          完成挑战不仅能获得丰厚奖励，还能帮助你突破舒适区，收获成长！
        </p>
      </div>
    </div>
  );
};

export default RandomChallengePage;
