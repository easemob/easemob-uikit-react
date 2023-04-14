import Badge from '../../src/badge/index';
import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
// import '../../dist/style.css';
import './badge.scss';
import Button from '../../src/button/index';

const Test = () => {
	let [count, setCount] = useState(1);

	const handleClick = () => {
		setCount(count++);
	};
	return (
		<Badge
			count={count}
			overflowCount={10}
			color="green"
			title="你好"
			dot={false}
			offset={[10, 10]}
		>
			<Button className="" onClick={handleClick}>
				点击增加
			</Button>
		</Badge>
	);
};

ReactDOM.createRoot(document.getElementById('badgeRoot') as Element).render(
	<div className="container">
		{/* <ConfigProvider
			value={{
				getPrefixCls: () => {
					return 'qqq';
				},
				iconPrefixCls: 'bamboo',
			}}
		> */}
		<Test></Test>
		{/* </ConfigProvider> */}
	</div>
);
