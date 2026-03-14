/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DeleteConfirmDialog from '../DeleteConfirmDialog';

describe('DeleteConfirmDialog 组件测试', () => {
  it('应该渲染删除确认对话框', () => {
    render(
      <DeleteConfirmDialog
        open={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="确认删除"
      />
    );
    
    expect(screen.getByText('确认删除')).toBeInTheDocument();
    expect(screen.getByText('取消')).toBeInTheDocument();
    expect(screen.getByText('删除')).toBeInTheDocument();
  });

  it('应该支持自定义标题', () => {
    render(
      <DeleteConfirmDialog
        open={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="确定要删除吗？"
      />
    );
    
    expect(screen.getByText('确定要删除吗？')).toBeInTheDocument();
  });

  it('应该支持自定义描述', () => {
    render(
      <DeleteConfirmDialog
        open={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        description="此操作不可撤销"
      />
    );
    
    expect(screen.getByText('此操作不可撤销')).toBeInTheDocument();
  });

  it('应该响应取消按钮点击', () => {
    const handleClose = vi.fn();
    render(
      <DeleteConfirmDialog
        open={true}
        onClose={handleClose}
        onConfirm={vi.fn()}
        title="确认删除"
      />
    );
    
    fireEvent.click(screen.getByText('取消'));
    expect(handleClose).toHaveBeenCalled();
  });

  it('应该响应确认按钮点击', () => {
    const handleConfirm = vi.fn();
    render(
      <DeleteConfirmDialog
        open={true}
        onClose={vi.fn()}
        onConfirm={handleConfirm}
        title="确认删除"
      />
    );
    
    fireEvent.click(screen.getByText('删除'));
    expect(handleConfirm).toHaveBeenCalled();
  });

  it('应该支持加载状态', () => {
    render(
      <DeleteConfirmDialog
        open={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="确认删除"
        loading={true}
      />
    );
    
    expect(screen.getByText('删除')).toBeDisabled();
  });
});
