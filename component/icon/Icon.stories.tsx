import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { Icon } from './Icon';
import { ICON_TYPES } from './const';
const lang = import.meta.env.VITE_CUSTOM_VAR as 'en' | 'zh';

const description = {
  en: {
    type: 'The type of the icon',
    width: 'The width of the icon',
    height: 'The height of the icon',
    color: 'The color of the icon',
    className: 'The className of the icon',
    onClick: 'The click event of the icon',
    style: 'The style of the icon',
  },
  zh: {
    type: '图标的类型',
    width: '图标的宽度',
    height: '图标的高度',
    color: '图标的颜色',
    className: '图标的类名',
    onClick: '图标的点击事件',
    style: '图标的样式',
  },
};

export default {
  title: 'pure component/Icon',
  component: Icon,
  argTypes: {
    type: {
      control: 'select',
      options: Object.values(ICON_TYPES),
      description: description[lang].type,
    },
    width: {
      control: 'number',
      description: description[lang].width,
    },
    height: {
      control: 'number',
      description: description[lang].height,
    },
    color: {
      control: 'color',
      description: description[lang].color,
    },
    className: {
      description: description[lang].className,
    },
    onClick: {
      description: description[lang].onClick,
    },
    style: {
      description: description[lang].style,
    },
  },
} as Meta<typeof Icon>;

const Template: StoryFn<typeof Icon> = args => <Icon {...args} />;

export const IconList = () => {
  return [
    ...Object.values(ICON_TYPES).map(item => {
      return (
        <>
          <h3>{item}</h3>
          <Icon type={item} width={50} height={50} />
        </>
      );
    }),
  ];
};

export const IconListGreen = () => {
  return [
    ...Object.values(ICON_TYPES).map(item => {
      return (
        <>
          <h3>{item}</h3>
          <Icon color="green" type={item} width={50} height={50} />
        </>
      );
    }),
  ];
};
