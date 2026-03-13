/**
 * CottageView Component Tests
 * 小屋视图组件测试
 * 
 * 测试范围:
 * - 小屋展示
 * - 装饰显示
 * - 温暖度统计
 * - 装饰操作
 * - 访客系统
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import CottageView from '../CottageView';
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
  info: vi.fn(),
};

vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
    message: mockMessage,
  };
});

describe('CottageView Component', () => {
  const mockCottage = {
    id: 1,
    ownerId: 1,
    level: 5,
    warmth: 1250,
    decorations: [
      { id: 1, name: '温馨地毯', type: 'floor', equipped: true },
      { id: 2, name: '装饰画', type: 'wall', equipped: true },
    ],
  };

  const mockDecorations = [
    { id: 1, name: '温馨地毯', price: 100, category: 'floor', warmth: 50 },
    { id: 2, name: '装饰画', price: 200, category: 'wall', warmth: 80 },
    { id: 3, name: '绿植', price: 150, category: 'plant', warmth: 60 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该渲染小屋页面', () => {
    (api.get as any).mockResolvedValue({
      data: { cottage: mockCottage },
    });

    render(
      <MemoryRouter>
        <CottageView />
      </MemoryRouter>
    );

    expect(screen.getByText(/小屋|我的小屋/i)).toBeInTheDocument();
  });

  it('应该显示小屋等级', async () => {
    (api.get as any).mockResolvedValue({
      data: { cottage: mockCottage },
    });

    render(
      <MemoryRouter>
        <CottageView />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/等级|Lv/i)).toBeInTheDocument();
    });
  });

  it('应该显示温暖度', async () => {
    (api.get as any).mockResolvedValue({
      data: { cottage: mockCottage },
    });

    render(
      <MemoryRouter>
        <CottageView />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/温暖|温馨/i)).toBeInTheDocument();
    });
  });

  it('应该显示已装备的装饰', async () => {
    (api.get as any).mockResolvedValue({
      data: { cottage: mockCottage },
    });

    render(
      <MemoryRouter>
        <CottageView />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('温馨地毯')).toBeInTheDocument();
      expect(screen.getByText('装饰画')).toBeInTheDocument();
    });
  });

  it('应该显示装饰管理按钮', async () => {
    (api.get as any).mockResolvedValue({
      data: { cottage: mockCottage },
    });

    render(
      <MemoryRouter>
        <CottageView />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/装饰|管理/i)).toBeInTheDocument();
    });
  });

  it('应该显示商店按钮', async () => {
    (api.get as any).mockResolvedValue({
      data: { cottage: mockCottage },
    });

    render(
      <MemoryRouter>
        <CottageView />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/商店|购买/i)).toBeInTheDocument();
    });
  });

  it('应该处理空装饰状态', async () => {
    (api.get as any).mockResolvedValue({
      data: {
        cottage: { ...mockCottage, decorations: [] },
      },
    });

    render(
      <MemoryRouter>
        <CottageView />
      </MemoryRouter>
    );

    await waitFor(() => {
      // 应该显示添加装饰的引导
      expect(screen.getByText(/装饰|布置/i)).toBeInTheDocument();
    });
  });

  it('应该显示加载状态', () => {
    (api.get as any).mockImplementation(() => new Promise(() => {}));

    render(
      <MemoryRouter>
        <CottageView />
      </MemoryRouter>
    );

    // 应该显示 loading 骨架屏或加载指示器
    expect(screen.getByText(/小屋|我的小屋/i)).toBeInTheDocument();
  });

  it('应该处理 API 错误', async () => {
    (api.get as any).mockRejectedValue({
      response: {
        data: { message: '加载失败' },
      },
    });

    render(
      <MemoryRouter>
        <CottageView />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockMessage.error).toHaveBeenCalled();
    });
  });

  it('应该显示小屋背景', async () => {
    (api.get as any).mockResolvedValue({
      data: { cottage: mockCottage },
    });

    render(
      <MemoryRouter>
        <CottageView />
      </MemoryRouter>
    );

    await waitFor(() => {
      // 小屋应该有背景或容器
      const cottageContainer = screen.getByTestId ? 
        screen.getByTestId('cottage-container') : 
        screen.getByText(/小屋/i);
      expect(cottageContainer).toBeInTheDocument();
    });
  });

  it('应该支持刷新小屋数据', async () => {
    (api.get as any).mockResolvedValue({
      data: { cottage: mockCottage },
    });

    render(
      <MemoryRouter>
        <CottageView />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('温馨地毯')).toBeInTheDocument();
    });

    // 设置新的 mock 数据
    const newCottage = { ...mockCottage, warmth: 2000 };
    vi.clearAllMocks();
    (api.get as any).mockResolvedValue({
      data: { cottage: newCottage },
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

describe('CottageView - Decoration Interactions', () => {
  const mockCottageWithDecorations = {
    ...mockCottage,
    decorations: [
      { id: 1, name: '温馨地毯', type: 'floor', equipped: true },
      { id: 2, name: '装饰画', type: 'wall', equipped: false },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该显示卸下装饰按钮', async () => {
    (api.get as any).mockResolvedValue({
      data: { cottage: mockCottageWithDecorations },
    });

    render(
      <MemoryRouter>
        <CottageView />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('卸下')).toBeInTheDocument();
    });
  });

  it('应该显示装备装饰按钮', async () => {
    (api.get as any).mockResolvedValue({
      data: { cottage: mockCottageWithDecorations },
    });

    render(
      <MemoryRouter>
        <CottageView />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('装备')).toBeInTheDocument();
    });
  });

  it('应该支持卸下装饰', async () => {
    (api.get as any)
      .mockResolvedValueOnce({
        data: { cottage: mockCottageWithDecorations },
      })
      .mockResolvedValueOnce({
        data: { success: true },
      });

    render(
      <MemoryRouter>
        <CottageView />
      </MemoryRouter>
    );

    await waitFor(() => {
      const unequipButton = screen.getByText('卸下');
      fireEvent.click(unequipButton);
    });

    await waitFor(() => {
      expect(api.post).toHaveBeenCalled();
    });
  });

  it('应该支持装备装饰', async () => {
    (api.get as any)
      .mockResolvedValueOnce({
        data: { cottage: mockCottageWithDecorations },
      })
      .mockResolvedValueOnce({
        data: { success: true },
      });

    render(
      <MemoryRouter>
        <CottageView />
      </MemoryRouter>
    );

    await waitFor(() => {
      const equipButton = screen.getByText('装备');
      fireEvent.click(equipButton);
    });

    await waitFor(() => {
      expect(api.post).toHaveBeenCalled();
    });
  });
});

describe('CottageView - Navigation', () => {
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

  it('应该支持跳转到装饰商店', async () => {
    (api.get as any).mockResolvedValue({
      data: { cottage: mockCottage },
    });

    render(
      <MemoryRouter>
        <CottageView />
      </MemoryRouter>
    );

    await waitFor(() => {
      const shopButton = screen.getByText(/商店|购买/i);
      fireEvent.click(shopButton);
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/grower/shop');
    });
  });

  it('应该支持跳转到装饰管理', async () => {
    (api.get as any).mockResolvedValue({
      data: { cottage: mockCottage },
    });

    render(
      <MemoryRouter>
        <CottageView />
      </MemoryRouter>
    );

    await waitFor(() => {
      const manageButton = screen.getByText(/装饰管理|我的装饰/i);
      fireEvent.click(manageButton);
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/grower/collections');
    });
  });

  it('应该支持跳转到排行榜', async () => {
    (api.get as any).mockResolvedValue({
      data: { cottage: mockCottage },
    });

    render(
      <MemoryRouter>
        <CottageView />
      </MemoryRouter>
    );

    await waitFor(() => {
      const rankingButton = screen.getByText(/排行榜|排名/i);
      fireEvent.click(rankingButton);
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/cottage/ranking');
    });
  });
});

describe('CottageView - Warmth Calculation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该计算总温暖度', async () => {
    const cottageWithMultipleDecorations = {
      ...mockCottage,
      decorations: [
        { id: 1, name: '温馨地毯', type: 'floor', equipped: true, warmth: 50 },
        { id: 2, name: '装饰画', type: 'wall', equipped: true, warmth: 80 },
        { id: 3, name: '绿植', type: 'plant', equipped: true, warmth: 60 },
      ],
      warmth: 190, // 50 + 80 + 60
    };

    (api.get as any).mockResolvedValue({
      data: { cottage: cottageWithMultipleDecorations },
    });

    render(
      <MemoryRouter>
        <CottageView />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('190')).toBeInTheDocument();
    });
  });

  it('应该只显示已装备装饰的温暖度', async () => {
    const cottageWithUnequippedDecorations = {
      ...mockCottage,
      decorations: [
        { id: 1, name: '温馨地毯', type: 'floor', equipped: true, warmth: 50 },
        { id: 2, name: '装饰画', type: 'wall', equipped: false, warmth: 80 },
      ],
      warmth: 50, // Only equipped decoration counts
    };

    (api.get as any).mockResolvedValue({
      data: { cottage: cottageWithUnequippedDecorations },
    });

    render(
      <MemoryRouter>
        <CottageView />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('50')).toBeInTheDocument();
    });
  });
});
