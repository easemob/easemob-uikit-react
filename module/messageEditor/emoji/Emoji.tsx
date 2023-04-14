import React, { ReactNode, useState } from 'react';
import { Tooltip } from '../../../src/tooltip/Tooltip';
import Button from '../../../src/button';
import { emoji } from './emojiConfig';
import Icon from '../../../src/icon';
import './style/style.scss';
const emojiWidth = 25;
const emojiPadding = 5;

export interface EmojiProps {
	icon?: ReactNode;
	onSelected?: (emojiString: keyof typeof emoji.map) => void;
	trigger?: 'click' | 'hover';
	config?: { map: any; path: string };
	onClick?: (e: React.MouseEvent<Element, MouseEvent>) => void;
}

const Emoji = (props: EmojiProps) => {
	const { onSelected, icon, trigger = 'click', onClick } = props;
	const [isOpen, setOpen] = useState(false);
	const renderEmoji = () => {
		return Object.keys(emoji.map).map((k) => {
			const v = emoji.map[k];
			return (
				<Button key={k}>
					<div>
						<img
							src={
								new URL(
									`/module/assets/reactions/${v}`,
									import.meta.url
								).href
							}
							alt={k}
							width={emojiWidth}
							height={emojiWidth}
						/>
					</div>
				</Button>
			);
		});
	};
	const handleEmojiClick = (e) => {
		e.preventDefault();
		const emoji = e.target.alt || e.target.children[0].alt;
		console.log('emoji', emoji);
		// setOpen(false);
		onSelected && onSelected(emoji);
	};

	const handleClickIcon = (e: React.MouseEvent<Element, MouseEvent>) => {
		onClick && onClick(e);
	};
	const titleNode = <div onClick={handleEmojiClick}>{renderEmoji()}</div>;
	const iconNode = icon ? (
		icon
	) : (
		<span className="icon-container">
			<Icon
				type="FACE"
				width={20}
				height={20}
				onClick={handleClickIcon}
				// onClick={() => setOpen(true)}
			></Icon>
		</span>
	);
	return (
		<Tooltip
			title={titleNode}
			trigger={trigger}
			arrowPointAtCenter={false}
			arrow={false}
			// open={isOpen}
		>
			{iconNode}
		</Tooltip>
	);
};

export { Emoji };
