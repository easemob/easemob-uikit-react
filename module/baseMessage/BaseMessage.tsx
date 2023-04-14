import React, { ReactNode } from 'react';
import classNames from 'classnames';
import { ConfigContext } from '../../src/config/index';
import MessageStatus, {
	MessageStatusProps,
} from '../messageStatus/MessageStatus';
import './style/style.scss';
import { cloneElement } from '../../src/_utils/reactNode';
import { getConversationTime } from '../utils';
import Avatar from '../../src/avatar';
export interface BaseMessageProps {
	bubbleType?: 'primary' | 'secondly' | 'none'; // 气泡类型
	status?: MessageStatusProps['status'];
	avatar?: ReactNode;
	direction?: 'ltr' | 'rtl'; // 左侧布局/右侧布局
	prefix?: string;

	type?: 'primary' | 'secondly'; // 气泡颜色种类
	shape?: 'ground' | 'square'; // 气泡形状
	arrow?: boolean; // 气泡是否有箭头
	nickName?: string; // 昵称
	className?: string;
	children?: React.ReactNode;
	style?: React.CSSProperties;
	time?: number;
}

const BaseMessage = (props: BaseMessageProps) => {
	const {
		avatar = true,
		direction = 'ltr',
		status = 'default',
		prefix: customizePrefixCls,
		className,
		bubbleType = 'primary',
		style,
		time,
		nickName,
	} = props;

	const { getPrefixCls } = React.useContext(ConfigContext);
	const prefixCls = getPrefixCls('message-base', customizePrefixCls);
	let avatarToShow: ReactNode = avatar;

	if (avatar) {
		avatarToShow = <Avatar>{nickName}</Avatar>;
	}

	const classString = classNames(
		prefixCls,
		{
			[`${prefixCls}-left`]: direction == 'ltr',
			[`${prefixCls}-right`]: direction == 'rtl',
			[`${prefixCls}-hasAvatar`]: !!avatar,
		},
		className
	);

	const hasBubble = bubbleType !== 'none';

	const contentNode = hasBubble ? (
		<div className={`${prefixCls}-content`}>{props.children}</div>
	) : (
		cloneElement(props.children, (oriProps) => ({
			style: {
				margin: '0 8px 0 12px',
				...oriProps.style,
			},
		}))
	);

	return (
		<div className={classString} style={{ ...style }}>
			{avatarToShow}
			<div className={`${prefixCls}-box`}>
				<div className={`${prefixCls}-info`}>
					<span className={`${prefixCls}-nickname`}>{nickName}</span>
					<span className={`${prefixCls}-time`}>
						{getConversationTime(time)}
					</span>
				</div>

				<div className={`${prefixCls}-body`}>
					{contentNode}
					<MessageStatus status={status} type="icon"></MessageStatus>
				</div>
			</div>
		</div>
	);
};

export { BaseMessage };
