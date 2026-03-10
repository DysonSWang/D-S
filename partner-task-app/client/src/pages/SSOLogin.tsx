import React, { useState } from 'react';
import {
  Box,
  VStack,
  Heading,
  Input,
  Button,
  useToast,
  Text,
  Alert,
  AlertIcon,
  Select,
  Badge,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import api from '@/api/request';

const SSOLogin: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { login } = useAuthStore();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [showRoleSelect, setShowRoleSelect] = useState(false);

  const handleLogin = async () => {
    if (!formData.username || !formData.password) {
      toast({
        title: '请输入用户名和密码',
        status: 'warning',
      });
      return;
    }

    try {
      // 使用 SSO 登录
      const response = await api.post('/sso/login', formData);
      const { token, user } = response.data;

      // 检查是否有多个角色
      if (user.roles && user.roles.length > 1) {
        setUserRoles(user.roles);
        setSelectedRole(user.role);
        setShowRoleSelect(true);
        toast({
          title: '登录成功',
          description: '请选择要使用的角色',
          status: 'success',
        });
      } else {
        // 只有一个角色，直接登录
        login(token, user);
        redirectToDashboard(user.role);
        toast({
          title: '登录成功',
          status: 'success',
        });
      }
    } catch (error: any) {
      toast({
        title: '登录失败',
        description: error.response?.data?.error || '用户名或密码错误',
        status: 'error',
      });
    }
  };

  const handleRoleConfirm = async () => {
    if (!selectedRole) {
      toast({
        title: '请选择角色',
        status: 'warning',
      });
      return;
    }

    try {
      // 切换角色
      const response = await api.post('/sso/switch-role', {
        targetRole: selectedRole,
      });

      const { token } = response.data;
      
      // 更新用户信息
      const userInfo = await api.get('/sso/me');
      const user = userInfo.data.data;

      login(token, user);
      redirectToDashboard(selectedRole);
      
      toast({
        title: '角色切换成功',
        status: 'success',
      });
    } catch (error: any) {
      toast({
        title: '角色切换失败',
        description: error.response?.data?.error,
        status: 'error',
      });
    }
  };

  const redirectToDashboard = (role: string) => {
    switch (role) {
      case 'ADMIN':
        navigate('/admin/dashboard');
        break;
      case 'GUIDE':
        navigate('/guide/dashboard');
        break;
      case 'GROWER':
        navigate('/grower/dashboard');
        break;
      default:
        navigate('/');
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      ADMIN: '管理员',
      GUIDE: '引导者',
      GROWER: '成长者',
    };
    return labels[role] || role;
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      ADMIN: 'red',
      GUIDE: 'blue',
      GROWER: 'green',
    };
    return colors[role] || 'gray';
  };

  if (showRoleSelect) {
    return (
      <Box maxW="md" mx="auto" mt={20} p={8} borderWidth={1} borderRadius="lg">
        <VStack spacing={6}>
          <Heading size="lg">选择角色</Heading>
          
          <Alert status="info">
            <AlertIcon />
            您的账号可以访问 {userRoles.length} 个角色，请选择要使用的角色
          </Alert>

          <Box width="full">
            <Select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              size="lg"
            >
              {userRoles.map((role) => (
                <option key={role} value={role}>
                  {getRoleLabel(role)}
                </option>
              ))}
            </Select>
          </Box>

          <Box width="full">
            <Button
              colorScheme="blue"
              width="full"
              size="lg"
              onClick={handleRoleConfirm}
            >
              确认选择
            </Button>
          </Box>

          <Button
            variant="ghost"
            onClick={() => {
              setShowRoleSelect(false);
              setUserRoles([]);
              setFormData({ username: '', password: '' });
            }}
          >
            返回重新登录
          </Button>
        </VStack>
      </Box>
    );
  }

  return (
    <Box maxW="md" mx="auto" mt={20} p={8} borderWidth={1} borderRadius="lg">
      <VStack spacing={6}>
        <Heading size="lg">单点登录</Heading>

        <Alert status="success">
          <AlertIcon />
          一次登录，访问所有授权角色
        </Alert>

        <Box width="full">
          <Input
            placeholder="用户名"
            value={formData.username}
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value })
            }
            size="lg"
            mb={4}
          />
          <Input
            type="password"
            placeholder="密码"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            size="lg"
          />
        </Box>

        <Button
          colorScheme="blue"
          width="full"
          size="lg"
          onClick={handleLogin}
        >
          登录
        </Button>

        <Text fontSize="sm" color="gray.500">
          测试账号：admin / admin123
        </Text>
      </VStack>
    </Box>
  );
};

export default SSOLogin;
