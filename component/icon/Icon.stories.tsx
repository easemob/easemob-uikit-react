import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import { Icon } from './Icon';
import { ICON_TYPES } from './const';

export default {
  title: 'pure component/Icon',
  component: Icon,
  argTypes: {
    color: { control: 'color' },
  },
} as ComponentMeta<typeof Icon>;

const Template: ComponentStory<typeof Icon> = args => <Icon {...args} />;

export const WithControl = Template.bind({});

WithControl.args = {
  type: 'SHUT_DOWN',
};

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
