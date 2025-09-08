import React from 'react';
import { Meta } from '@storybook/react';
import NetworkQuality from './NetworkQuality';

export default {
  title: 'pure component/NetworkQuality',
  component: NetworkQuality,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    level: {
      control: 'select',
      options: [1, 2, 3, 4, 5, 6],
      description: '网络质量等级',
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: '组件大小',
    },
  },
} as Meta<typeof NetworkQuality>;

// 基本使用
export const Default = {
  args: {
    level: 3,
    size: 'medium',
  },
};

// 不同等级
export const DifferentLevels = {
  render: () => (
    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <NetworkQuality level={6} />
        <div style={{ marginTop: '8px', fontSize: '12px' }}>信号弱</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <NetworkQuality level={3} />
        <div style={{ marginTop: '8px', fontSize: '12px' }}>信号中等</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <NetworkQuality level={1} />
        <div style={{ marginTop: '8px', fontSize: '12px' }}>信号强</div>
      </div>
    </div>
  ),
};

// 不同尺寸
export const DifferentSizes = {
  render: () => (
    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <NetworkQuality level={3} size="small" />
        <div style={{ marginTop: '8px', fontSize: '12px' }}>小号</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <NetworkQuality level={3} size="medium" />
        <div style={{ marginTop: '8px', fontSize: '12px' }}>中号</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <NetworkQuality level={3} size="large" />
        <div style={{ marginTop: '8px', fontSize: '12px' }}>大号</div>
      </div>
    </div>
  ),
};

// 1格红色
export const WeakSignal = {
  args: {
    level: 1,
    size: 'medium',
  },
};

// 2格橙色
export const MediumSignal = {
  args: {
    level: 3,
    size: 'medium',
  },
};

// 3格绿色
export const StrongSignal = {
  args: {
    level: 6,
    size: 'medium',
  },
};
