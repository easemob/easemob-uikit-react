import React from 'react';
import { Meta } from '@storybook/react';
import { Dropdown } from './Dropdown';

export default {
  title: 'pure component/Dropdown',
  component: Dropdown,
} as Meta<typeof Dropdown>;

export const basic = () => (
  <Dropdown
    menu={[
      <button
        key="1"
        onClick={() => {
          console.log('click Menu1');
        }}
      >
        Menu 1
      </button>,
      <button
        key="2"
        onClick={() => {
          console.log('click Menu2');
        }}
      >
        Menu 2
      </button>,
    ]}
  >
    <span>menu</span>
  </Dropdown>
);
