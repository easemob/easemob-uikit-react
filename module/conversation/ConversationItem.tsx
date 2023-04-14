import React, {
	FC,
	useState,
	ReactNode,
	useContext,
	MouseEventHandler,
} from 'react';
import classNames from 'classnames';
import { ConfigContext } from '../../src/config/index';
import './style/style.scss';
import Icon from '../../src/icon';
import Avatar from '../../src/avatar';
import Badge from '../../src/badge';
import { getConversationTime } from '../utils/index';
import type { ConversationData } from './ConversationList';
import { Tooltip } from '../../src/tooltip/Tooltip';
import { RootContext } from '../store/rootContext';
import { useTranslation } from 'react-i18next';
export interface ConversationItemProps {
	className?: string;
	prefix?: string;
	nickname?: string;
	avatarShape?: 'circle' | 'square';
	avatarSize?: number;
	onClick?: React.MouseEventHandler<HTMLDivElement>;
	style?: React.CSSProperties;
	badgeColor?: string; // 未读数气泡颜色
	isActive?: boolean; // 是否被选中
	data: ConversationData[0];
}

const ConversationItem: FC<ConversationItemProps> = (props) => {
	let {
		prefix: customizePrefixCls,
		className,
		nickname,
		avatarShape = 'square',
		avatarSize = 50,
		onClick,
		isActive = false,
		data,
		badgeColor,
		...others
	} = props;
	const { t } = useTranslation();
	const { getPrefixCls } = React.useContext(ConfigContext);
	const prefixCls = getPrefixCls('conversationItem', customizePrefixCls);
	const [showMore, setShowMore] = useState(false);
	const [active, setActive] = useState(isActive);

	const rootStore = useContext(RootContext).rootStore;
	const cvsStore = rootStore.conversationStore;

	const classString = classNames(
		prefixCls,
		{
			[`${prefixCls}-selected`]: !!isActive,
		},
		className
	);

	const handleClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
		console.log(e);
		// setActive(true);
		onClick && onClick(e);
	};

	const handleMouseOver = () => {
		setShowMore(true);
	};
	const handleMouseLeave = () => {
		setShowMore(false);
	};

	const deleteCvs: MouseEventHandler<HTMLLIElement> = (e) => {
		e.stopPropagation();

		cvsStore.deleteConversation(data);
		console.log('我要删除会话', data);

		rootStore.client
			.deleteConversation({
				channel: data.conversationId,
				chatType: data.chatType,
				deleteRoam: true,
			})
			.then(() => {
				console.log('删除成功');
			})
			.catch((err) => {
				console.log('删除失败', err);
			});
	};
	const morePrefixCls = getPrefixCls('moreAction', customizePrefixCls);
	const menu = (
		<ul className={morePrefixCls}>
			{[t('module.deleteCvs')].map((item, index) => {
				return (
					<li key={index} onClick={deleteCvs}>
						{item}
					</li>
				);
			})}
		</ul>
	);

	let lastMsg = '';
	switch (data.lastMessage.type) {
		case 'txt':
			lastMsg = data.lastMessage?.msg as string;
			break;
		case 'img':
			lastMsg = `/${t('module.image')}/`;
			break;
		case 'audio':
			lastMsg = `/${t('module.audio')}/`;
			break;
		case 'file':
			lastMsg = `/${t('module.file')}/`;
			break;
		case 'video':
			lastMsg = `/${t('module.video')}/`;
			break;
		case 'custom':
			lastMsg = `/${t('module.custom')}/`;
			break;
		default:
			console.warn('unexpected message type:', data.lastMessage.type);
			break;
	}
	if (data.chatType == 'groupChat') {
		const from =
			data.lastMessage.from &&
			data.lastMessage.from != rootStore.client.context.userId
				? `${data.lastMessage.from}:`
				: '';
		lastMsg = `${from}${lastMsg}`;
	}

	return (
		<div
			className={classString}
			onClick={handleClick}
			style={others.style}
			onMouseOver={handleMouseOver}
			onMouseLeave={handleMouseLeave}
		>
			<Avatar size={avatarSize} shape={avatarShape}></Avatar>
			<div className={`${prefixCls}-content`}>
				<span className={`${prefixCls}-nickname`}>
					{data.name || data.conversationId}
				</span>
				<span className={`${prefixCls}-message`}>{lastMsg}</span>
			</div>
			<div className={`${prefixCls}-info`}>
				<span className={`${prefixCls}-time`}>
					{getConversationTime(data.lastMessage.time)}
				</span>
				{showMore ? (
					<Tooltip
						title={menu}
						trigger="click"
						placement="bottom"
						arrow
					>
						{
							<Icon
								type="ELLIPSIS"
								color="#33B1FF"
								height={20}
							></Icon>
						}
					</Tooltip>
				) : (
					<div
						style={{
							height: '20px',
							position: 'relative',
						}}
					>
						<Badge
							count={data.unreadCount || 0}
							color={badgeColor || '#009EFF'}
						></Badge>
					</div>
				)}
			</div>
		</div>
	);
};

export { ConversationItem };
