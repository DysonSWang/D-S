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
  Button,
  Input,
  Select,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Switch,
  NumberInput,
  NumberInputField,
  Text,
  Badge,
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
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon, ViewIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/request';

interface ShopItem {
  id: number;
  name: string;
  description: string;
  category: string;
  priceType: string;
  priceAmount: number;
  rewardType?: string;
  rewardAmount?: number;
  imageUrl?: string;
  stock?: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  sort: number;
  createdAt: string;
}

interface ShopOrder {
  id: number;
  userId: number;
  itemId: number;
  status: string;
  priceType: string;
  priceAmount: number;
  createdAt: string;
  user?: {
    username: string;
    nickname?: string;
    role: string;
  };
  item?: {
    name: string;
    category: string;
  };
}

interface ShopStats {
  items: {
    total: number;
    active: number;
    byCategory: { category: string; _count: number }[];
  };
  orders: {
    total: number;
    byStatus: { status: string; _count: number }[];
  };
}

const Shop: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [items, setItems] = useState<ShopItem[]>([]);
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [stats, setStats] = useState<ShopStats | null>(null);
  const [loading, setLoading] = useState(true);

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ShopItem | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ShopOrder | null>(null);

  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'DECORATION',
    priceType: 'BONES',
    priceAmount: 100,
    rewardType: '',
    rewardAmount: 0,
    imageUrl: '',
    stock: 0,
    isActive: true,
    startDate: '',
    endDate: '',
    sort: 0,
  });

  const [filter, setFilter] = useState({
    category: '',
    isActive: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [itemsRes, ordersRes, statsRes] = await Promise.all([
        api.get('/shop/admin/items'),
        api.get('/shop/admin/orders'),
        api.get('/shop/admin/stats'),
      ]);

      setItems(itemsRes.data.data?.items || []);
      setOrders(ordersRes.data.data?.orders || []);
      setStats(statsRes.data.data || null);
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

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      category: 'DECORATION',
      priceType: 'BONES',
      priceAmount: 100,
      rewardType: '',
      rewardAmount: 0,
      imageUrl: '',
      stock: 0,
      isActive: true,
      startDate: '',
      endDate: '',
      sort: 0,
    });
    setIsItemModalOpen(true);
  };

  const handleOpenEdit = (item: ShopItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      category: item.category,
      priceType: item.priceType,
      priceAmount: item.priceAmount,
      rewardType: item.rewardType || '',
      rewardAmount: item.rewardAmount || 0,
      imageUrl: item.imageUrl || '',
      stock: item.stock || 0,
      isActive: item.isActive,
      startDate: item.startDate ? item.startDate.split('T')[0] : '',
      endDate: item.endDate ? item.endDate.split('T')[0] : '',
      sort: item.sort,
    });
    setIsItemModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingItem) {
        await api.put(`/shop/admin/items/${editingItem.id}`, formData);
        toast({ title: '更新成功', status: 'success' });
      } else {
        await api.post('/shop/admin/items', formData);
        toast({ title: '创建成功', status: 'success' });
      }
      setIsItemModalOpen(false);
      loadData();
    } catch (error: any) {
      toast({
        title: '操作失败',
        description: error.message,
        status: 'error',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个商品吗？')) return;

    try {
      await api.delete(`/shop/admin/items/${id}`);
      toast({ title: '删除成功', status: 'success' });
      loadData();
    } catch (error: any) {
      toast({
        title: '删除失败',
        description: error.message,
        status: 'error',
      });
    }
  };

  const handleViewOrder = (order: ShopOrder) => {
    setSelectedOrder(order);
    setIsOrderModalOpen(true);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      DECORATION: 'blue',
      EFFECT: 'purple',
      PRIVILEGE: 'green',
      OTHER: 'gray',
    };
    return colors[category] || 'gray';
  };

  const getPriceTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      BONES: '骨头',
      FISH: '鱼干',
      GEMS: '宝石',
      HEARTS: '爱心',
      STARS: '星星',
    };
    return labels[type] || type;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'yellow',
      COMPLETED: 'green',
      CANCELLED: 'red',
    };
    return colors[status] || 'gray';
  };

  if (loading) {
    return <Box p={8}>加载中...</Box>;
  }

  return (
    <Box p={8}>
      <VStack spacing={8} align="stretch">
        <Heading>商城管理</Heading>

        {/* 统计卡片 */}
        {stats && (
          <SimpleGrid columns={4} spacing={4}>
            <Stat>
              <StatLabel>商品总数</StatLabel>
              <StatNumber>{stats.items.total}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel>上架商品</StatLabel>
              <StatNumber>{stats.items.active}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel>订单总数</StatLabel>
              <StatNumber>{stats.orders.total}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel>分类数</StatLabel>
              <StatNumber>{stats.items.byCategory?.length || 0}</StatNumber>
            </Stat>
          </SimpleGrid>
        )}

        <Tabs>
          <TabList>
            <Tab>商品管理</Tab>
            <Tab>订单管理</Tab>
          </TabList>

          <TabPanels>
            {/* 商品管理 */}
            <TabPanel>
              <HStack mb={4} justify="space-between">
                <HStack>
                  <Select
                    placeholder="分类"
                    value={filter.category}
                    onChange={(e) => setFilter({ ...filter, category: e.target.value })}
                    width={150}
                  >
                    <option value="DECORATION">装饰</option>
                    <option value="EFFECT">特效</option>
                    <option value="PRIVILEGE">特权</option>
                    <option value="OTHER">其他</option>
                  </Select>
                  <Select
                    placeholder="状态"
                    value={filter.isActive}
                    onChange={(e) => setFilter({ ...filter, isActive: e.target.value })}
                    width={120}
                  >
                    <option value="true">上架</option>
                    <option value="false">下架</option>
                  </Select>
                </HStack>
                <Button colorScheme="blue" leftIcon={<AddIcon />} onClick={handleOpenCreate}>
                  添加商品
                </Button>
              </HStack>

              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>ID</Th>
                    <Th>名称</Th>
                    <Th>分类</Th>
                    <Th>价格</Th>
                    <Th>库存</Th>
                    <Th>状态</Th>
                    <Th>操作</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {items.map((item) => (
                    <Tr key={item.id}>
                      <Td>{item.id}</Td>
                      <Td>{item.name}</Td>
                      <Td>
                        <Badge colorScheme={getCategoryColor(item.category)}>
                          {item.category}
                        </Badge>
                      </Td>
                      <Td>
                        {item.priceAmount} {getPriceTypeLabel(item.priceType)}
                      </Td>
                      <Td>{item.stock || '∞'}</Td>
                      <Td>
                        <Badge colorScheme={item.isActive ? 'green' : 'red'}>
                          {item.isActive ? '上架' : '下架'}
                        </Badge>
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          <Button
                            size="sm"
                            leftIcon={<EditIcon />}
                            onClick={() => handleOpenEdit(item)}
                          >
                            编辑
                          </Button>
                          <Button
                            size="sm"
                            colorScheme="red"
                            leftIcon={<DeleteIcon />}
                            onClick={() => handleDelete(item.id)}
                          >
                            删除
                          </Button>
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TabPanel>

            {/* 订单管理 */}
            <TabPanel>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>ID</Th>
                    <Th>用户</Th>
                    <Th>商品</Th>
                    <Th>价格</Th>
                    <Th>状态</Th>
                    <Th>时间</Th>
                    <Th>操作</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {orders.map((order) => (
                    <Tr key={order.id}>
                      <Td>{order.id}</Td>
                      <Td>
                        {order.user?.nickname || order.user?.username}
                        <Text fontSize="xs" color="gray.500">
                          {order.user?.role}
                        </Text>
                      </Td>
                      <Td>
                        {order.item?.name}
                        <Text fontSize="xs" color="gray.500">
                          {order.item?.category}
                        </Text>
                      </Td>
                      <Td>
                        {order.priceAmount} {getPriceTypeLabel(order.priceType)}
                      </Td>
                      <Td>
                        <Badge colorScheme={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </Td>
                      <Td>{new Date(order.createdAt).toLocaleString()}</Td>
                      <Td>
                        <Button
                          size="sm"
                          leftIcon={<ViewIcon />}
                          onClick={() => handleViewOrder(order)}
                        >
                          查看
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>

      {/* 商品编辑/创建弹窗 */}
      <Modal isOpen={isItemModalOpen} onClose={() => setIsItemModalOpen(false)} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editingItem ? '编辑商品' : '创建商品'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>商品名称</FormLabel>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </FormControl>

              <FormControl>
                <FormLabel>描述</FormLabel>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </FormControl>

              <FormControl>
                <FormLabel>分类</FormLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="DECORATION">装饰</option>
                  <option value="EFFECT">特效</option>
                  <option value="PRIVILEGE">特权</option>
                  <option value="OTHER">其他</option>
                </Select>
              </FormControl>

              <HStack width="full">
                <FormControl>
                  <FormLabel>价格类型</FormLabel>
                  <Select
                    value={formData.priceType}
                    onChange={(e) => setFormData({ ...formData, priceType: e.target.value })}
                  >
                    <option value="BONES">骨头</option>
                    <option value="FISH">鱼干</option>
                    <option value="GEMS">宝石</option>
                    <option value="HEARTS">爱心</option>
                    <option value="STARS">星星</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>价格</FormLabel>
                  <NumberInput
                    value={formData.priceAmount}
                    onChange={(_, value) => setFormData({ ...formData, priceAmount: value })}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
              </HStack>

              <HStack width="full">
                <FormControl>
                  <FormLabel>库存</FormLabel>
                  <NumberInput
                    value={formData.stock}
                    onChange={(_, value) => setFormData({ ...formData, stock: value })}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>排序</FormLabel>
                  <NumberInput
                    value={formData.sort}
                    onChange={(_, value) => setFormData({ ...formData, sort: value })}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
              </HStack>

              <FormControl>
                <FormLabel>图片 URL</FormLabel>
                <Input
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                />
              </FormControl>

              <FormControl display="flex" alignItems="center">
                <FormLabel mb={0}>上架状态</FormLabel>
                <Switch
                  isChecked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setIsItemModalOpen(false)}>
              取消
            </Button>
            <Button colorScheme="blue" onClick={handleSubmit}>
              保存
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 订单详情弹窗 */}
      <Modal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>订单详情</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedOrder && (
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between">
                  <Text fontWeight="bold">订单 ID:</Text>
                  <Text>{selectedOrder.id}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontWeight="bold">用户:</Text>
                  <Text>
                    {selectedOrder.user?.nickname || selectedOrder.user?.username} (
                    {selectedOrder.user?.role})
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontWeight="bold">商品:</Text>
                  <Text>
                    {selectedOrder.item?.name} ({selectedOrder.item?.category})
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontWeight="bold">价格:</Text>
                  <Text>
                    {selectedOrder.priceAmount} {getPriceTypeLabel(selectedOrder.priceType)}
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontWeight="bold">状态:</Text>
                  <Badge colorScheme={getStatusColor(selectedOrder.status)}>
                    {selectedOrder.status}
                  </Badge>
                </HStack>
                <HStack justify="space-between">
                  <Text fontWeight="bold">时间:</Text>
                  <Text>{new Date(selectedOrder.createdAt).toLocaleString()}</Text>
                </HStack>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => setIsOrderModalOpen(false)}>关闭</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Shop;
