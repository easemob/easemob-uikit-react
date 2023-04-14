import React from 'react';
import { ComponentMeta } from '@storybook/react';
import { Dropdown } from './Dropdown';

export default {
	title: 'UI/Dropdown',
	component: Dropdown,
} as ComponentMeta<typeof Dropdown>;

export const basic = () => (
	<Dropdown
		menu={[
			<button
				onClick={() => {
					console.log('click Menu1');
				}}
			>
				Menu 1
			</button>,
			<button
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
