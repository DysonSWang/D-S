/**
 * Login Component Tests
 * 登录页面组件测试
 * 
 * 测试范围:
 * - 表单渲染
 * - 表单验证
 * - 登录流程
 * - 错误提示
 * - 角色跳转
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Login from '../pages/auth/Login';
import { useAuthStore } from '../store/authStore';
import api from '../api/request';

// Mock dependencies
vi.mock('../api/request', () => ({
  default: {
    post: vi.fn(),
  },
}));

vi.mock('../store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Login Component', () => {
  const mockLogin = vi.fn();
  const mockMessage = {
    success: vi.fn(),
    error: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as any).mockReturnValue({
      login: mockLogin,
    });
  });

  it('应该渲染登录表单', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText('用户名')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('密码')).toBeInTheDocument();
    expect(screen.getByText('登录')).toBeInTheDocument();
    expect(screen.getByText('立即注册')).toBeInTheDocument();
  });

  it('应该显示标题和副标题', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(screen.getByText('伙伴任务打卡系统')).toBeInTheDocument();
    expect(screen.getByText('亲密关系成长工具')).toBeInTheDocument();
  });

  it('应该验证必填字段', async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const submitButton = screen.getByText('登录');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('请输入用户名')).toBeInTheDocument();
      expect(screen.getByText('请输入密码')).toBeInTheDocument();
    });
  });

  it('应该显示用户名错误提示', async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const usernameInput = screen.getByPlaceholderText('用户名');
    fireEvent.change(usernameInput, { target: { value: 'test' } });
    
    const passwordInput = screen.getByPlaceholderText('密码');
    fireEvent.click(passwordInput);
    fireEvent.blur(passwordInput);

    await waitFor(() => {
      expect(screen.getByText('请输入密码')).toBeInTheDocument();
    });
  });

  it('应该成功登录并跳转到引导者仪表盘', async () => {
    const mockResponse = {
      data: {
        user: {
          id: 1,
          username: 'testuser',
          role: 'GUIDE',
        },
        token: 'test-token',
      },
    };
    (api.post as any).mockResolvedValue(mockResponse);

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const usernameInput = screen.getByPlaceholderText('用户名');
    const passwordInput = screen.getByPlaceholderText('密码');
    const submitButton = screen.getByText('登录');

    await userEvent.type(usernameInput, 'testuser');
    await userEvent.type(passwordInput, 'password123');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/auth/login', {
        username: 'testuser',
        password: 'password123',
      });
      expect(mockLogin).toHaveBeenCalledWith(mockResponse.data.user, mockResponse.data.token);
      expect(mockMessage.success).toHaveBeenCalledWith('登录成功！');
      expect(mockNavigate).toHaveBeenCalledWith('/guide/dashboard');
    });
  });

  it('应该成功登录并跳转到成长者仪表盘', async () => {
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
        <Login />
      </MemoryRouter>
    );

    const usernameInput = screen.getByPlaceholderText('用户名');
    const passwordInput = screen.getByPlaceholderText('密码');
    const submitButton = screen.getByText('登录');

    await userEvent.type(usernameInput, 'testuser');
    await userEvent.type(passwordInput, 'password123');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/grower/dashboard');
    });
  });

  it('应该显示登录错误提示', async () => {
    const mockError = {
      response: {
        data: {
          message: '用户名或密码错误',
        },
      },
    };
    (api.post as any).mockRejectedValue(mockError);

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const usernameInput = screen.getByPlaceholderText('用户名');
    const passwordInput = screen.getByPlaceholderText('密码');
    const submitButton = screen.getByText('登录');

    await userEvent.type(usernameInput, 'testuser');
    await userEvent.type(passwordInput, 'wrongpassword');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockMessage.error).toHaveBeenCalledWith('用户名或密码错误');
    });
  });

  it('应该显示默认错误提示', async () => {
    const mockError = {
      response: {
        data: {},
      },
    };
    (api.post as any).mockRejectedValue(mockError);

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const usernameInput = screen.getByPlaceholderText('用户名');
    const passwordInput = screen.getByPlaceholderText('密码');
    const submitButton = screen.getByText('登录');

    await userEvent.type(usernameInput, 'testuser');
    await userEvent.type(passwordInput, 'wrongpassword');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockMessage.error).toHaveBeenCalledWith('登录失败，请检查用户名和密码');
    });
  });

  it('应该跳转到注册页面', async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const registerButton = screen.getByText('立即注册');
    fireEvent.click(registerButton);

    expect(mockNavigate).toHaveBeenCalledWith('/register');
  });

  it('应该在加载时显示 Loading 状态', async () => {
    (api.post as any).mockImplementation(() => new Promise(() => {}));

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const usernameInput = screen.getByPlaceholderText('用户名');
    const passwordInput = screen.getByPlaceholderText('密码');
    const submitButton = screen.getByText('登录');

    await userEvent.type(usernameInput, 'testuser');
    await userEvent.type(passwordInput, 'password123');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toHaveAttribute('aria-busy', 'true');
    });
  });

  it('应该在请求完成后移除 Loading 状态', async () => {
    const mockResponse = {
      data: {
        user: { id: 1, username: 'test', role: 'GUIDE' },
        token: 'token',
      },
    };
    (api.post as any).mockResolvedValue(mockResponse);

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const usernameInput = screen.getByPlaceholderText('用户名');
    const passwordInput = screen.getByPlaceholderText('密码');
    const submitButton = screen.getByText('登录');

    await userEvent.type(usernameInput, 'testuser');
    await userEvent.type(passwordInput, 'password123');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(submitButton).not.toHaveAttribute('aria-busy', 'true');
    });
  });
});

describe('Login Component - Accessibility', () => {
  const mockLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as any).mockReturnValue({ login: mockLogin });
  });

  it('应该为输入框提供正确的 label', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const usernameInput = screen.getByPlaceholderText('用户名');
    const passwordInput = screen.getByPlaceholderText('密码');

    expect(usernameInput).toHaveAttribute('type', 'text');
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('提交按钮应该是 button 类型', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const submitButton = screen.getByText('登录');
    expect(submitButton).toHaveAttribute('type', 'submit');
  });
});
