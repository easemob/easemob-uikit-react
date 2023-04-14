import React, { ReactNode } from 'react';
import classNames from 'classnames';
import Avatar from '../../src/avatar';
import MessageStatus, {
	MessageStatusProps,
} from '../messageStatus/MessageStatus';
import { ConfigContext } from '../../src/config/index';
import './style/style.scss';
import { emoji } from '../messageEditor/emoji/emojiConfig';
import { getConversationTime } from '../utils';
import BaseMessage, { BaseMessageProps } from '../baseMessage';
import rootStore from '../store/index';
export interface TextMessage {
	from: string;
	to: string;
	time: number;
	msg: string;
	chatType: 'singleChat' | 'groupChat' | 'chatRoom';
	status: MessageStatusProps['status'];
	bySelf: boolean;
}

export interface TextMessageProps {
	textMessage: TextMessage;
	// color?: string; // 字体颜色
	// backgroundColor?: string; // 气泡背景颜色
	bubbleType?: 'primary' | 'secondly' | 'none'; // 气泡类型
	showCheck?: boolean; // 展示消息选择 check box
	status?: 'received' | 'read' | 'sent' | 'sending';
	avatar?: ReactNode;
	position?: 'left' | 'right'; // 左侧布局/右侧布局
	prefix?: string;

	type?: 'primary' | 'default'; // 气泡颜色种类
	shape?: 'ground' | 'square'; // 气泡形状
	arrow?: boolean; // 气泡是否有箭头
	nickName?: string; // 昵称
	className?: string;
	children?: React.ReactNode;
	style?: React.CSSProperties;
}

const renderTxt = (txt) => {
	if (txt === undefined) {
		return [];
	}
	let rnTxt: React.ReactNode[] = [];
	let match;
	const regex = /(\[.*?\])/g;
	let start = 0;
	let index = 0;
	while ((match = regex.exec(txt))) {
		index = match.index;
		if (index > start) {
			rnTxt.push(txt.substring(start, index));
		}
		if (match[1] in emoji.map) {
			const v = emoji.map[match[1]];
			rnTxt.push(
				<img
					key={
						Math.floor(Math.random() * 100000 + 1) +
						new Date().getTime().toString()
					}
					alt={v}
					src={
						new URL(
							`/module/assets/reactions/${v}`,
							import.meta.url
						).href
					}
					width={20}
					height={20}
					style={{
						verticalAlign: 'middle',
					}}
				/>
			);
		} else {
			rnTxt.push(match[1]);
		}
		start = index + match[1].length;
	}
	rnTxt.push(txt.substring(start, txt.length));

	return rnTxt;
};

export const TextMessage = (props: TextMessageProps) => {
	const {
		// color,
		// backgroundColor,
		avatar = true,
		position = 'right',
		status = 'default',
		prefix: customizePrefixCls,
		textMessage,
		className,
		style,
		nickName,
	} = props;
	const { getPrefixCls } = React.useContext(ConfigContext);
	const prefixCls = getPrefixCls('message-text', customizePrefixCls);
	let avatarToShow: ReactNode;
	if (avatar) {
		avatarToShow = <Avatar>{nickName}</Avatar>;
	}

	const classString = classNames(prefixCls, className);

	const MessageInfo = () => {};

	let { bySelf, time, from } = textMessage;
	if (typeof bySelf == 'undefined') {
		bySelf = from == rootStore.client.context.userId;
	}
	return (
		<BaseMessage
			direction={bySelf ? 'rtl' : 'ltr'}
			style={style}
			time={time}
			nickName={from}
			status={status}
		>
			<span className={classString}>{renderTxt(props.children)}</span>
		</BaseMessage>
		// <div className={classString} style={style}>
		// 	<div>
		// 		<span className={`${prefixCls}-nickname`}>
		// 			{textMessage.from}
		// 		</span>
		// 		<span className={`${prefixCls}-time`}>
		// 			{getConversationTime(textMessage.time)}
		// 		</span>
		// 	</div>
		// 	<div className={`${prefixCls}-body`}>
		// 		{avatarToShow}
		// 		<div className={`${prefixCls}-content`}>
		// 			{renderTxt(props.children)}
		// 		</div>
		// 		<MessageStatus status={status} type="icon"></MessageStatus>
		// 	</div>
		// </div>
	);
};
