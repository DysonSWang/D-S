import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  SimpleGrid,
  Card,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Text,
  Select,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Progress,
} from '@chakra-ui/react';
import api from '../../api/request';

interface SalesStats {
  items: {
    total: number;
    active: number;
    byCategory: { category: string; _count: number }[];
  };
  orders: {
    total: number;
    today: number;
    byStatus: { status: string; _count: number }[];
  };
  revenue: {
    total: {
      bonesSpent?: number;
      fishSpent?: number;
      gemsSpent?: number;
      heartsSpent?: number;
      starsSpent?: number;
    };
    today: {
      bonesSpent?: number;
      fishSpent?: number;
      gemsSpent?: number;
      heartsSpent?: number;
      starsSpent?: number;
    };
  };
  topItems: {
    item: { name: string; category: string };
    count: number;
    totalRevenue: number;
  }[];
  topUsers: {
    user: { username: string; nickname?: string; role: string };
    count: number;
    totalSpent: number;
  }[];
}

const SalesStats: React.FC = () => {
  const toast = useToast();
  const [stats, setStats] = useState<SalesStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('all');

  useEffect(() => {
    loadStats();
  }, [dateRange]);

  const loadStats = async () => {
    setLoading(true);
    try {
      let url = '/shop/admin/stats';
      const params = new URLSearchParams();

      if (dateRange !== 'all') {
        const endDate = new Date();
        const startDate = new Date();

        if (dateRange === 'today') {
          params.set('startDate', startDate.toISOString().split('T')[0]);
        } else if (dateRange === 'week') {
          startDate.setDate(startDate.getDate() - 7);
          params.set('startDate', startDate.toISOString().split('T')[0]);
        } else if (dateRange === 'month') {
          startDate.setMonth(startDate.getMonth() - 1);
          params.set('startDate', startDate.toISOString().split('T')[0]);
        }

        params.set('endDate', endDate.toISOString().split('T')[0]);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await api.get(url);
      setStats(res.data.data || null);
    } catch (error: any) {
      toast({
        title: '加载失败',
        description: error.message,
        status: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const getCurrencyLabel = (type: string) => {
    const labels: Record<string, string> = {
      bones: '骨头',
      fish: '鱼干',
      gems: '宝石',
      hearts: '爱心',
      stars: '星星',
    };
    return labels[type] || type;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      DECORATION: 'blue',
      EFFECT: 'purple',
      PRIVILEGE: 'green',
      PHYSICAL: 'orange',
      OTHER: 'gray',
    };
    return colors[category] || 'gray';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'yellow',
      COMPLETED: 'green',
      CANCELLED: 'red',
    };
    return colors[status] || 'gray';
  };

  if (loading || !stats) {
    return <Box p={8}>加载中...</Box>;
  }

  const totalRevenue = stats.revenue.total;
  const todayRevenue = stats.revenue.today;

  return (
    <Box p={8}>
      <VStack spacing={8} align="stretch">
        <HStack justify="space-between">
          <Heading>销售情况统计</Heading>
          <Select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            width={200}
          >
            <option value="all">全部时间</option>
            <option value="today">今日</option>
            <option value="week">近 7 天</option>
            <option value="month">近 30 天</option>
          </Select>
        </HStack>

        {/* 核心指标 */}
        <SimpleGrid columns={4} spacing={4}>
          <Card p={4}>
            <Stat>
              <StatLabel>总订单数</StatLabel>
              <StatNumber>{stats.orders.total}</StatNumber>
              <StatHelpText>今日：{stats.orders.today}</StatHelpText>
            </Stat>
          </Card>

          <Card p={4}>
            <Stat>
              <StatLabel>总商品数</StatLabel>
              <StatNumber>{stats.items.total}</StatNumber>
              <StatHelpText>上架：{stats.items.active}</StatHelpText>
            </Stat>
          </Card>

          <Card p={4}>
            <Stat>
              <StatLabel>总消费 (骨头)</StatLabel>
              <StatNumber>{totalRevenue.bonesSpent || 0}</StatNumber>
              <StatHelpText>今日：{todayRevenue.bonesSpent || 0}</StatHelpText>
            </Stat>
          </Card>

          <Card p={4}>
            <Stat>
              <StatLabel>总消费 (宝石)</StatLabel>
              <StatNumber>{totalRevenue.gemsSpent || 0}</StatNumber>
              <StatHelpText>今日：{todayRevenue.gemsSpent || 0}</StatHelpText>
            </Stat>
          </Card>
        </SimpleGrid>

        <Tabs>
          <TabList>
            <Tab>热销商品</Tab>
            <Tab>消费达人</Tab>
            <Tab>分类分布</Tab>
            <Tab>订单状态</Tab>
          </TabList>

          <TabPanels>
            {/* 热销商品 Top 10 */}
            <TabPanel>
              <Heading size="md" mb={4}>热销商品 Top 10</Heading>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>排名</Th>
                    <Th>商品名称</Th>
                    <Th>分类</Th>
                    <Th>销量</Th>
                    <Th>总收入</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {stats.topItems.map((item, index) => (
                    <Tr key={item.item.name}>
                      <Td>
                        <Badge colorScheme={index < 3 ? 'yellow' : 'gray'}>
                          #{index + 1}
                        </Badge>
                      </Td>
                      <Td>{item.item.name}</Td>
                      <Td>
                        <Badge colorScheme={getCategoryColor(item.item.category)}>
                          {item.item.category}
                        </Badge>
                      </Td>
                      <Td>{item.count}</Td>
                      <Td>{item.totalRevenue}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TabPanel>

            {/* 消费达人 Top 10 */}
            <TabPanel>
              <Heading size="md" mb={4}>消费达人 Top 10</Heading>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>排名</Th>
                    <Th>用户</Th>
                    <Th>角色</Th>
                    <Th>订单数</Th>
                    <Th>总消费</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {stats.topUsers.map((user, index) => (
                    <Tr key={user.user.username}>
                      <Td>
                        <Badge colorScheme={index < 3 ? 'yellow' : 'gray'}>
                          #{index + 1}
                        </Badge>
                      </Td>
                      <Td>{user.user.nickname || user.user.username}</Td>
                      <Td>
                        <Badge colorScheme={user.user.role === 'GROWER' ? 'blue' : 'green'}>
                          {user.user.role}
                        </Badge>
                      </Td>
                      <Td>{user.count}</Td>
                      <Td>{user.totalSpent}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TabPanel>

            {/* 分类分布 */}
            <TabPanel>
              <Heading size="md" mb={4}>商品分类分布</Heading>
              <VStack spacing={4} align="stretch">
                {stats.items.byCategory.map((cat) => {
                  const percentage = (cat._count / stats.items.total) * 100;
                  return (
                    <Box key={cat.category}>
                      <HStack justify="space-between" mb={2}>
                        <Text fontWeight="bold">
                          <Badge colorScheme={getCategoryColor(cat.category)}>
                            {cat.category}
                          </Badge>
                        </Text>
                        <Text>{cat._count} 个 ({percentage.toFixed(1)}%)</Text>
                      </HStack>
                      <Progress
                        value={percentage}
                        colorScheme={getCategoryColor(cat.category)}
                        size="sm"
                      />
                    </Box>
                  );
                })}
              </VStack>
            </TabPanel>

            {/* 订单状态 */}
            <TabPanel>
              <Heading size="md" mb={4}>订单状态分布</Heading>
              <VStack spacing={4} align="stretch">
                {stats.orders.byStatus.map((status) => {
                  const percentage = (status._count / stats.orders.total) * 100 || 0;
                  return (
                    <Box key={status.status}>
                      <HStack justify="space-between" mb={2}>
                        <Text fontWeight="bold">
                          <Badge colorScheme={getStatusColor(status.status)}>
                            {status.status}
                          </Badge>
                        </Text>
                        <Text>{status._count} 个 ({percentage.toFixed(1)}%)</Text>
                      </HStack>
                      <Progress
                        value={percentage}
                        colorScheme={getStatusColor(status.status)}
                        size="sm"
                      />
                    </Box>
                  );
                })}
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>

        {/* 货币收入明细 */}
        <Card p={4}>
          <Heading size="md" mb={4}>货币收入明细</Heading>
          <SimpleGrid columns={5} spacing={4}>
            <Stat>
              <StatLabel>骨头</StatLabel>
              <StatNumber>{totalRevenue.bonesSpent || 0}</StatNumber>
              <StatHelpText>今日：{todayRevenue.bonesSpent || 0}</StatHelpText>
            </Stat>
            <Stat>
              <StatLabel>鱼干</StatLabel>
              <StatNumber>{totalRevenue.fishSpent || 0}</StatNumber>
              <StatHelpText>今日：{todayRevenue.fishSpent || 0}</StatHelpText>
            </Stat>
            <Stat>
              <StatLabel>宝石</StatLabel>
              <StatNumber>{totalRevenue.gemsSpent || 0}</StatNumber>
              <StatHelpText>今日：{todayRevenue.gemsSpent || 0}</StatHelpText>
            </Stat>
            <Stat>
              <StatLabel>爱心</StatLabel>
              <StatNumber>{totalRevenue.heartsSpent || 0}</StatNumber>
              <StatHelpText>今日：{todayRevenue.heartsSpent || 0}</StatHelpText>
            </Stat>
            <Stat>
              <StatLabel>星星</StatLabel>
              <StatNumber>{totalRevenue.starsSpent || 0}</StatNumber>
              <StatHelpText>今日：{todayRevenue.starsSpent || 0}</StatHelpText>
            </Stat>
          </SimpleGrid>
        </Card>
      </VStack>
    </Box>
  );
};

export default SalesStats;
