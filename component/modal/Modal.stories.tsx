import React, { useState } from 'react';
import { StoryFn, Meta } from '@storybook/react';
import Modal, { ModalProps } from './Modal';
import Button from '../button';
import Provider from '../../module/store/Provider';

const lang = import.meta.env.VITE_CUSTOM_VAR as 'en' | 'zh';

const description = {
  en: {
    title: 'The title of the modal',
    okText: 'The text of the ok button',
    closable: 'Whether the modal is closable',
    open: 'Whether the modal is visible',
    onCancel: 'The cancel event of the modal',
    onOk: 'The ok event of the modal',
    afterClose: 'The event after the modal is closed',
    cancelText: 'The text of the cancel button',
    footer: 'The footer of the modal',
    centered: 'Whether the modal is vertically centered',
    maskClosable: 'Whether the modal can be closed by clicking the mask',
    cancelType: 'The type of the cancel button',
    forceRender: 'Whether the modal is rendered when it is not visible',
    okButtonProps: 'The props of the ok button',
    cancelButtonProps: 'The props of the cancel button',
    destroyOnClose: 'Whether the modal is destroyed when it is closed',
    style: 'The style of the modal',
    wrapClassName: 'The className of the modal wrapper',
    maskTransitionName: 'The transition name of the mask',
    transitionName: 'The transition name of the modal',
    className: 'The className of the modal',
    getContainer: 'The container of the modal',
    zIndex: 'The z-index of the modal',
    bodyStyle: 'The style of the modal body',
    maskStyle: 'The style of the mask',
    mask: 'Whether the modal has a mask',
    keyboard: 'Whether the modal can be closed by pressing the escape key',
    wrapProps: 'The props of the modal wrapper',
    prefixCls: 'The prefix of the modal className',
    closeIcon: 'The close icon of the modal',
    modalRender: 'The render of the modal',
    focusTriggerAfterClose: 'Whether the modal is focused after it is closed',
    children: 'The content of the modal',
  },
  zh: {
    title: '模态框的标题',
    okText: '确定按钮的文字',
    closable: '模态框是否可关闭',
    open: '模态框是否可见',
    onCancel: '模态框的取消事件',
    onOk: '模态框的确定事件',
    afterClose: '模态框关闭后的事件',
    cancelText: '取消按钮的文字',
    footer: '模态框的底部',
    centered: '模态框是否垂直居中',
    maskClosable: '是否可以通过点击遮罩层关闭模态框',
    cancelType: '取消按钮的类型',
    forceRender: '模态框在不可见时是否渲染',
    okButtonProps: '确定按钮的属性',
    cancelButtonProps: '取消按钮的属性',
    destroyOnClose: '模态框关闭时是否销毁',
    style: '模态框的样式',
    wrapClassName: '模态框包裹器的类名',
    maskTransitionName: '遮罩层的过渡类名',
    transitionName: '模态框的过渡类名',
    className: '模态框的类名',
    getContainer: '模态框的容器',
    zIndex: '模态框的 z-index',
    bodyStyle: '模态框内容的样式',
    maskStyle: '遮罩层的样式',
    mask: '模态框是否有遮罩',
    keyboard: '是否可以通过按下 Esc 键关闭模态框',
    wrapProps: '模态框包裹器的属性',
    prefixCls: '模态框类名的前缀',
    closeIcon: '模态框的关闭图标',
    modalRender: '模态框的渲染',
    focusTriggerAfterClose: '模态框关闭后是否聚焦',
    children: '模态框的内容',
  },
};

export default {
  title: 'pure component/Modal',
  component: Modal,
  // 将 ModalProps 中的所有属性作为参数传递
  argTypes: {
    title: {
      control: 'text',
      description: description[lang].title,
    },
    okText: {
      control: 'text',
      description: description[lang].okText,
    },
    closable: {
      control: 'boolean',
      description: description[lang].closable,
    },
    open: {
      control: 'boolean',
      description: description[lang].open,
    },
    onCancel: {
      description: description[lang].onCancel,
    },
    onOk: {
      description: description[lang].onOk,
    },
    afterClose: {
      description: description[lang].afterClose,
    },
    cancelText: {
      control: 'text',
      description: description[lang].cancelText,
    },
    footer: {
      description: description[lang].footer,
    },
    centered: {
      control: 'boolean',
      description: description[lang].centered,
    },
    maskClosable: {
      control: 'boolean',
      description: description[lang].maskClosable,
    },
    cancelType: {
      control: 'select',
      options: ['primary', 'default', 'ghost', 'text'],
      description: description[lang].cancelType,
    },
    forceRender: {
      control: 'boolean',
      description: description[lang].forceRender,
    },
    okButtonProps: {
      description: description[lang].okButtonProps,
    },
    cancelButtonProps: {
      description: description[lang].cancelButtonProps,
    },
    destroyOnClose: {
      control: 'boolean',
      description: description[lang].destroyOnClose,
    },
    style: {
      control: 'object',
      description: description[lang].style,
    },
    wrapClassName: {
      control: 'text',
      description: description[lang].wrapClassName,
    },
    maskTransitionName: {
      control: 'text',
      description: description[lang].maskTransitionName,
    },
    transitionName: {
      control: 'text',
      description: description[lang].transitionName,
    },
    className: {
      control: 'text',
      description: description[lang].className,
    },
    getContainer: {
      description: description[lang].getContainer,
    },
    zIndex: {
      control: 'number',
      description: description[lang].zIndex,
    },
    bodyStyle: {
      control: 'object',
      description: description[lang].bodyStyle,
    },
    maskStyle: {
      control: 'object',
      description: description[lang].maskStyle,
    },
    mask: {
      control: 'boolean',
      description: description[lang].mask,
    },
    keyboard: {
      control: 'boolean',
      description: description[lang].keyboard,
    },
    wrapProps: {
      description: description[lang].wrapProps,
    },
    prefixCls: {
      control: 'text',
      description: description[lang].prefixCls,
    },
    closeIcon: {
      description: description[lang].closeIcon,
    },
    modalRender: {
      description: description[lang].modalRender,
    },
    focusTriggerAfterClose: {
      control: 'boolean',
      description: description[lang].focusTriggerAfterClose,
    },
    children: {
      description: description[lang].children,
    },
  },
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
