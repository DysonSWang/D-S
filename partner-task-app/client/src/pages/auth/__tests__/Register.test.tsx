/**
 * Register Component Tests
 * 注册页面组件测试
 * 
 * 测试范围:
 * - 表单渲染
 * - 表单验证
 * - 注册流程
 * - 错误提示
 * - 角色选择
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Register from '../pages/auth/Register';
import api from '../api/request';

// Mock dependencies
vi.mock('../api/request', () => ({
  default: {
    post: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
const mockMessage = {
  success: vi.fn(),
  error: vi.fn(),
};

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
    message: mockMessage,
  };
});

describe('Register Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该渲染注册表单', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText('用户名')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('邮箱')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('密码')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('确认密码')).toBeInTheDocument();
    expect(screen.getByText('注册')).toBeInTheDocument();
    expect(screen.getByText('已有账号？')).toBeInTheDocument();
  });

  it('应该显示标题和副标题', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    expect(screen.getByText('伙伴任务打卡系统')).toBeInTheDocument();
    expect(screen.getByText('创建新账号')).toBeInTheDocument();
  });

  it('应该显示角色选择', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    expect(screen.getByText('成长者')).toBeInTheDocument();
    expect(screen.getByText('引导者')).toBeInTheDocument();
  });

  it('应该验证必填字段', async () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    const submitButton = screen.getByText('注册');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('请输入用户名')).toBeInTheDocument();
      expect(screen.getByText('请输入邮箱')).toBeInTheDocument();
      expect(screen.getByText('请输入密码')).toBeInTheDocument();
    });
  });

  it('应该验证邮箱格式', async () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText('邮箱');
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.blur(emailInput);

    await waitFor(() => {
      expect(screen.getByText('请输入有效的邮箱地址')).toBeInTheDocument();
    });
  });

  it('应该接受有效邮箱格式', async () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText('邮箱');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.blur(emailInput);

    await waitFor(() => {
      expect(screen.queryByText('请输入有效的邮箱地址')).not.toBeInTheDocument();
    });
  });

  it('应该验证密码长度', async () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    const passwordInput = screen.getByPlaceholderText('密码');
    fireEvent.change(passwordInput, { target: { value: '123' } });
    fireEvent.blur(passwordInput);

    await waitFor(() => {
      expect(screen.getByText('密码至少 6 位')).toBeInTheDocument();
    });
  });

  it('应该验证密码一致性', async () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    const passwordInput = screen.getByPlaceholderText('密码');
    const confirmPasswordInput = screen.getByPlaceholderText('确认密码');

    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password456' } });
    fireEvent.blur(confirmPasswordInput);

    await waitFor(() => {
      expect(screen.getByText('两次输入的密码不一致')).toBeInTheDocument();
    });
  });

  it('应该接受一致的密码', async () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    const passwordInput = screen.getByPlaceholderText('密码');
    const confirmPasswordInput = screen.getByPlaceholderText('确认密码');

    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    fireEvent.blur(confirmPasswordInput);

    await waitFor(() => {
      expect(screen.queryByText('两次输入的密码不一致')).not.toBeInTheDocument();
    });
  });

  it('应该成功注册成长者账号', async () => {
    const mockResponse = {
      data: {
        user: {
          id: 1,
          username: 'testuser',
          role: 'GROWER',
        },
        token: 'test-token',
      },
    };
    (api.post as any).mockResolvedValue(mockResponse);

    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    const usernameInput = screen.getByPlaceholderText('用户名');
    const emailInput = screen.getByPlaceholderText('邮箱');
    const passwordInput = screen.getByPlaceholderText('密码');
    const confirmPasswordInput = screen.getByPlaceholderText('确认密码');
    const submitButton = screen.getByText('注册');

    await userEvent.type(usernameInput, 'testuser');
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.type(confirmPasswordInput, 'password123');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/auth/register', {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'GROWER',
      });
      expect(mockMessage.success).toHaveBeenCalledWith('注册成功！');
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('应该成功注册引导者账号', async () => {
    const mockResponse = {
      data: {
        user: {
          id: 1,
          username: 'testguide',
          role: 'GUIDE',
        },
        token: 'test-token',
      },
    };
    (api.post as any).mockResolvedValue(mockResponse);

    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    const usernameInput = screen.getByPlaceholderText('用户名');
    const emailInput = screen.getByPlaceholderText('邮箱');
    const passwordInput = screen.getByPlaceholderText('密码');
    const confirmPasswordInput = screen.getByPlaceholderText('确认密码');

    await userEvent.type(usernameInput, 'testguide');
    await userEvent.type(emailInput, 'guide@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.type(confirmPasswordInput, 'password123');

    // 选择引导者角色
    const guideOption = screen.getByText('引导者');
    fireEvent.click(guideOption);

    const submitButton = screen.getByText('注册');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/auth/register', expect.objectContaining({
        role: 'GUIDE',
      }));
    });
  });

  it('应该显示注册错误提示', async () => {
    const mockError = {
      response: {
        data: {
          message: '用户名已存在',
        },
      },
    };
    (api.post as any).mockRejectedValue(mockError);

    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    const usernameInput = screen.getByPlaceholderText('用户名');
    const emailInput = screen.getByPlaceholderText('邮箱');
    const passwordInput = screen.getByPlaceholderText('密码');
    const confirmPasswordInput = screen.getByPlaceholderText('确认密码');
    const submitButton = screen.getByText('注册');

    await userEvent.type(usernameInput, 'existinguser');
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.type(confirmPasswordInput, 'password123');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockMessage.error).toHaveBeenCalledWith('用户名已存在');
    });
  });

  it('应该跳转到登录页面', async () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    const loginButton = screen.getByText('立即登录');
    fireEvent.click(loginButton);

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('应该在加载时显示 Loading 状态', async () => {
    (api.post as any).mockImplementation(() => new Promise(() => {}));

    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    const usernameInput = screen.getByPlaceholderText('用户名');
    const emailInput = screen.getByPlaceholderText('邮箱');
    const passwordInput = screen.getByPlaceholderText('密码');
    const confirmPasswordInput = screen.getByPlaceholderText('确认密码');
    const submitButton = screen.getByText('注册');

    await userEvent.type(usernameInput, 'testuser');
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.type(confirmPasswordInput, 'password123');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toHaveAttribute('aria-busy', 'true');
    });
  });

  it('应该默认选择成长者角色', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    const growerOption = screen.getByText('成长者');
    expect(growerOption).toHaveClass('ant-radio-button-wrapper-checked');
  });
});

describe('Register Component - Accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该为输入框提供正确的 type', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText('邮箱');
    expect(emailInput).toHaveAttribute('type', 'email');

    const passwordInput = screen.getByPlaceholderText('密码');
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('提交按钮应该是 button 类型', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    const submitButton = screen.getByText('注册');
    expect(submitButton).toHaveAttribute('type', 'submit');
  });
});
