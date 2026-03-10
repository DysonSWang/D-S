import React, { useState } from 'react';
import {
  Box,
  VStack,
  Heading,
  Input,
  Button,
  Text,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import api from '@/api/request';

const SimpleSSOLogin: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!formData.username || !formData.password) {
      setError('请输入用户名和密码');
      return;
    }

    try {
      setMessage('登录中...');
      setError('');
      
      const response = await api.post('/api/sso/login', formData);
      const { token, user } = response.data;
      
      const role = user.role || user.currentRole;
      
      // 保存 token 到 localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('userRole', role);
      
      setMessage(`登录成功！角色：${role}，正在跳转...`);
      
      // 延迟跳转，让用户看到成功消息
      setTimeout(() => {
        if (role === 'ADMIN') {
          navigate('/admin/dashboard');
        } else if (role === 'GUIDE') {
          navigate('/guide/dashboard');
        } else if (role === 'GROWER') {
          navigate('/grower/dashboard');
        } else {
          setError(`未知角色：${role}`);
        }
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.error || '登录失败');
      setMessage('');
    }
  };

  return (
    <Box maxW="md" mx="auto" mt={20} p={8} borderWidth={1} borderRadius="lg" bg="white">
      <VStack spacing={6}>
        <Heading size="lg" color="blue.500">
          单点登录
        </Heading>
        
        {message && (
          <Alert status="success">
            <AlertIcon />
            {message}
          </Alert>
        )}
        
        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}
        
        <Alert status="info">
          <AlertIcon />
          一次登录，访问所有授权角色
        </Alert>

        <Box width="full">
          <Input
            placeholder="用户名"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            size="lg"
            mb={4}
          />
          <Input
            type="password"
            placeholder="密码"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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

export default SimpleSSOLogin;
