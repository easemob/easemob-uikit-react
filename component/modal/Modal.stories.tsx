import React, { useState } from 'react';
import { StoryFn, Meta } from '@storybook/react';
import Modal from './Modal';
import Button from '../button';
import Provider from '../../module/store/Provider';
export default {
  title: 'pure component/Modal',
  component: Modal,
  argTypes: {},
} as Meta<typeof Modal>;

const Template: StoryFn<typeof Modal> = args => {
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

const DarkTemplate: StoryFn<typeof Modal> = args => {
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

export const Default = {
  render: Template,

  args: {
    title: 'Title',
    okText: 'Confirm',
    cancelText: 'Cancel',
    closable: true,
  },
};

export const Dark = {
  render: DarkTemplate,

  args: {
    title: 'Title',
    okText: 'Confirm',
    cancelText: 'Cancel',
    closable: true,
  },
};
