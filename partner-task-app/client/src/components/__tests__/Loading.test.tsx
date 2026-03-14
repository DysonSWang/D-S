/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import Loading from '../Loading';

describe('Loading 组件测试', () => {
  it('应该渲染加载文字', () => {
    render(<Loading />);
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('应该渲染加载动画', () => {
    const { container } = render(<Loading />);
    expect(container.querySelector('.loading-spinner')).toBeInTheDocument();
  });

  it('应该支持自定义文字', () => {
    render(<Loading text="正在处理..." />);
    expect(screen.getByText('正在处理...')).toBeInTheDocument();
  });

  it('应该支持全屏模式', () => {
    const { container } = render(<Loading fullscreen />);
    expect(container.querySelector('.loading-fullscreen')).toBeInTheDocument();
  });

  it('应该支持自定义尺寸', () => {
    const { container } = render(<Loading size="large" />);
    expect(container.querySelector('.loading-large')).toBeInTheDocument();
  });
});
