import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Button from '../button';
import { useNotification } from './index';
import Icon from '../icon';

const meta: Meta = {
  title: 'pure component/Notification',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '全局展示通知提醒信息。参考 Ant Design 实现的简单版本，支持 hooks 调用、动画效果和基本功能。',
      },
    },
  },
};

export default meta;

// 基础使用示例
export const Basic: StoryObj = {
  render: () => {
    const [api, contextHolder] = useNotification();

    const openNotification = () => {
      api.open({
        message: '通知标题',
        description: '这是通知的详细内容。可以是很长的文字，用来向用户展示更多信息。',
      });
    };

    return (
      <>
        {contextHolder}
        <Button type="primary" onClick={openNotification}>
          打开通知
        </Button>
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story: '最基础的用法，通过 useNotification hook 创建通知实例。',
      },
    },
  },
};

// 不同类型的通知
export const Types: StoryObj = {
  render: () => {
    const [api, contextHolder] = useNotification();

    const openSuccess = () => {
      api.success({
        message: '成功通知',
        description: '这是一条成功的通知信息！',
      });
    };

    const openInfo = () => {
      api.info({
        message: '信息通知',
        description: '这是一条普通的信息通知。',
      });
    };

    const openWarning = () => {
      api.warning({
        message: '警告通知',
        description: '这是一条警告信息，请注意！',
      });
    };

    const openError = () => {
      api.error({
        message: '错误通知',
        description: '这是一条错误信息，请及时处理。',
      });
    };

    return (
      <>
        {contextHolder}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button onClick={openSuccess}>成功</Button>
          <Button onClick={openInfo}>信息</Button>
          <Button onClick={openWarning}>警告</Button>
          <Button onClick={openError}>错误</Button>
        </div>
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          '支持四种不同类型的通知：success、info、warning、error，每种类型都有对应的图标和颜色。',
      },
    },
  },
};

// 自定义关闭时间
export const Duration: StoryObj = {
  render: () => {
    const [api, contextHolder] = useNotification();

    const openNotification = (duration: number, title: string) => {
      api.info({
        message: title,
        description: `这条通知将在 ${duration === 0 ? '手动关闭' : duration + '秒后自动关闭'}`,
        duration,
      });
    };

    return (
      <>
        {contextHolder}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button onClick={() => openNotification(1, '1秒后关闭')}>1秒</Button>
          <Button onClick={() => openNotification(3, '3秒后关闭')}>3秒</Button>
          <Button onClick={() => openNotification(10, '10秒后关闭')}>10秒</Button>
          <Button onClick={() => openNotification(0, '不自动关闭')}>不自动关闭</Button>
        </div>
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story: '可以自定义通知的自动关闭时间，设置为 0 时不会自动关闭。',
      },
    },
  },
};

// 不同位置
export const Placement: StoryObj = {
  render: () => {
    const positions = [
      { placement: 'topLeft', label: '左上角' },
      { placement: 'top', label: '顶部' },
      { placement: 'topRight', label: '右上角' },
      { placement: 'bottomLeft', label: '左下角' },
      { placement: 'bottom', label: '底部' },
      { placement: 'bottomRight', label: '右下角' },
    ] as const;

    return (
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {positions.map(({ placement, label }) => {
          const NotificationButton = () => {
            const [api, contextHolder] = useNotification({ placement });

            const openNotification = () => {
              api.info({
                message: `${label}通知`,
                description: `这是一条来自${label}的通知信息。`,
              });
            };

            return (
              <>
                {contextHolder}
                <Button onClick={openNotification}>{label}</Button>
              </>
            );
          };

          return <NotificationButton key={placement} />;
        })}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          '支持在屏幕的六个位置显示通知：topLeft、top、topRight、bottomLeft、bottom、bottomRight。',
      },
    },
  },
};

// 自定义图标和内容
export const Custom: StoryObj = {
  render: () => {
    const [api, contextHolder] = useNotification();

    const openCustom = () => {
      api.open({
        message: '自定义通知',
        description: (
          <div>
            <p>这是一条自定义内容的通知。</p>
            <p>
              可以包含 <strong>富文本</strong> 和 <em>其他元素</em>。
            </p>
          </div>
        ),
        icon: <Icon type="STAR" color="#faad14" />,
        onClick: () => {
          console.log('通知被点击了！');
        },
      });
    };

    const openWithoutClose = () => {
      api.open({
        message: '无关闭按钮',
        description: '这条通知没有关闭按钮，只能等待自动关闭。',
        closable: false,
        duration: 3,
      });
    };

    return (
      <>
        {contextHolder}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button onClick={openCustom}>自定义图标</Button>
          <Button onClick={openWithoutClose}>无关闭按钮</Button>
        </div>
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story: '支持自定义图标、内容、点击事件等，可以隐藏关闭按钮。',
      },
    },
  },
};

// 更新和销毁
export const UpdateAndDestroy: StoryObj = {
  render: () => {
    const [api, contextHolder] = useNotification();

    const openUpdatable = () => {
      api.open({
        key: 'updatable',
        message: '可更新的通知',
        description: '这条通知可以被更新内容。',
      });
    };

    const updateNotification = () => {
      api.open({
        key: 'updatable',
        message: '已更新的通知',
        description: '通知内容已经更新！',
        type: 'success',
      });
    };

    const destroySpecific = () => {
      api.destroy('updatable');
    };

    const destroyAll = () => {
      api.destroyAll();
    };

    return (
      <>
        {contextHolder}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button onClick={openUpdatable}>打开可更新通知</Button>
          <Button onClick={updateNotification}>更新通知</Button>
          <Button onClick={destroySpecific}>销毁指定通知</Button>
          <Button onClick={destroyAll}>销毁所有通知</Button>
        </div>
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story: '支持通过 key 更新通知内容，以及销毁指定或所有通知。',
      },
    },
  },
};

// 配置示例
export const Configuration: StoryObj = {
  render: () => {
    const [api, contextHolder] = useNotification({
      placement: 'topLeft',
      top: 100,
      duration: 2,
      maxCount: 3,
    });

    const openMultiple = () => {
      for (let i = 1; i <= 5; i++) {
        setTimeout(() => {
          api.info({
            message: `通知 ${i}`,
            description: `这是第 ${i} 条通知，最多显示3条。`,
          });
        }, i * 200);
      }
    };

    return (
      <>
        {contextHolder}
        <Button onClick={openMultiple}>快速打开5条通知（最多显示3条）</Button>
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story: '可以配置默认位置、距离、持续时间、最大显示数量等。',
      },
    },
  },
};
