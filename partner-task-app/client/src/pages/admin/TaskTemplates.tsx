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
  useToast,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  NumberInput,
  NumberInputField,
  Switch,
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { api } from '../../api/request';

interface TaskTemplate {
  id: number;
  name: string;
  description?: string;
  type: string;
  difficulty: number;
  proofType: string;
  isActive: boolean;
  category?: string;
  createdAt: string;
}

const AdminTaskTemplates: React.FC = () => {
  const toast = useToast();
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'ONCE',
    difficulty: 1,
    proofType: 'TEXT',
    isActive: true,
    category: '',
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/task-templates');
      setTemplates(res.data.templates || []);
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
    setEditingTemplate(null);
    setFormData({
      name: '',
      description: '',
      type: 'ONCE',
      difficulty: 1,
      proofType: 'TEXT',
      isActive: true,
      category: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (template: TaskTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      type: template.type,
      difficulty: template.difficulty,
      proofType: template.proofType,
      isActive: template.isActive,
      category: template.category || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingTemplate) {
        await api.put(`/admin/task-templates/${editingTemplate.id}`, formData);
        toast({ title: '更新成功', status: 'success' });
      } else {
        await api.post('/admin/task-templates', formData);
        toast({ title: '创建成功', status: 'success' });
      }
      setIsModalOpen(false);
      loadTemplates();
    } catch (error: any) {
      toast({
        title: '操作失败',
        description: error.message,
        status: 'error',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个任务模板吗？')) return;

    try {
      await api.delete(`/admin/task-templates/${id}`);
      toast({ title: '删除成功', status: 'success' });
      loadTemplates();
    } catch (error: any) {
      toast({
        title: '删除失败',
        description: error.message,
        status: 'error',
      });
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      ONCE: '一次性',
      DAILY: '每日',
      WEEKLY: '每周',
      MONTHLY: '每月',
      CUSTOM: '自定义周期',
    };
    return labels[type] || type;
  };

  if (loading) {
    return <Box p={8}>加载中...</Box>;
  }

  return (
    <Box p={8}>
      <VStack spacing={8} align="stretch">
        <HStack justify="space-between">
          <Heading>任务模板管理</Heading>
          <Button colorScheme="blue" leftIcon={<AddIcon />} onClick={handleOpenCreate}>
            添加模板
          </Button>
        </HStack>

        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>ID</Th>
              <Th>模板名称</Th>
              <Th>类型</Th>
              <Th>分类</Th>
              <Th>难度</Th>
              <Th>证明方式</Th>
              <Th>状态</Th>
              <Th>操作</Th>
            </Tr>
          </Thead>
          <Tbody>
            {templates.map((template) => (
              <Tr key={template.id}>
                <Td>{template.id}</Td>
                <Td>
                  <Text fontWeight="bold">{template.name}</Text>
                  <Text fontSize="xs" color="gray.500">
                    {template.description?.substring(0, 50)}
                  </Text>
                </Td>
                <Td>
                  <Badge colorScheme={template.type === 'ONCE' ? 'blue' : 'green'}>
                    {getTypeLabel(template.type)}
                  </Badge>
                </Td>
                <Td>{template.category || '-'}</Td>
                <Td>{'⭐'.repeat(template.difficulty)}</Td>
                <Td>{template.proofType}</Td>
                <Td>
                  <Badge colorScheme={template.isActive ? 'green' : 'red'}>
                    {template.isActive ? '启用' : '禁用'}
                  </Badge>
                </Td>
                <Td>
                  <HStack spacing={2}>
                    <Button
                      size="sm"
                      leftIcon={<EditIcon />}
                      onClick={() => handleOpenEdit(template)}
                    >
                      编辑
                    </Button>
                    <Button
                      size="sm"
                      colorScheme="red"
                      leftIcon={<DeleteIcon />}
                      onClick={() => handleDelete(template.id)}
                    >
                      删除
                    </Button>
                  </HStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </VStack>

      {/* 编辑/创建弹窗 */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editingTemplate ? '编辑模板' : '创建模板'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>模板名称</FormLabel>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例如：每日问候"
                />
              </FormControl>

              <FormControl>
                <FormLabel>描述</FormLabel>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="任务描述..."
                />
              </FormControl>

              <HStack width="full">
                <FormControl>
                  <FormLabel>任务类型</FormLabel>
                  <Select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="ONCE">一次性任务</option>
                    <option value="DAILY">每日任务</option>
                    <option value="WEEKLY">每周任务</option>
                    <option value="MONTHLY">每月任务</option>
                    <option value="CUSTOM">自定义周期</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>分类</FormLabel>
                  <Input
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="例如：沟通、关怀"
                  />
                </FormControl>
              </HStack>

              <HStack width="full">
                <FormControl>
                  <FormLabel>难度等级</FormLabel>
                  <NumberInput
                    min={1}
                    max={5}
                    value={formData.difficulty}
                    onChange={(_, value) => setFormData({ ...formData, difficulty: value })}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>证明方式</FormLabel>
                  <Select
                    value={formData.proofType}
                    onChange={(e) => setFormData({ ...formData, proofType: e.target.value })}
                  >
                    <option value="TEXT">文字</option>
                    <option value="IMAGE">图片</option>
                    <option value="VIDEO">视频</option>
                    <option value="NONE">无需证明</option>
                  </Select>
                </FormControl>
              </HStack>

              <FormControl display="flex" alignItems="center">
                <FormLabel mb={0}>启用状态</FormLabel>
                <Switch
                  isChecked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setIsModalOpen(false)}>
              取消
            </Button>
            <Button colorScheme="blue" onClick={handleSubmit}>
              保存
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AdminTaskTemplates;
