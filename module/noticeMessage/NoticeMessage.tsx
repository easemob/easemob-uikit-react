import React from 'react';
import classNames from 'classnames';

import './style/style.scss';

export interface NoticeMessageProps {
	noticeMessage: {
		from: string;
		to: string;
		id: string;
		chatType: 'singleChat' | 'groupChat' | 'chatRoom';
		time: number;
		message: string;
	};
}

const NoticeMessage = (props: NoticeMessageProps) => {
	const { noticeMessage } = props;
	const { message } = noticeMessage;
	return (
		<div className="message-notice-content">
			<span>{message}</span>
		</div>
	);
};

export { NoticeMessage };
