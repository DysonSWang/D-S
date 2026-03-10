/**
 * 移动端响应式优化配置
 * 添加全局响应式样式和断点
 */

// 响应式断点
export const breakpoints = {
  xs: 0,      // 超小屏（手机）
  sm: 576,    // 小屏（大屏手机）
  md: 768,    // 中屏（平板）
  lg: 992,    // 大屏（小电脑）
  xl: 1200,   // 超大屏（电脑）
  xxl: 1600,  // 超大屏（大电脑）
};

// 通用响应式样式
export const mobileResponsiveStyles = {
  // 移动端容器
  mobileContainer: {
    padding: '12px',
    '@media (min-width: 768px)': {
      padding: '24px',
    },
  },

  // 移动端卡片
  mobileCard: {
    margin: '8px',
    borderRadius: '8px',
    '@media (min-width: 768px)': {
      margin: '16px',
      borderRadius: '12px',
    },
  },

  // 移动端按钮
  mobileButton: {
    size: 'middle',
    style: {
      borderRadius: '6px',
      padding: '8px 16px',
    },
  },

  // 移动端导航
  mobileNav: {
    mode: 'inline' as const,
    collapsed: false,
    breakpoint: 'md',
  },

  // 移动端栅格
  mobileGrid: {
    xs: 24,
    sm: 12,
    md: 8,
    lg: 6,
    xl: 4,
  },
};

// 媒体查询 Hook（供组件使用）
export function useBreakpoint() {
  // 实际项目中应该使用 Ant Design 的 Grid.useBreakpoint()
  // 这里简化处理
  return {
    xs: true,
    sm: typeof window !== 'undefined' ? window.innerWidth >= breakpoints.sm : false,
    md: typeof window !== 'undefined' ? window.innerWidth >= breakpoints.md : false,
    lg: typeof window !== 'undefined' ? window.innerWidth >= breakpoints.lg : false,
    xl: typeof window !== 'undefined' ? window.innerWidth >= breakpoints.xl : false,
  };
}

export default {
  breakpoints,
  mobileResponsiveStyles,
  useBreakpoint,
};
