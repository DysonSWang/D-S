import { Outlet, useNavigate } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Space, Drawer } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import {
  DashboardOutlined,
  CheckSquareOutlined,
  HomeOutlined,
  ShopOutlined,
  TrophyOutlined,
  BookOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  CalendarOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';

const { Header, Sider, Content } = Layout;

const GrowerLayout = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = [
    {
      key: '/grower/dashboard',
      icon: <DashboardOutlined />,
      label: '仪表盘',
    },
    {
      key: '/grower/tasks',
      icon: <CheckSquareOutlined />,
      label: '我的任务',
    },
    {
      key: '/grower/cottage',
      icon: <HomeOutlined />,
      label: '我的小屋',
    },
    {
      key: '/grower/collections',
      icon: <BookOutlined />,
      label: '装饰图鉴',
    },
    {
      key: '/grower/shop',
      icon: <ShopOutlined />,
      label: '奖励商店',
    },
    {
      key: '/grower/rewards',
      icon: <TrophyOutlined />,
      label: '我的奖励',
    },
    {
      key: '/grower/achievements',
      icon: <TrophyOutlined />,
      label: '成就系统',
    },
    {
      key: '/grower/preferences',
      icon: <SettingOutlined />,
      label: '偏好设置',
    },
    {
      key: '/grower/random-challenge',
      icon: <ThunderboltOutlined />,
      label: '随机挑战',
    },
    {
      key: '/grower/shop',
      icon: <ShopOutlined />,
      label: '奖励商店',
    },
    {
      key: '/grower/certificate',
      icon: <TrophyOutlined />,
      label: '关系证书',
    },
    {
      key: '/grower/calendar',
      icon: <CalendarOutlined />,
      label: '任务日历',
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenu = (
    <Menu onClick={handleLogout}>
      <Menu.Item key="logout" icon={<LogoutOutlined />}>
        退出登录
      </Menu.Item>
    </Menu>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 桌面端侧边栏 */}
      {!isMobile && (
        <Sider width={200} theme="dark">
          <div style={styles.logo}>伙伴任务系统</div>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[window.location.pathname]}
            items={menuItems}
            onClick={handleMenuClick}
          />
        </Sider>
      )}

      {/* 移动端顶部导航 */}
      {isMobile && (
        <Header style={{ ...styles.header, padding: '0 12px' }}>
          <MenuOutlined
            style={{ fontSize: 20, cursor: 'pointer' }}
            onClick={() => setMobileMenuOpen(true)}
          />
          <div style={styles.headerLeft}>成长者端</div>
          <Dropdown overlay={userMenu} trigger={['click']}>
            <Space style={{ cursor: 'pointer' }}>
              <Avatar size="small" icon={<UserOutlined />} />
            </Space>
          </Dropdown>
        </Header>
      )}

      {/* 移动端抽屉菜单 */}
      {isMobile && (
        <Drawer
          placement="left"
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          width={280}
        >
          <div style={{ marginBottom: 16, fontSize: 18, fontWeight: 'bold' }}>伙伴任务系统</div>
          <Menu
            mode="vertical"
            selectedKeys={[window.location.pathname]}
            items={menuItems}
            onClick={(e) => {
              handleMenuClick(e);
              setMobileMenuOpen(false);
            }}
          />
        </Drawer>
      )}

      <Layout>
        {!isMobile && (
          <Header style={styles.header}>
            <div style={styles.headerLeft}>成长者端</div>
            <Dropdown overlay={userMenu} trigger={['click']}>
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                <span>{user?.nickname || user?.username}</span>
              </Space>
            </Dropdown>
          </Header>
        )}
        <Content style={styles.content}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

const styles: Record<string, React.CSSProperties> = {
  logo: {
    height: 64,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    background: '#fff',
    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
  },
  headerLeft: {
    fontSize: 14,
    fontWeight: 500,
  },
  content: {
    margin: 12,
    padding: 12,
    background: '#fff',
    borderRadius: 8,
  },
};

export default GrowerLayout;
