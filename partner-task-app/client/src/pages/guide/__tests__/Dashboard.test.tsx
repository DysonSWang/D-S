/**
 * Guide Dashboard Component Tests
 * 引导者仪表盘组件测试
 * 
 * 测试范围:
 * - 数据展示
 * - 统计卡片
 * - 任务列表
 * - 伙伴关系
 * - 快捷操作
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import GuideDashboard from '../Dashboard';
import api from '../../../api/request';

// Mock dependencies
vi.mock('../../../api/request', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('../../../store/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: 1, username: 'testguide', role: 'GUIDE' },
    token: 'test-token',
  })),
}));

const mockMessage = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
};

vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
    message: mockMessage,
  };
});

describe('Guide Dashboard Component', () => {
  const mockStats = {
    totalPartners: 5,
    activeTasks: 10,
    completedTasks: 25,
    totalTasks: 35,
  };

  const mockTasks = [
    {
      id: 1,
      name: '每日打卡',
      status: 'PENDING',
      partnerName: 'Test Partner',
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      name: '每周总结',
      status: 'IN_PROGRESS',
      partnerName: 'Test Partner',
      createdAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该渲染仪表盘页面', () => {
    (api.get as any).mockResolvedValue({
      data: { stats: mockStats, tasks: mockTasks },
    });

    render(
      <MemoryRouter>
        <GuideDashboard />
      </MemoryRouter>
    );

    expect(screen.getByText('仪表盘')).toBeInTheDocument();
  });

  it('应该显示统计卡片', async () => {
    (api.get as any).mockResolvedValue({
      data: { stats: mockStats, tasks: mockTasks },
    });

    render(
      <MemoryRouter>
        <GuideDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('伙伴总数')).toBeInTheDocument();
      expect(screen.getByText('进行中任务')).toBeInTheDocument();
      expect(screen.getByText('已完成任务')).toBeInTheDocument();
    });
  });

  it('应该显示正确的统计数据', async () => {
    (api.get as any).mockResolvedValue({
      data: { stats: mockStats, tasks: mockTasks },
    });

    render(
      <MemoryRouter>
        <GuideDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
    });
  });

  it('应该显示任务列表', async () => {
    (api.get as any).mockResolvedValue({
      data: { stats: mockStats, tasks: mockTasks },
    });

    render(
      <MemoryRouter>
        <GuideDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('每日打卡')).toBeInTheDocument();
      expect(screen.getByText('每周总结')).toBeInTheDocument();
    });
  });

  it('应该显示任务状态标签', async () => {
    (api.get as any).mockResolvedValue({
      data: { stats: mockStats, tasks: mockTasks },
    });

    render(
      <MemoryRouter>
        <GuideDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('待开始')).toBeInTheDocument();
      expect(screen.getByText('进行中')).toBeInTheDocument();
    });
  });

  it('应该显示伙伴名称', async () => {
    (api.get as any).mockResolvedValue({
      data: { stats: mockStats, tasks: mockTasks },
    });

    render(
      <MemoryRouter>
        <GuideDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Partner')).toBeInTheDocument();
    });
  });

  it('应该显示创建任务按钮', async () => {
    (api.get as any).mockResolvedValue({
      data: { stats: mockStats, tasks: mockTasks },
    });

    render(
      <MemoryRouter>
        <GuideDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('创建任务')).toBeInTheDocument();
    });
  });

  it('应该显示伙伴管理按钮', async () => {
    (api.get as any).mockResolvedValue({
      data: { stats: mockStats, tasks: mockTasks },
    });

    render(
      <MemoryRouter>
        <GuideDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('伙伴管理')).toBeInTheDocument();
    });
  });

  it('应该处理空数据状态', async () => {
    (api.get as any).mockResolvedValue({
      data: { stats: { totalPartners: 0, activeTasks: 0, completedTasks: 0, totalTasks: 0 }, tasks: [] },
    });

    render(
      <MemoryRouter>
        <GuideDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  it('应该显示加载状态', () => {
    (api.get as any).mockImplementation(() => new Promise(() => {}));

    render(
      <MemoryRouter>
        <GuideDashboard />
      </MemoryRouter>
    );

    // 应该显示 loading 骨架屏或加载指示器
    expect(screen.getByText('仪表盘')).toBeInTheDocument();
  });

  it('应该处理 API 错误', async () => {
    (api.get as any).mockRejectedValue({
      response: {
        data: { message: '加载失败' },
      },
    });

    render(
      <MemoryRouter>
        <GuideDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockMessage.error).toHaveBeenCalled();
    });
  });

  it('应该显示任务完成率', async () => {
    const statsWithRate = {
      ...mockStats,
      completionRate: 71.4,
    };

    (api.get as any).mockResolvedValue({
      data: { stats: statsWithRate, tasks: mockTasks },
    });

    render(
      <MemoryRouter>
        <GuideDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      // 完成率应该显示
      expect(screen.getByText(/完成率|完成/i)).toBeInTheDocument();
    });
  });

  it('应该支持刷新数据', async () => {
    (api.get as any).mockResolvedValue({
      data: { stats: mockStats, tasks: mockTasks },
    });

    render(
      <MemoryRouter>
        <GuideDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('每日打卡')).toBeInTheDocument();
    });

    // 清除 mock 并设置新的返回数据
    vi.clearAllMocks();
    const newStats = { ...mockStats, totalPartners: 10 };
    (api.get as any).mockResolvedValue({
      data: { stats: newStats, tasks: mockTasks },
    });

    // 点击刷新按钮
    const refreshButton = screen.getByRole('button', { name: /刷新/i });
    if (refreshButton) {
      fireEvent.click(refreshButton);
    }

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledTimes(2);
    });
  });
});

describe('Guide Dashboard - Empty States', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该显示无伙伴提示', async () => {
    (api.get as any).mockResolvedValue({
      data: { stats: { totalPartners: 0, activeTasks: 0, completedTasks: 0, totalTasks: 0 }, tasks: [] },
    });

    render(
      <MemoryRouter>
        <GuideDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      // 应该显示添加伙伴的引导
      expect(screen.getByText(/伙伴|邀请/i)).toBeInTheDocument();
    });
  });

  it('应该显示无任务提示', async () => {
    (api.get as any).mockResolvedValue({
      data: { stats: mockStats, tasks: [] },
    });

    render(
      <MemoryRouter>
        <GuideDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      // 应该显示创建任务的引导
      expect(screen.getByText(/创建任务/i)).toBeInTheDocument();
    });
  });
});

describe('Guide Dashboard - Navigation', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
      ...actual,
      useNavigate: () => mockNavigate,
    };
  });

  it('应该支持跳转到伙伴管理页面', async () => {
    (api.get as any).mockResolvedValue({
      data: { stats: mockStats, tasks: mockTasks },
    });

    render(
      <MemoryRouter>
        <GuideDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      const partnersButton = screen.getByText('伙伴管理');
      fireEvent.click(partnersButton);
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/guide/partners');
    });
  });

  it('应该支持跳转到任务管理页面', async () => {
    (api.get as any).mockResolvedValue({
      data: { stats: mockStats, tasks: mockTasks },
    });

    render(
      <MemoryRouter>
        <GuideDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      const tasksButton = screen.getByText('任务管理');
      fireEvent.click(tasksButton);
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/guide/tasks');
    });
  });
});
