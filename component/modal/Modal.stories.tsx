import React, { useState } from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import Modal from './Modal';
import Button from '../button';
import Provider from '../../module/store/Provider';
export default {
  title: 'pure component/Modal',
  component: Modal,
  argTypes: {},
} as ComponentMeta<typeof Modal>;

const Template: ComponentStory<typeof Modal> = args => {
  const [isOpen, setOpen] = useState<boolean>(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>open</Button>
      <Modal {...args} onCancel={() => setOpen(false)} open={isOpen}>
        <p>Some contents...</p>
        <p>Some contents...</p>
        <p>Some contents...</p>
      </Modal>
    </>
  );
};

const DarkTemplate: ComponentStory<typeof Modal> = args => {
  const [isOpen, setOpen] = useState<boolean>(false);
  return (
    <Provider initConfig={{ appKey: 'a#b' }} theme={{ mode: 'dark' }}>
      <Button onClick={() => setOpen(true)}>open</Button>
      <Modal {...args} onCancel={() => setOpen(false)} open={isOpen}>
        <p>Some contents...</p>
        <p>Some contents...</p>
        <p>Some contents...</p>
      </Modal>
    </Provider>
  );
};

export const Default = Template.bind({});
export const Dark = DarkTemplate.bind({});

Default.args = {
  title: 'Title',
  okText: 'Confirm',
  cancelText: 'Cancel',
  closable: true,
};

Dark.args = {
  title: 'Title',
  okText: 'Confirm',
  cancelText: 'Cancel',
  closable: true,
};
