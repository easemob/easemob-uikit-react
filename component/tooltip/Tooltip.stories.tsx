import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import Tooltip from './index';

const lang = import.meta.env.VITE_CUSTOM_VAR as 'en' | 'zh';

const description = {
  en: {
    title: 'The content of the tooltip',
    trigger: 'The trigger of the tooltip',
    open: 'Whether the tooltip is visible',
    defaultOpen: 'Whether the tooltip is visible by default',
    onOpenChange: 'The change event of the tooltip visibility',
    afterOpenChange: 'The event after the tooltip visibility changes',
    overlay: 'The content of the tooltip',
    overlayStyle: 'The style of the tooltip',
    overlayClassName: 'The className of the tooltip',
    prefixCls: 'The prefix of the tooltip className',
    mouseEnterDelay: 'The delay time before the tooltip appears',
    mouseLeaveDelay: 'The delay time before the tooltip disappears',
    getTooltipContainer: 'The container of the tooltip',
    destroyTooltipOnHide: 'Whether the tooltip is destroyed when hidden',
    align: 'The alignment of the tooltip',
    arrowContent: 'The content of the tooltip arrow',
    arrow: 'Whether the tooltip has an arrow',
    children: 'The content of the tooltip',
    style: 'The style of the tooltip',
    className: 'The className of the tooltip',
    color: 'The color of the tooltip',
    placement: 'The placement of the tooltip',
    builtinPlacements: 'The built-in placements of the tooltip',
    openClassName: 'The className of the tooltip when visible',
    arrowPointAtCenter: 'Whether the arrow points to the center',
    autoAdjustOverflow: 'Whether the tooltip adjusts overflow automatically',
    getPopupContainer: 'The container of the popup',
  },
  zh: {
    title: '提示框的内容',
    trigger: '提示框的触发方式',
    open: '提示框是否可见',
    defaultOpen: '提示框是否默认可见',
    onOpenChange: '提示框可见性改变事件',
    afterOpenChange: '提示框可见性改变后事件',
    overlay: '提示框的内容',
    overlayStyle: '提示框的样式',
    overlayClassName: '提示框的类名',
    prefixCls: '提示框类名的前缀',
    mouseEnterDelay: '提示框出现前的延迟时间',
    mouseLeaveDelay: '提示框消失前的延迟时间',
    getTooltipContainer: '提示框的容器',
    destroyTooltipOnHide: '提示框隐藏时是否销毁',
    align: '提示框的对齐方式',
    arrowContent: '提示框箭头的内容',
    arrow: '提示框是否有箭头',
    children: '提示框的内容',
    style: '提示框的样式',
    className: '提示框的类名',
    color: '提示框的颜色',
    placement: '提示框的位置',
    builtinPlacements: '提示框的内置位置',
    openClassName: '提示框可见时的类名',
    arrowPointAtCenter: '箭头是否指向中心',
    autoAdjustOverflow: '提示框是否自动调整溢出',
    getPopupContainer: '弹出框的容器',
  },
};

export default {
  title: 'pure component/Tooltip',
  component: Tooltip,
  argTypes: {
    title: {
      control: 'text',
      description: description[lang].title,
    },
    trigger: {
      control: 'select',
      options: ['hover', 'click'],
      description: description[lang].trigger,
    },
    open: {
      control: 'boolean',
      description: description[lang].open,
    },
    defaultOpen: {
      control: 'boolean',
      description: description[lang].defaultOpen,
    },
    onOpenChange: {
      description: description[lang].onOpenChange,
    },
    afterOpenChange: {
      description: description[lang].afterOpenChange,
    },
    overlay: {
      control: 'text',
      description: description[lang].overlay,
    },
    overlayStyle: {
      control: 'object',
      description: description[lang].overlayStyle,
    },
    overlayClassName: {
      control: 'text',
      description: description[lang].overlayClassName,
    },
    prefixCls: {
      control: 'text',
      description: description[lang].prefixCls,
    },
    mouseEnterDelay: {
      control: 'number',
      description: description[lang].mouseEnterDelay,
    },
    mouseLeaveDelay: {
      control: 'number',
      description: description[lang].mouseLeaveDelay,
    },
    getTooltipContainer: {
      description: description[lang].getTooltipContainer,
    },
    destroyTooltipOnHide: {
      control: 'boolean',
      description: description[lang].destroyTooltipOnHide,
    },
    align: {
      description: description[lang].align,
    },
    arrowContent: {
      description: description[lang].arrowContent,
    },
    arrow: {
      control: 'boolean',
      description: description[lang].arrow,
    },
    children: {
      description: description[lang].children,
    },
    style: {
      control: 'object',
      description: description[lang].style,
    },
    className: {
      control: 'text',
      description: description[lang].className,
    },
    color: {
      control: 'color',
      description: description[lang].color,
    },
    placement: {
      control: 'select',
      options: ['top', 'left', 'right', 'bottom'],
      description: description[lang].placement,
    },
    builtinPlacements: {
      description: description[lang].builtinPlacements,
    },
    openClassName: {
      control: 'text',
      description: description[lang].openClassName,
    },
    arrowPointAtCenter: {
      control: 'boolean',
      description: description[lang].arrowPointAtCenter,
    },
    autoAdjustOverflow: {
      control: 'boolean',
      description: description[lang].autoAdjustOverflow,
    },
    getPopupContainer: {
      description: description[lang].getPopupContainer,
    },
  },
} as Meta<typeof Tooltip>;

const Template: StoryFn<typeof Tooltip> = args => <Tooltip {...args}>hover</Tooltip>;

const Template2: StoryFn<typeof Tooltip> = args => <Tooltip {...args}>click</Tooltip>;

export const Hover = {
  render: Template,

  args: {
    title: (
      <ul>
        <li>item 1</li>
        <li>item 2</li>
      </ul>
    ),
  },
};

export const Click = {
  render: Template2,

  args: {
    title: (
      <ul>
        <li>item 1</li>
        <li>item 2</li>
      </ul>
    ),
    trigger: 'click',
  },
};
