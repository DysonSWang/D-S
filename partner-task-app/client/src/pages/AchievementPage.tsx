/**
 * 成就页面
 * 显示用户成就进度和成就墙
 */

import { useState, useEffect } from 'react';
import { Card, Button, Tag, message, Empty, Progress } from 'antd';
import { TrophyOutlined, StarOutlined, CheckCircleOutlined } from '@ant-design/icons';

interface Achievement {
  id: number;
  name: string;
  description: string;
  category: string;
  points: number;
  iconUrl: string;
  unlockedAt?: string;
  isClaimed?: boolean;
}

interface AchievementProgress {
  total: number;
  unlocked: number;
  achievements: Achievement[];
}

const AchievementPage = () => {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<AchievementProgress | null>(null);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/achievements/my', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setProgress(data.data);
      }
    } catch (error) {
      console.error('获取成就失败:', error);
      message.error('加载成就失败');
    } finally {
      setLoading(false);
    }
  };

  const claimReward = async (achievementId: number) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/achievements/${achievementId}/claim`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (data.success) {
        message.success(`领取奖励成功！获得 ${data.data.points} 点数`);
        fetchAchievements();
      } else {
        message.error(data.error || '领取失败');
      }
    } catch (error) {
      console.error('领取奖励失败:', error);
      message.error('领取奖励失败');
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      TASK: 'blue',
      RELATIONSHIP: 'pink',
      COTTAGE: 'green',
      COLLECTION: 'purple',
    };
    return colors[category] || 'default';
  };

  if (loading) {
    return <div style={{ padding: 20, textAlign: 'center' }}>加载中...</div>;
  }

  if (!progress) {
    return <Empty description="暂无成就数据" />;
  }

  const unlockRate = Math.round((progress.unlocked / progress.total) * 100);

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h1><TrophyOutlined /> 成就系统</h1>
        <div style={{ marginTop: 10 }}>
          <Progress 
            percent={unlockRate} 
            format={() => `已解锁 ${progress.unlocked}/${progress.total} 个成就`}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {progress.achievements.map((achievement) => (
          <Card
            key={achievement.id}
            hoverable
            style={{
              opacity: achievement.unlockedAt ? 1 : 0.6,
              borderColor: achievement.unlockedAt ? '#52c41a' : '#d9d9d9',
            }}
            cover={
              <div style={{ height: 120, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrophyOutlined style={{ fontSize: 60, color: achievement.unlockedAt ? '#faad14' : '#bfbfbf' }} />
              </div>
            }
            actions={achievement.unlockedAt && !achievement.isClaimed ? [
              <Button type="primary" onClick={() => claimReward(achievement.id)}>
                领取奖励
              </Button>
            ] : achievement.isClaimed ? [
              <Tag color="green"><CheckCircleOutlined /> 已领取</Tag>
            ] : []}
          >
            <Card.Meta
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{achievement.name}</span>
                  {achievement.unlockedAt && (
                    <Tag color="gold"><StarOutlined /> {achievement.points} pts</Tag>
                  )}
                </div>
              }
              description={
                <div>
                  <Tag color={getCategoryColor(achievement.category)}>{achievement.category}</Tag>
                  <p style={{ marginTop: 8, color: '#666' }}>{achievement.description}</p>
                  {achievement.unlockedAt && (
                    <p style={{ fontSize: 12, color: '#999' }}>
                      解锁时间：{new Date(achievement.unlockedAt).toLocaleDateString('zh-CN')}
                    </p>
                  )}
                </div>
              }
            />
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AchievementPage;
