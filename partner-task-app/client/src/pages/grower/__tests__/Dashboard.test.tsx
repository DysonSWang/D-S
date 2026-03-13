/**
 * Grower Dashboard Component Tests
 * 成长者仪表盘组件测试
 * 
 * 测试范围:
 * - 数据展示
 * - 统计卡片
 * - 任务列表
 * - 小屋入口
 * - 快捷操作
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import GrowerDashboard from '../Dashboard';
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
    user: { id: 1, username: 'testgrower', role: 'GROWER' },
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

describe('Grower Dashboard Component', () => {
  const mockStats = {
    totalTasks: 20,
    completedTasks: 15,
    pendingTasks: 3,
    inProgressTasks: 2,
    totalBones: 1500,
    totalFish: 750,
  };

  const mockTasks = [
    {
      id: 1,
      name: '每日打卡',
      status: 'PENDING',
      guideName: 'Test Guide',
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      name: '每周总结',
      status: 'IN_PROGRESS',
      guideName: 'Test Guide',
      createdAt: new Date().toISOString(),
    },
  ];

  const mockCottage = {
    id: 1,
    level: 5,
    warmth: 1250,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该渲染仪表盘页面', () => {
    (api.get as any).mockResolvedValue({
      data: { stats: mockStats, tasks: mockTasks, cottage: mockCottage },
    });

    render(
      <MemoryRouter>
        <GrowerDashboard />
      </MemoryRouter>
    );

    expect(screen.getByText('仪表盘')).toBeInTheDocument();
  });

  it('应该显示统计卡片', async () => {
    (api.get as any).mockResolvedValue({
      data: { stats: mockStats, tasks: mockTasks, cottage: mockCottage },
    });

    render(
      <MemoryRouter>
        <GrowerDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('总任务')).toBeInTheDocument();
      expect(screen.getByText('已完成')).toBeInTheDocument();
      expect(screen.getByText('进行中')).toBeInTheDocument();
    });
  });

  it('应该显示正确的统计数据', async () => {
    (api.get as any).mockResolvedValue({
      data: { stats: mockStats, tasks: mockTasks, cottage: mockCottage },
    });

    render(
      <MemoryRouter>
        <GrowerDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('20')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  it('应该显示奖励统计', async () => {
    (api.get as any).mockResolvedValue({
      data: { stats: mockStats, tasks: mockTasks, cottage: mockCottage },
    });

    render(
      <MemoryRouter>
        <GrowerDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('1500')).toBeInTheDocument();
      expect(screen.getByText('750')).toBeInTheDocument();
    });
  });

  it('应该显示任务列表', async () => {
    (api.get as any).mockResolvedValue({
      data: { stats: mockStats, tasks: mockTasks, cottage: mockCottage },
    });

    render(
      <MemoryRouter>
        <GrowerDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('每日打卡')).toBeInTheDocument();
      expect(screen.getByText('每周总结')).toBeInTheDocument();
    });
  });

  it('应该显示任务状态标签', async () => {
    (api.get as any).mockResolvedValue({
      data: { stats: mockStats, tasks: mockTasks, cottage: mockCottage },
    });

    render(
      <MemoryRouter>
        <GrowerDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('待开始')).toBeInTheDocument();
      expect(screen.getByText('进行中')).toBeInTheDocument();
    });
  });

  it('应该显示引导者名称', async () => {
    (api.get as any).mockResolvedValue({
      data: { stats: mockStats, tasks: mockTasks, cottage: mockCottage },
    });

    render(
      <MemoryRouter>
        <GrowerDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Guide')).toBeInTheDocument();
    });
  });

  it('应该显示小屋入口', async () => {
    (api.get as any).mockResolvedValue({
      data: { stats: mockStats, tasks: mockTasks, cottage: mockCottage },
    });

    render(
      <MemoryRouter>
        <GrowerDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/小屋|我的小屋/i)).toBeInTheDocument();
    });
  });

  it('应该显示小屋等级', async () => {
    (api.get as any).mockResolvedValue({
      data: { stats: mockStats, tasks: mockTasks, cottage: mockCottage },
    });

    render(
      <MemoryRouter>
        <GrowerDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/等级|Lv/i)).toBeInTheDocument();
    });
  });

  it('应该显示温暖度', async () => {
    (api.get as any).mockResolvedValue({
      data: { stats: mockStats, tasks: mockTasks, cottage: mockCottage },
    });

    render(
      <MemoryRouter>
        <GrowerDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/温暖|温馨/i)).toBeInTheDocument();
    });
  });

  it('应该显示开始任务按钮', async () => {
    (api.get as any).mockResolvedValue({
      data: { stats: mockStats, tasks: mockTasks, cottage: mockCottage },
    });

    render(
      <MemoryRouter>
        <GrowerDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/开始|执行/i)).toBeInTheDocument();
    });
  });

  it('应该处理空数据状态', async () => {
    (api.get as any).mockResolvedValue({
      data: { 
        stats: { totalTasks: 0, completedTasks: 0, pendingTasks: 0, inProgressTasks: 0, totalBones: 0, totalFish: 0 }, 
        tasks: [],
        cottage: null,
      },
    });

    render(
      <MemoryRouter>
        <GrowerDashboard />
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
        <GrowerDashboard />
      </MemoryRouter>
    );

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
        <GrowerDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockMessage.error).toHaveBeenCalled();
    });
  });

  it('应该显示任务完成率', async () => {
    (api.get as any).mockResolvedValue({
      data: { stats: mockStats, tasks: mockTasks, cottage: mockCottage },
    });

    render(
      <MemoryRouter>
        <GrowerDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/完成率|完成/i)).toBeInTheDocument();
    });
  });
});

describe('Grower Dashboard - Navigation', () => {
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

  it('应该支持跳转到任务页面', async () => {
    (api.get as any).mockResolvedValue({
      data: { stats: mockStats, tasks: mockTasks, cottage: mockCottage },
    });

    render(
      <MemoryRouter>
        <GrowerDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      const tasksButton = screen.getByText('任务管理');
      fireEvent.click(tasksButton);
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/grower/tasks');
    });
  });

  it('应该支持跳转到小屋页面', async () => {
    (api.get as any).mockResolvedValue({
      data: { stats: mockStats, tasks: mockTasks, cottage: mockCottage },
    });

    render(
      <MemoryRouter>
        <GrowerDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      const cottageButton = screen.getByText(/小屋|进入/i);
      fireEvent.click(cottageButton);
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/grower/cottage');
    });
  });

  it('应该支持跳转到奖励页面', async () => {
    (api.get as any).mockResolvedValue({
      data: { stats: mockStats, tasks: mockTasks, cottage: mockCottage },
    });

    render(
      <MemoryRouter>
        <GrowerDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      const rewardsButton = screen.getByText(/奖励|我的奖励/i);
      fireEvent.click(rewardsButton);
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/grower/rewards');
    });
  });
});

describe('Grower Dashboard - Task Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该支持开始任务', async () => {
    (api.get as any).mockResolvedValue({
      data: { stats: mockStats, tasks: mockTasks, cottage: mockCottage },
    });

    (api.post as any).mockResolvedValue({
      data: { task: { ...mockTasks[0], status: 'IN_PROGRESS' } },
    });

    render(
      <MemoryRouter>
        <GrowerDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      const startButton = screen.getByText('开始');
      fireEvent.click(startButton);
    });

    await waitFor(() => {
      expect(api.post).toHaveBeenCalled();
    });
  });

  it('应该显示任务开始成功提示', async () => {
    (api.get as any).mockResolvedValue({
      data: { stats: mockStats, tasks: mockTasks, cottage: mockCottage },
    });

    (api.post as any).mockResolvedValue({
      data: { success: true },
    });

    render(
      <MemoryRouter>
        <GrowerDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      const startButton = screen.getByText('开始');
      fireEvent.click(startButton);
    });

    await waitFor(() => {
      expect(mockMessage.success).toHaveBeenCalled();
    });
  });

  it('应该处理任务开始失败', async () => {
    (api.get as any).mockResolvedValue({
      data: { stats: mockStats, tasks: mockTasks, cottage: mockCottage },
    });

    (api.post as any).mockRejectedValue({
      response: {
        data: { message: '无法开始任务' },
      },
    });

    render(
      <MemoryRouter>
        <GrowerDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      const startButton = screen.getByText('开始');
      fireEvent.click(startButton);
    });

    await waitFor(() => {
      expect(mockMessage.error).toHaveBeenCalled();
    });
  });
});

describe('Grower Dashboard - Empty States', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该显示无任务提示', async () => {
    (api.get as any).mockResolvedValue({
      data: { stats: { ...mockStats, totalTasks: 0 }, tasks: [], cottage: mockCottage },
    });

    render(
      <MemoryRouter>
        <GrowerDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/暂无任务|还没有任务/i)).toBeInTheDocument();
    });
  });

  it('应该显示引导提示', async () => {
    (api.get as any).mockResolvedValue({
      data: { stats: { ...mockStats, totalTasks: 0 }, tasks: [], cottage: mockCottage },
    });

    render(
      <MemoryRouter>
        <GrowerDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/联系引导者|等待分配/i)).toBeInTheDocument();
    });
  });
});
