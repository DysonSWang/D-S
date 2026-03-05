import { Outlet, useNavigate } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Space } from 'antd';
import {
  DashboardOutlined,
  TaskOutlined,
  HomeOutlined,
  ShopOutlined,
  TrophyOutlined,
  BookOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';

const { Header, Sider, Content } = Layout;

const GrowerLayout = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const menuItems = [
    {
      key: '/grower/dashboard',
      icon: <DashboardOutlined />,
      label: '仪表盘',
    },
    {
      key: '/grower/tasks',
      icon: <TaskOutlined />,
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
      <Layout>
        <Header style={styles.header}>
          <div style={styles.headerLeft}>成长者端</div>
          <Dropdown overlay={userMenu} trigger={['click']}>
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} />
              <span>{user?.nickname || user?.username}</span>
            </Space>
          </Dropdown>
        </Header>
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
    padding: '0 24px',
    background: '#fff',
    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
  },
  headerLeft: {
    fontSize: 16,
    fontWeight: 500,
  },
  content: {
    margin: 24,
    padding: 24,
    background: '#fff',
    borderRadius: 4,
  },
};

export default GrowerLayout;
