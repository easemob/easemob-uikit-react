import React from 'react';
import ReactDOM from 'react-dom/client';
import { Button, Input } from './entry';

ReactDOM.createRoot(document.getElementById('root') as Element).render(
	<div>
		<Button>Button</Button>
		<Input />
	</div>
);
