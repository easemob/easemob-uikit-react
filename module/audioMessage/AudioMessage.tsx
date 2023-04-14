import React, { useRef, useState } from 'react';
import classNames from 'classnames';
import BaseMessage, { BaseMessageProps } from '../baseMessage';
import { ConfigContext } from '../../src/config/index';
import './style/style.scss';
import type { AudioMessageType } from '../types/messageType';
import Avatar from '../../src/avatar';
import { AudioPlayer } from './AudioPlayer';
import rootStore from '../store/index';
export interface AudioMessageProps extends BaseMessageProps {
	audioMessage: AudioMessageType; // 从SDK收到的文件消息
	prefix?: string;
	style?: React.CSSProperties;
}

const AudioMessage = (props: AudioMessageProps) => {
	const [isPlaying, setPlayStatus] = useState(false);
	const { audioMessage, direction, style: customStyle } = props;

	const audioRef = useRef(null);
	const {
		url,
		file_length,
		length,
		file,
		time: messageTime,
		from,
		status,
	} = audioMessage;
	// const duration = body.length

	const playAudio = () => {
		setPlayStatus(true);
		(
			audioRef as unknown as React.MutableRefObject<HTMLAudioElement>
		).current
			.play()
			.then((res) => {
				console.log(res);
			})
			.catch((err) => {
				console.log('err', err);
			});
		// const time = audioMessage!.body!.length * 1000;
		// const time = file.duration * 1000;
		// setTimeout(() => {
		// 	setPlayStatus(false);
		// }, time + 200);
	};
	const handlePlayEnd = () => {
		setPlayStatus(false);
	};

	const duration = length || file.duration;
	const style = {
		width: `calc(208px * ${duration / 15} + 40px)`,
		maxWidth: '50vw',
	};
	let { bySelf } = audioMessage;
	if (typeof bySelf == 'undefined') {
		bySelf = from == rootStore.client.context.userId;
	}
	return (
		<BaseMessage
			direction={bySelf ? 'rtl' : 'ltr'}
			style={customStyle}
			time={messageTime}
			nickName={from}
			status={status}
		>
			<div
				className="message-audio-content"
				onClick={playAudio}
				style={{ ...style }}
			>
				<AudioPlayer
					play={isPlaying}
					reverse={bySelf}
					size={20}
				></AudioPlayer>
				<span className="message-audio-duration">
					{duration + '"' || 0}
				</span>
				<audio
					src={file.url || url}
					ref={audioRef}
					onEnded={handlePlayEnd}
					onError={handlePlayEnd}
					onStalled={handlePlayEnd}
				/>
			</div>
		</BaseMessage>
	);
};

export { AudioMessage };
