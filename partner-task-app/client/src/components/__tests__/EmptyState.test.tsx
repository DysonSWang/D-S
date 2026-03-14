/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import EmptyState from '../EmptyState';

describe('EmptyState 组件测试', () => {
  it('应该渲染空状态', () => {
    render(<EmptyState />);
    
    expect(screen.getByText('暂无数据')).toBeInTheDocument();
  });

  it('应该支持自定义标题', () => {
    render(<EmptyState title="暂无任务" />);
    
    expect(screen.getByText('暂无任务')).toBeInTheDocument();
  });

  it('应该支持自定义描述', () => {
    render(<EmptyState description="还没有任何数据" />);
    
    expect(screen.getByText('还没有任何数据')).toBeInTheDocument();
  });

  it('应该支持自定义图标', () => {
    render(<EmptyState icon="📝" />);
    
    expect(screen.getByText('📝')).toBeInTheDocument();
  });

  it('应该支持操作按钮', () => {
    render(<EmptyState actionText="去创建" onAction={() => {}} />);
    
    expect(screen.getByText('去创建')).toBeInTheDocument();
  });

  it('应该响应按钮点击', () => {
    const handleClick = vi.fn();
    render(<EmptyState actionText="去创建" onAction={handleClick} />);
    
    fireEvent.click(screen.getByText('去创建'));
    expect(handleClick).toHaveBeenCalled();
  });
});
