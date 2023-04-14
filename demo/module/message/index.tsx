import React from 'react';
import ReactDOM from 'react-dom/client';
import TextMessage from '../../../module/textMessage';
import BaseMessage from '../../../module/baseMessage';
import FileMessage from '../../../module/fileMessage';
import AudioMessage from '../../../module/audioMessage';
import NoticeMessage from '../../../module/noticeMessage';
import ImageMessage from '../../../module/imageMessage';
import VideoMessage from '../../../module/videoMessage';

ReactDOM.createRoot(document.getElementById('messageRoot') as Element).render(
	<div className="container">
		<TextMessage
			textMessage={{
				from: 'zd2',
				to: 'zd3',
				time: Date.now(),
				msg: 'hello',
				chatType: 'singleChat',
				status: 'sent',
			}}
		>
			asda ad adasddq ad das daq asd sdfdsf23f fw f
		</TextMessage>

		<BaseMessage>123</BaseMessage>

		<FileMessage
			fileMessage={{
				filename: 'filename',
				type: 'file',
				from: 'zd1',
				to: 'zd2',
				id: '12313',
				chatType: 'singleChat',
				time: 123123123,
				file: {
					url: 'http://baidu.com',
					filename: 'filename',
					filetype: 'txt',
					data: [] as any as File,
				},
			}}
		></FileMessage>

		<FileMessage
			direction="ltr"
			fileMessage={{
				filename: 'filename2',
				type: 'file',
				from: 'zd1',
				to: 'zd2',
				id: '12313',
				chatType: 'singleChat',
				time: 123123123,
				file: {
					url: 'http://baidu.com',
					filename: 'filename',
					filetype: 'txt',
					data: [] as any as File,
				},
			}}
		></FileMessage>
		<AudioMessage
			audioMessage={{
				id: '12',
				from: 'zd1',
				to: 'zd2',
				chatType: 'singleChat',
				time: 123123,
				type: 'audio',
				file: {},
				filename: 'audio name',
				length: 122,
				file_length: 133,
			}}
		></AudioMessage>

		<NoticeMessage
			noticeMessage={{
				message: 'admin message',
				id: '12',
				from: 'zd1',
				to: 'zd2',
				chatType: 'singleChat',
				time: 123123,
			}}
		></NoticeMessage>

		<NoticeMessage
			noticeMessage={{
				message: 'zd1 invite you to group',
				id: '12',
				from: 'zd1',
				to: 'zd2',
				chatType: 'singleChat',
				time: 123123,
			}}
		></NoticeMessage>

		<VideoMessage
			videoMessage={{
				type: 'video',
				id: '1232',
				from: 'zd2',
				to: 'zd1',
				chatType: 'singleChat',
				time: 123,
				file: {
					url: 'https://img1.baidu.com/it/u=676209011,1037182545&fm=253&fmt=auto&app=120&f=JPEG?w=1280&h=800',
					filename: 'haha',
					filetype: 'jpg',
					data: {} as File,
				},
				filename: 'filename',
				length: 20,
				file_length: 1024,
			}}
		></VideoMessage>

		<ImageMessage
			imageMessage={{
				type: 'image',
				id: '1232',
				from: 'zd2',
				to: 'zd1',
				chatType: 'singleChat',
				time: 123,
				file: {
					url: 'https://img1.baidu.com/it/u=676209011,1037182545&fm=253&fmt=auto&app=120&f=JPEG?w=1280&h=800',
					filename: 'haha',
					filetype: 'jpg',
					data: {} as File,
				},
			}}
		></ImageMessage>

		<ImageMessage
			imageMessage={{
				type: 'image',
				id: '1232',
				from: 'zd2',
				to: 'zd1',
				chatType: 'singleChat',
				time: 123,
				file: {
					url: 'https://tupian.qqw21.com/article/UploadPic/2015-2/2015292145190056.jpg',
					filename: 'haha',
					filetype: 'jpg',
					data: {} as File,
				},
			}}
		></ImageMessage>
	</div>
);
