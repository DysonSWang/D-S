/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TaskCard from '../TaskCard';

const mockTask = {
  id: 1,
  name: '每日打卡',
  description: '完成任务描述',
  status: 'PENDING',
  createdAt: '2026-03-14T00:00:00Z',
  grower: {
    id: 1,
    nickname: '成长者 A',
    avatarUrl: '/avatar.png'
  }
};

describe('TaskCard 组件测试', () => {
  it('应该渲染任务卡片', () => {
    render(<TaskCard task={mockTask} />);
    
    expect(screen.getByText('每日打卡')).toBeInTheDocument();
    expect(screen.getByText('成长者 A')).toBeInTheDocument();
    expect(screen.getByText('待开始')).toBeInTheDocument();
  });

  it('应该显示任务状态标签', () => {
    render(<TaskCard task={mockTask} />);
    
    const statusTag = screen.getByText('待开始');
    expect(statusTag).toBeInTheDocument();
  });

  it('应该显示创建时间', () => {
    render(<TaskCard task={mockTask} />);
    
    expect(screen.getByText('2026-03-14')).toBeInTheDocument();
  });

  it('应该响应点击事件', () => {
    const handleClick = vi.fn();
    render(<TaskCard task={mockTask} onClick={handleClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });

  it('应该显示成长者头像', () => {
    render(<TaskCard task={mockTask} />);
    
    const avatar = screen.getByAltText('成长者 A');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute('src', '/avatar.png');
  });

  it('应该支持不同状态显示', () => {
    const statuses = [
      { status: 'PENDING', text: '待开始' },
      { status: 'IN_PROGRESS', text: '进行中' },
      { status: 'PENDING_REVIEW', text: '待审核' },
      { status: 'COMPLETED', text: '已完成' }
    ];

    statuses.forEach(({ status, text }) => {
      const { unmount } = render(<TaskCard task={{ ...mockTask, status }} />);
      expect(screen.getByText(text)).toBeInTheDocument();
      unmount();
    });
  });
});
