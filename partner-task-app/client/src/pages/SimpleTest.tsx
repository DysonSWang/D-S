import React from 'react';

const SimpleTest = () => {
  return (
    <div style={{ padding: '40px', fontFamily: 'Arial' }}>
      <h1 style={{ color: 'blue' }}>✅ 最简 React 测试</h1>
      <p style={{ fontSize: '18px' }}>如果看到这个，说明 React 正常</p>
      <p style={{ color: 'red' }}>如果看不到，是 React 渲染问题</p>
    </div>
  );
};

export default SimpleTest;
