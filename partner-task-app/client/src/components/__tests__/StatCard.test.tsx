/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StatCard from '../StatCard';

describe('StatCard 组件测试', () => {
  it('应该渲染统计卡片', () => {
    render(
      <StatCard
        title="用户总数"
        value={100}
        icon={<span>👥</span>}
      />
    );
    
    expect(screen.getByText('用户总数')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('👥')).toBeInTheDocument();
  });

  it('应该支持数字格式化', () => {
    render(
      <StatCard
        title="收入"
        value={1234.56}
        prefix="¥"
        decimals={2}
      />
    );
    
    expect(screen.getByText('¥1234.56')).toBeInTheDocument();
  });

  it('应该支持前缀符号', () => {
    render(
      <StatCard
        title="收入"
        value={100}
        prefix="¥"
      />
    );
    
    expect(screen.getByText('¥100')).toBeInTheDocument();
  });

  it('应该支持后缀符号', () => {
    render(
      <StatCard
        title="增长率"
        value={25}
        suffix="%"
      />
    );
    
    expect(screen.getByText('25%')).toBeInTheDocument();
  });

  it('应该支持变化趋势', () => {
    render(
      <StatCard
        title="用户数"
        value={100}
        trend="up"
        trendValue={10}
      />
    );
    
    expect(screen.getByText('+10')).toBeInTheDocument();
  });

  it('应该支持加载状态', () => {
    render(
      <StatCard
        title="用户数"
        value={0}
        loading={true}
      />
    );
    
    expect(screen.getByText('用户数')).toBeInTheDocument();
  });
});
