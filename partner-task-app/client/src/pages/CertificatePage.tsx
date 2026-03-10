/**
 * 关系证书页面
 * 查看关系信息、生成证书图片、分享
 */

import { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Statistic, Avatar, Tag, message, Spin, Divider, Modal } from 'antd';
import {
  TrophyOutlined,
  DownloadOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';

interface RelationshipData {
  id: number;
  mode: string;
  status: string;
  startDate: string | null;
  createdAt: string;
  guide: {
    name: string;
    avatarUrl: string | null;
  };
  grower: {
    name: string;
    avatarUrl: string | null;
  };
}

interface CertificateData {
  relationship: RelationshipData;
  stats: {
    daysTogether: number;
    completedTasks: number;
  };
}

const CertificatePage = () => {
  const [loading, setLoading] = useState(false);
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [shareModal, setShareModal] = useState(false);
  const [shareData, setShareData] = useState<any>(null);

  useEffect(() => {
    fetchCertificate();
  }, []);

  const fetchCertificate = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // 获取用户的第一个关系（可以改为选择关系）
      const res = await fetch('/api/relationships', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      
      if (data.success && data.data.relationships && data.data.relationships.length > 0) {
        const firstRelationship = data.data.relationships[0];
        await fetchCertificateDetail(firstRelationship.id);
      } else {
        message.info('暂无伙伴关系');
      }
    } catch (error) {
      console.error('获取证书失败:', error);
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchCertificateDetail = async (relationshipId: number) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/certificates/${relationshipId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setCertificate(data.data);
      }
    } catch (error) {
      console.error('获取证书详情失败:', error);
    }
  };

  const downloadCertificate = async () => {
    if (!certificate) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/certificates/${certificate.relationship.id}/image`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `starpact_certificate_${certificate.relationship.id}.png`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        message.success('证书已下载');
      } else {
        message.error('生成失败');
      }
    } catch (error) {
      console.error('下载证书失败:', error);
      message.error('下载失败');
    }
  };

  const shareCertificate = async () => {
    if (!certificate) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/certificates/${certificate.relationship.id}/share`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (data.success) {
        setShareData(data.data);
        setShareModal(true);
      }
    } catch (error) {
      console.error('分享证书失败:', error);
      message.error('分享失败');
    }
  };

  const copyShareLink = () => {
    if (shareData?.shareUrl) {
      navigator.clipboard.writeText(shareData.shareUrl);
      message.success('链接已复制');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <Spin size="large" tip="加载证书中..." />
      </div>
    );
  }

  if (!certificate) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <Card style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2>暂无关系证书</h2>
          <p style={{ color: '#666' }}>建立伙伴关系后，即可生成专属证书</p>
          <Button type="primary">建立关系</Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: '0 auto' }}>
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrophyOutlined style={{ color: '#f39c12', fontSize: 24 }} />
            <span>伙伴关系证书</span>
          </div>
        }
        extra={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button icon={<DownloadOutlined />} onClick={downloadCertificate}>
              下载证书
            </Button>
            <Button icon={<ShareAltOutlined />} onClick={shareCertificate}>
              分享
            </Button>
          </div>
        }
      >
        {/* 证书预览区域 */}
        <div style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          borderRadius: 12,
          padding: 40,
          color: '#fff',
          textAlign: 'center',
          marginBottom: 30,
          position: 'relative',
          overflow: 'hidden',
          minHeight: 400,
        }}>
          {/* 星星装饰 */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.3 }}>
            {Array.from({ length: 30 }).map((_, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  width: Math.random() * 3 + 1,
                  height: Math.random() * 3 + 1,
                  background: '#fff',
                  borderRadius: '50%',
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
              />
            ))}
          </div>

          {/* 内容 */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h1 style={{ color: '#f39c12', fontSize: 32, marginBottom: 8 }}>
              星契 · 伙伴关系证书
            </h1>
            <p style={{ color: '#ecf0f1', fontSize: 18, marginBottom: 20 }}>
              以星为契，以心为诺
            </p>

            <Divider style={{ borderColor: '#f39c12', margin: '20px auto', width: 300 }} />

            {/* 关系双方 */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 40, marginBottom: 30 }}>
              <div>
                <Avatar size={64} src={certificate.relationship.guide.avatarUrl} style={{ background: '#3498db' }}>
                  {certificate.relationship.guide.name[0]}
                </Avatar>
                <div style={{ marginTop: 8, fontSize: 18 }}>
                  {certificate.relationship.guide.name}
                </div>
                <Tag color="blue" style={{ marginTop: 4 }}>
                  {certificate.relationship.mode === 'PARTNER' ? '伙伴' : '引导者'}
                </Tag>
              </div>

              <div style={{ fontSize: 32, color: '#f39c12' }}>⇄</div>

              <div>
                <Avatar size={64} src={certificate.relationship.grower.avatarUrl} style={{ background: '#e74c3c' }}>
                  {certificate.relationship.grower.name[0]}
                </Avatar>
                <div style={{ marginTop: 8, fontSize: 18 }}>
                  {certificate.relationship.grower.name}
                </div>
                <Tag color="red" style={{ marginTop: 4 }}>
                  {certificate.relationship.mode === 'PARTNER' ? '伙伴' : '成长者'}
                </Tag>
              </div>
            </div>

            {/* 统计数据 */}
            <Row gutter={40} style={{ marginTop: 30 }}>
              <Col span={12}>
                <Statistic
                  title="相伴天数"
                  value={certificate.stats.daysTogether}
                  suffix="天"
                  valueStyle={{ color: '#f39c12', fontSize: 36 }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="共同任务"
                  value={certificate.stats.completedTasks}
                  suffix="个"
                  valueStyle={{ color: '#f39c12', fontSize: 36 }}
                />
              </Col>
            </Row>

            {/* 证书编号 */}
            <div style={{ marginTop: 40, fontSize: 12, color: '#95a5a6' }}>
              <div>证书编号：SC-{certificate.relationship.id.toString().padStart(6, '0')}</div>
              <div>
                生成日期：{new Date().toLocaleDateString('zh-CN')}
              </div>
            </div>
          </div>
        </div>

        {/* 关系信息 */}
        <Card title="关系信息" size="small">
          <Row gutter={16}>
            <Col span={8}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 14, color: '#666' }}>关系模式</div>
                <div style={{ fontSize: 18, fontWeight: 'bold' }}>
                  {certificate.relationship.mode === 'PARTNER' ? '平等伙伴' : '指导成长'}
                </div>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 14, color: '#666' }}>关系状态</div>
                <Tag color={certificate.relationship.status === 'ACTIVE' ? 'green' : 'default'}>
                  {certificate.relationship.status}
                </Tag>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 14, color: '#666' }}>建立时间</div>
                <div style={{ fontSize: 14 }}>
                  {new Date(certificate.relationship.startDate || certificate.relationship.createdAt).toLocaleDateString('zh-CN')}
                </div>
              </div>
            </Col>
          </Row>
        </Card>
      </Card>

      {/* 分享弹窗 */}
      <Modal
        title="分享证书"
        open={shareModal}
        onCancel={() => setShareModal(false)}
        footer={
          <Button type="primary" onClick={copyShareLink}>
            复制链接
          </Button>
        }
      >
        <div style={{ textAlign: 'center', padding: 20 }}>
          <p>分享你的伙伴关系证书：</p>
          <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 4, wordBreak: 'break-all' }}>
            {shareData?.shareUrl}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CertificatePage;
