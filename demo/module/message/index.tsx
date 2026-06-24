import React from 'react';
import ReactDOM from 'react-dom/client';
import { TextMessage } from '../../../module/textMessage';
import BaseMessage from '../../../module/baseMessage';
import FileMessage from '../../../module/fileMessage';
import AudioMessage from '../../../module/audioMessage';
import NoticeMessage from '../../../module/noticeMessage';
import ImageMessage from '../../../module/imageMessage';
import VideoMessage from '../../../module/videoMessage';
import type { ChatSDK } from '../../../module/SDK';

const baseMessage = {
	from: 'zd2',
	to: 'zd3',
	conversationId: 'zd3',
	conversationType: 'singleChat',
	timestamp: Date.now(),
	status: 'sent',
	direct: 'SEND',
	sender: { userId: 'zd2' },
} satisfies Partial<ChatSDK.Message>;

const textMessage = {
	...baseMessage,
	msgLocalId: 'text-local-1',
	msgServerId: 'text-server-1',
	type: 'text',
	body: {
		content: 'hello',
	},
} as ChatSDK.Message;

const fileMessage = {
	...baseMessage,
	msgLocalId: 'file-local-1',
	msgServerId: 'file-server-1',
	type: 'file',
	body: {
		url: 'http://baidu.com',
		filename: 'filename',
		filetype: 'text/plain',
		fileSize: 1024,
	},
} as ChatSDK.Message;

const audioMessage = {
	...baseMessage,
	msgLocalId: 'audio-local-1',
	msgServerId: 'audio-server-1',
	type: 'voice',
	body: {
		url: 'http://baidu.com/audio.wav',
		filename: 'audio name',
		filetype: 'audio',
		duration: 122,
		fileLength: 133,
	},
	file: {
		url: 'http://baidu.com/audio.wav',
		filename: 'audio name',
		filetype: 'audio',
		data: {} as File,
		length: 122,
		duration: 122,
	},
} as ChatSDK.Message;

const videoMessage = {
	...baseMessage,
	msgLocalId: 'video-local-1',
	msgServerId: 'video-server-1',
	type: 'video',
	body: {
		url: 'https://img1.baidu.com/it/u=676209011,1037182545&fm=253&fmt=auto&app=120&f=JPEG?w=1280&h=800',
		filename: 'filename',
		filetype: 'video/mp4',
		duration: 20,
		fileLength: 1024,
		thumbnailUrl:
			'https://img1.baidu.com/it/u=676209011,1037182545&fm=253&fmt=auto&app=120&f=JPEG?w=1280&h=800',
	},
} as ChatSDK.Message;

const imageMessage = {
	...baseMessage,
	msgLocalId: 'image-local-1',
	msgServerId: 'image-server-1',
	type: 'image',
	body: {
		localUrl: '',
		originalImageUrl:
			'https://img1.baidu.com/it/u=676209011,1037182545&fm=253&fmt=auto&app=120&f=JPEG?w=1280&h=800',
		bigImageUrl:
			'https://img1.baidu.com/it/u=676209011,1037182545&fm=253&fmt=auto&app=120&f=JPEG?w=1280&h=800',
		thumbnailUrl:
			'https://img1.baidu.com/it/u=676209011,1037182545&fm=253&fmt=auto&app=120&f=JPEG?w=1280&h=800',
		filename: 'haha',
		filetype: 'jpg',
		isGif: false,
		isOriginalImage: true,
	},
} as ChatSDK.Message;

ReactDOM.createRoot(document.getElementById('messageRoot') as Element).render(
	<div className="container">
		<TextMessage textMessage={textMessage}>
			asda ad adasddq ad das daq asd sdfdsf23f fw f
		</TextMessage>

		<BaseMessage>123</BaseMessage>

		<FileMessage fileMessage={fileMessage}></FileMessage>

		<FileMessage
			direction="ltr"
			fileMessage={{
				...fileMessage,
				msgLocalId: 'file-local-2',
				msgServerId: 'file-server-2',
				body: { ...fileMessage.body, filename: 'filename2' },
			}}
		></FileMessage>
		<AudioMessage audioMessage={audioMessage}></AudioMessage>

		<NoticeMessage
			noticeMessage={{
				message: 'admin message',
				time: 123123,
				noticeType: 'notice',
			}}
		></NoticeMessage>

		<NoticeMessage
			noticeMessage={{
				message: 'zd1 invite you to group',
				time: 123123,
				noticeType: 'notice',
			}}
		></NoticeMessage>

		<VideoMessage videoMessage={videoMessage}></VideoMessage>

		<ImageMessage imageMessage={imageMessage}></ImageMessage>

		<ImageMessage
			imageMessage={{
				...imageMessage,
				msgLocalId: 'image-local-2',
				msgServerId: 'image-server-2',
				body: {
					...imageMessage.body,
					originalImageUrl: 'https://tupian.qqw21.com/article/UploadPic/2015-2/2015292145190056.jpg',
					bigImageUrl: 'https://tupian.qqw21.com/article/UploadPic/2015-2/2015292145190056.jpg',
					thumbnailUrl: 'https://tupian.qqw21.com/article/UploadPic/2015-2/2015292145190056.jpg',
				},
			}}
		></ImageMessage>
	</div>
);
