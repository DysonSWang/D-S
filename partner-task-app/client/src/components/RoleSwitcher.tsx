import React, { useState } from 'react';
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  Badge,
  Text,
  useToast,
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/api/request';

interface RoleSwitcherProps {
  currentRole: string;
  availableRoles?: string[];
}

const RoleSwitcher: React.FC<RoleSwitcherProps> = ({
  currentRole,
  availableRoles = [],
}) => {
  const navigate = useNavigate();
  const toast = useToast();
  const { login, user } = useAuthStore();
  const [loading, setLoading] = useState(false);

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

  const handleSwitchRole = async (targetRole: string) => {
    if (targetRole === currentRole) return;

    setLoading(true);
    try {
      // 调用切换角色 API
      const response = await api.post('/sso/switch-role', {
        targetRole,
      });

      const { token } = response.data;

      // 获取最新用户信息
      const userInfo = await api.get('/sso/me');
      const newUser = userInfo.data.data;

      // 更新登录状态
      login(token, newUser);

      // 跳转到对应角色的首页
      switch (targetRole) {
        case 'ADMIN':
          navigate('/admin/dashboard');
          break;
        case 'GUIDE':
          navigate('/guide/dashboard');
          break;
        case 'GROWER':
          navigate('/grower/dashboard');
          break;
      }

      toast({
        title: '角色切换成功',
        description: `已切换到 ${getRoleLabel(targetRole)}`,
        status: 'success',
      });
    } catch (error: any) {
      toast({
        title: '角色切换失败',
        description: error.response?.data?.error,
        status: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // 如果只有一个角色或不支持多角色，不显示切换器
  if (!availableRoles || availableRoles.length <= 1) {
    return (
      <Badge colorScheme={getRoleColor(currentRole)} px={3} py={1}>
        {getRoleLabel(currentRole)}
      </Badge>
    );
  }

  return (
    <Menu>
      <MenuButton
        as={Button}
        rightIcon={<ChevronDownIcon />}
        colorScheme={getRoleColor(currentRole)}
        isLoading={loading}
      >
        <Badge mr={2} colorScheme={getRoleColor(currentRole)}>
          {getRoleLabel(currentRole)}
        </Badge>
        切换角色
      </MenuButton>
      <MenuList>
        {availableRoles.map((role) => (
          <MenuItem
            key={role}
            onClick={() => handleSwitchRole(role)}
            icon={<Badge colorScheme={getRoleColor(role)}>{getRoleLabel(role)}</Badge>}
            isDisabled={role === currentRole}
          >
            <Text fontWeight={role === currentRole ? 'bold' : 'normal'}>
              {getRoleLabel(role)}
              {role === currentRole && ' (当前)'}
            </Text>
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
};

export default RoleSwitcher;
