/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import UserAvatar from '../UserAvatar';

describe('UserAvatar 组件测试', () => {
  it('应该渲染用户头像', () => {
    render(<UserAvatar user={{ nickname: '用户 A', avatarUrl: '/avatar.png' }} />);
    
    const avatar = screen.getByAltText('用户 A');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute('src', '/avatar.png');
  });

  it('应该显示用户昵称', () => {
    render(<UserAvatar user={{ nickname: '用户 A' }} showName={true} />);
    
    expect(screen.getByText('用户 A')).toBeInTheDocument();
  });

  it('应该支持默认头像', () => {
    render(<UserAvatar user={{ nickname: '用户 A' }} />);
    
    const avatar = screen.getByAltText('用户 A');
    expect(avatar).toBeInTheDocument();
  });

  it('应该支持自定义尺寸', () => {
    const { container } = render(
      <UserAvatar user={{ nickname: '用户 A' }} size="large" />
    );
    
    expect(container.querySelector('.avatar-large')).toBeInTheDocument();
  });

  it('应该支持在线状态', () => {
    const { container } = render(
      <UserAvatar user={{ nickname: '用户 A' }} online={true} />
    );
    
    expect(container.querySelector('.avatar-online')).toBeInTheDocument();
  });

  it('应该支持点击事件', () => {
    const handleClick = vi.fn();
    render(
      <UserAvatar 
        user={{ nickname: '用户 A' }} 
        onClick={handleClick}
      />
    );
    
    fireEvent.click(screen.getByAltText('用户 A'));
    expect(handleClick).toHaveBeenCalled();
  });
});
