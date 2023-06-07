import React, { useState } from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import Modal from './Modal';
import Button from '../button';
export default {
	title: 'UI/Modal',
	component: Modal,
	argTypes: {
		backgroundColor: { control: 'color' },
	},
} as ComponentMeta<typeof Modal>;

const Template: ComponentStory<typeof Modal> = (args) => {
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

export const Primary = Template.bind({});

Primary.args = {
	title: '标题',
	okText: '确认',
	cancelText: '取消',
	closable: true,
};
