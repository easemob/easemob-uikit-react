import React from 'react';
import classNames from 'classnames';
import { ConfigContext } from '../../src/config/index';
import Icon, { IconProps } from '../../src/icon';
import './style/audioPlayer.scss';

export interface AudioPlayerProps {}

export interface AudioPlayerProps {
	play?: boolean;
	reverse?: boolean;
	size?: string | number;
	prefix?: string;
	className?: string;
}

const AudioPlayer = (props: AudioPlayerProps) => {
	const {
		play = false,
		reverse = false,
		size = 16,
		prefix: customizePrefixCls,
		className,
	} = props;
	const { getPrefixCls } = React.useContext(ConfigContext);
	const prefixCls = getPrefixCls('message-audio-player', customizePrefixCls);

	const classString = classNames(
		prefixCls,
		{
			[`${prefixCls}-play`]: !!play,
			[`${prefixCls}-reverse`]: !!reverse,
		},
		className
	);

	const style = {
		width: typeof size === 'string' ? size : `${size}px`,
		height: typeof size === 'string' ? size : `${size}px`,
	};
	return (
		<div className={classString} style={{ ...style }}>
			<Icon type="WAVE1" height={size} width={size}></Icon>
			<Icon type="WAVE2" height={size} width={size}></Icon>
			<Icon type="WAVE3" height={size} width={size}></Icon>
		</div>
	);
};

export { AudioPlayer };
