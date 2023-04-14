import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import TextMessage from '../../../module/textMessage';

import List from '../../../src/list';
import Header from '../../../module/header';
import { ContactItem, ContactList } from '../../../module/contactList';
import { Search } from '../../../src/input/Search';

// import type { ConversationData } from '../../../module/conversation';

import {
	ConversationItem,
	ConversationList,
	ConversationData,
} from '../../../module/conversation';
class Test extends React.Component {
	state: { num: { a: number } };
	constructor(props) {
		super(props);
		this.state = {
			num: { a: 1 },
		};
	}
	handleClick() {
		let num2 = this.state.num;
		num2.a++;
		this.setState({
			num: num2,
		});
	}

	render() {
		return (
			<div>
				<span>{this.state.num.a}</span>
				<button onClick={this.handleClick.bind(this)}></button>
			</div>
		);
	}
}

const mockCSData: ConversationData = [
	{
		chatType: 'singleChat',
		conversationId: 'zd2',
		name: '张东2', // 昵称/群组名称
		time: Date.now(), // 时间
		unreadCount: 3, // 会话未读数
		lastMessage: {
			type: 'txt',
			msg: 'hello 张东',
		}, // 会话最后一条消息
	},
	{
		chatType: 'singleChat',
		conversationId: 'zd3',
		name: '张东3', // 昵称/群组名称
		time: Date.now(), // 时间
		unreadCount: 3, // 会话未读数
		lastMessage: {
			type: 'txt',
			msg: 'hello 张东3',
		}, // 会话最后一条消息
	},
];

ReactDOM.createRoot(document.getElementById('contactRoot') as Element).render(
	<div className="container">
		{/* <TextMessage textMessage={{}}>
			asda ad adasddq ad das daq asd sdfdsf23f fw f
		</TextMessage> */}
		{/* <Test></Test> */}
		{/* <List height={150} itemCount={100} itemSize={30}>
			{List.Row}
		</List> */}
		{/* <Header></Header> */}
		{/* <ContactItem></ContactItem> */}

		{/* <div
			style={{
				height: '80%',
				background: 'red',
				position: 'absolute',
				width: '95%',
			}}
		>
			<ContactList></ContactList>
		</div> */}

		{/* <Search></Search> */}

		{/* <ConversationItem></ConversationItem> */}
		<div style={{ height: '500px', background: '#fff' }}>
			<ContactList data={mockCSData}></ContactList>
		</div>
	</div>
);
