import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Button,
  Input,
  Select,
  useToast,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  Card,
} from '@chakra-ui/react';
import { ViewIcon, CheckIcon, CloseIcon } from '@chakra-ui/icons';
import { api } from '../../api/request';

interface Task {
  id: number;
  name: string;
  description?: string;
  type?: string;
  status: string;
  difficulty: number;
  proofType: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  guide?: {
    username: string;
    nickname?: string;
  };
  grower?: {
    username: string;
    nickname?: string;
  };
  relationship?: {
    mode: string;
  };
}

interface TaskStats {
  total: number;
  byStatus: { status: string; _count: number }[];
  byType: { type: string; _count: number }[];
}

const AdminTasks: React.FC = () => {
  const toast = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    status: '',
    type: '',
  });

  useEffect(() => {
    loadTasks();
  }, [filter]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.status) params.set('status', filter.status);
      if (filter.type) params.set('type', filter.type);

      const [tasksRes, statsRes] = await Promise.all([
        api.get(`/admin/tasks?${params.toString()}`),
        api.get('/admin/tasks/stats'),
      ]);

      setTasks(tasksRes.data.tasks || []);
      setStats(statsRes.data.stats || null);
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'gray',
      IN_PROGRESS: 'blue',
      PENDING_REVIEW: 'yellow',
      COMPLETED: 'green',
      FAILED: 'red',
      ARCHIVED: 'gray',
    };
    return colors[status] || 'gray';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: '待开始',
      IN_PROGRESS: '进行中',
      PENDING_REVIEW: '待审核',
      COMPLETED: '已完成',
      FAILED: '失败',
      ARCHIVED: '已归档',
    };
    return labels[status] || status;
  };

  const getTypeLabel = (type?: string) => {
    if (!type) return '普通任务';
    const labels: Record<string, string> = {
      ONCE: '一次性',
      DAILY: '每日',
      WEEKLY: '每周',
      MONTHLY: '每月',
      CUSTOM: '自定义周期',
    };
    return labels[type] || type;
  };

  const getProofTypeLabel = (proofType: string) => {
    const labels: Record<string, string> = {
      TEXT: '文字',
      IMAGE: '图片',
      VIDEO: '视频',
      NONE: '无需证明',
    };
    return labels[proofType] || proofType;
  };

  if (loading) {
    return <Box p={8}>加载中...</Box>;
  }

  return (
    <Box p={8}>
      <VStack spacing={8} align="stretch">
        <Heading>任务管理</Heading>

        {/* 统计卡片 */}
        {stats && (
          <SimpleGrid columns={4} spacing={4}>
            <Card p={4}>
              <Stat>
                <StatLabel>任务总数</StatLabel>
                <StatNumber>{stats.total}</StatNumber>
              </Stat>
            </Card>
            <Card p={4}>
              <Stat>
                <StatLabel>进行中</StatLabel>
                <StatNumber>
                  {stats.byStatus.find(s => s.status === 'IN_PROGRESS')?._count || 0}
                </StatNumber>
              </Stat>
            </Card>
            <Card p={4}>
              <Stat>
                <StatLabel>待审核</StatLabel>
                <StatNumber>
                  {stats.byStatus.find(s => s.status === 'PENDING_REVIEW')?._count || 0}
                </StatNumber>
              </Stat>
            </Card>
            <Card p={4}>
              <Stat>
                <StatLabel>已完成</StatLabel>
                <StatNumber>
                  {stats.byStatus.find(s => s.status === 'COMPLETED')?._count || 0}
                </StatNumber>
              </Stat>
            </Card>
          </SimpleGrid>
        )}

        <Tabs>
          <TabList>
            <Tab>任务列表</Tab>
            <Tab>任务统计</Tab>
          </TabList>

          <TabPanels>
            {/* 任务列表 */}
            <TabPanel>
              <HStack mb={4} justify="space-between">
                <HStack>
                  <Select
                    placeholder="任务状态"
                    value={filter.status}
                    onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                    width={150}
                  >
                    <option value="PENDING">待开始</option>
                    <option value="IN_PROGRESS">进行中</option>
                    <option value="PENDING_REVIEW">待审核</option>
                    <option value="COMPLETED">已完成</option>
                    <option value="FAILED">失败</option>
                  </Select>
                  <Select
                    placeholder="任务类型"
                    value={filter.type}
                    onChange={(e) => setFilter({ ...filter, type: e.target.value })}
                    width={150}
                  >
                    <option value="ONCE">一次性</option>
                    <option value="DAILY">每日</option>
                    <option value="WEEKLY">每周</option>
                    <option value="MONTHLY">每月</option>
                    <option value="CUSTOM">自定义周期</option>
                  </Select>
                </HStack>
              </HStack>

              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>ID</Th>
                    <Th>任务名称</Th>
                    <Th>类型</Th>
                    <Th>引导者</Th>
                    <Th>成长者</Th>
                    <Th>状态</Th>
                    <Th>证明方式</Th>
                    <Th>创建时间</Th>
                    <Th>操作</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {tasks.map((task) => (
                    <Tr key={task.id}>
                      <Td>{task.id}</Td>
                      <Td>
                        <Text fontWeight="bold">{task.name}</Text>
                        <Text fontSize="xs" color="gray.500">
                          难度：{task.difficulty}
                        </Text>
                      </Td>
                      <Td>
                        <Badge colorScheme={task.type === 'ONCE' ? 'blue' : 'green'}>
                          {getTypeLabel(task.type)}
                        </Badge>
                      </Td>
                      <Td>
                        <Text>{task.guide?.nickname || task.guide?.username}</Text>
                      </Td>
                      <Td>
                        <Text>{task.grower?.nickname || task.grower?.username}</Text>
                      </Td>
                      <Td>
                        <Badge colorScheme={getStatusColor(task.status)}>
                          {getStatusLabel(task.status)}
                        </Badge>
                      </Td>
                      <Td>{getProofTypeLabel(task.proofType)}</Td>
                      <Td>{new Date(task.createdAt).toLocaleDateString()}</Td>
                      <Td>
                        <Button size="sm" leftIcon={<ViewIcon />}>
                          详情
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TabPanel>

            {/* 任务统计 */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Box>
                  <Heading size="md" mb={4}>按状态统计</Heading>
                  {stats?.byStatus.map((item) => (
                    <HStack key={item.status} justify="space-between" mb={2}>
                      <Text>
                        <Badge colorScheme={getStatusColor(item.status)}>
                          {getStatusLabel(item.status)}
                        </Badge>
                      </Text>
                      <Text fontWeight="bold">{item._count} 个</Text>
                    </HStack>
                  ))}
                </Box>

                <Box>
                  <Heading size="md" mb={4}>按类型统计</Heading>
                  {stats?.byType.map((item) => (
                    <HStack key={item.type || 'NONE'} justify="space-between" mb={2}>
                      <Text>
                        <Badge colorScheme={(item.type || 'ONCE') === 'ONCE' ? 'blue' : 'green'}>
                          {getTypeLabel(item.type || undefined)}
                        </Badge>
                      </Text>
                      <Text fontWeight="bold">{item._count} 个</Text>
                    </HStack>
                  ))}
                </Box>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Box>
  );
};

export default AdminTasks;
