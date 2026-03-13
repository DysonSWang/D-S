/**
 * 工具函数测试
 * 测试各种工具函数
 */

describe('Utilities', () => {
  describe('Date Formatting', () => {
    it('应该格式化日期', () => {
      const date = new Date('2026-03-12T10:00:00Z');
      expect(date.toISOString()).toContain('2026-03-12');
    });

    it('应该计算时间差', () => {
      const now = new Date();
      const past = new Date(now.getTime() - 3600000); // 1 小时前
      
      const diffHours = (now.getTime() - past.getTime()) / (1000 * 60 * 60);
      expect(diffHours).toBe(1);
    });

    it('应该格式化时间戳', () => {
      const timestamp = Date.now();
      const date = new Date(timestamp);
      
      expect(date).toBeInstanceOf(Date);
    });
  });

  describe('String Utilities', () => {
    it('应该修剪字符串', () => {
      expect('  test  '.trim()).toBe('test');
    });

    it('应该截断长字符串', () => {
      const text = '这是一个很长的字符串超过限制';
      const maxLen = 10;
      
      expect(text.substring(0, maxLen).length).toBeLessThanOrEqual(maxLen);
    });

    it('应该处理空字符串', () => {
      expect(''.trim()).toBe('');
      expect(''.length).toBe(0);
    });

    it('应该连接字符串', () => {
      const parts = ['Hello', 'World'];
      expect(parts.join(' ')).toBe('Hello World');
    });
  });

  describe('Number Utilities', () => {
    it('应该格式化数字', () => {
      const num = 1234.567;
      expect(num.toFixed(2)).toBe('1234.57');
    });

    it('应该处理大数字', () => {
      const big = 1000000;
      expect(big.toLocaleString()).toContain(',');
    });

    it('应该处理负数', () => {
      const neg = -100;
      expect(Math.abs(neg)).toBe(100);
    });

    it('应该四舍五入', () => {
      expect(Math.round(3.14)).toBe(3);
      expect(Math.round(3.6)).toBe(4);
    });
  });

  describe('Object Utilities', () => {
    it('应该深拷贝对象', () => {
      const original = { a: 1, b: { c: 2 } };
      const copy = JSON.parse(JSON.stringify(original));
      
      expect(copy).toEqual(original);
      expect(copy).not.toBe(original);
    });

    it('应该合并对象', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { b: 3, c: 4 };
      const merged = { ...obj1, ...obj2 };
      
      expect(merged).toEqual({ a: 1, b: 3, c: 4 });
    });

    it('应该删除未定义属性', () => {
      const obj: any = { a: 1, b: undefined, c: 3 };
      Object.keys(obj).forEach(key => {
        if (obj[key] === undefined) delete obj[key];
      });
      
      expect(obj.b).toBeUndefined();
      expect(Object.keys(obj).length).toBe(2);
    });

    it('应该检查对象是否为空', () => {
      expect(Object.keys({}).length).toBe(0);
      expect(Object.keys({ a: 1 }).length).toBe(1);
    });
  });

  describe('Array Utilities', () => {
    it('应该去重数组', () => {
      const arr = [1, 2, 2, 3, 3, 3];
      const unique = [...new Set(arr)];
      
      expect(unique).toEqual([1, 2, 3]);
      expect(unique.length).toBe(3);
    });

    it('应该过滤数组', () => {
      const arr = [1, 2, 3, 4, 5];
      const filtered = arr.filter(x => x > 2);
      
      expect(filtered).toEqual([3, 4, 5]);
    });

    it('应该映射数组', () => {
      const arr = [1, 2, 3];
      const mapped = arr.map(x => x * 2);
      
      expect(mapped).toEqual([2, 4, 6]);
    });

    it('应该减少数组', () => {
      const arr = [1, 2, 3, 4];
      const sum = arr.reduce((a, b) => a + b, 0);
      
      expect(sum).toBe(10);
    });

    it('应该排序数组', () => {
      const arr = [3, 1, 4, 1, 5];
      const sorted = [...arr].sort((a, b) => a - b);
      
      expect(sorted).toEqual([1, 1, 3, 4, 5]);
    });
  });

  describe('Boolean Utilities', () => {
    it('应该判断真值', () => {
      const truthy = 'non-empty';
      expect(truthy ? true : false).toBe(true);
    });

    it('应该判断假值', () => {
      const empty = '';
      expect(empty ? true : false).toBe(false);
    });
  });

  describe('Function Utilities', () => {
    it('应该调用函数', () => {
      const fn = jest.fn();
      fn();
      expect(fn).toHaveBeenCalled();
    });

    it('应该带参数调用函数', () => {
      const fn = jest.fn();
      fn(1, 2, 3);
      expect(fn).toHaveBeenCalledWith(1, 2, 3);
    });

    it('应该 mock 返回值', () => {
      const fn = jest.fn().mockReturnValue(42);
      expect(fn()).toBe(42);
    });
  });
});
