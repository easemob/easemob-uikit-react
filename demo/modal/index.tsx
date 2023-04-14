import React, { useReducer, useState } from 'react';
import ReactDOM from 'react-dom/client';
import Avatar from '../../src/avatar/index';
import Modal from '../../src/modal';
import Button from '../../src/button';
const Test = () => {
	const [open, setOpen] = useState(false);

	const handleClick = (isOpen) => () => {
		console.log(isOpen);
		setOpen(isOpen);
	};
	return (
		<>
			<Button onClick={handleClick(true)}>open</Button>
			<Button onClick={handleClick(false)}>close</Button>

			<Modal
				open={open}
				onCancel={handleClick(false)}
				title="Title"
				okText="确认"
				cancelText="取消"
			>
				<p>Some contents...</p>
				<p>Some contents...</p>
				<p>Some contents...</p>
			</Modal>
		</>
	);
};

ReactDOM.createRoot(document.getElementById('modalRoot') as Element).render(
	<div className="container">
		<Test></Test>
	</div>
);
